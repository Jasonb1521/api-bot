"""Vector store service for menu retrieval using Qdrant."""

import json
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    MatchAny
)
try:
    # Using sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 for multilingual embeddings (384d)
    from sentence_transformers import SentenceTransformer
except Exception:
    # If sentence_transformers isn't present or fails, defer import error until runtime
    SentenceTransformer = None

from app.services.database_service import db_service

logger = logging.getLogger(__name__)


def get_meal_period(hour: int) -> str:
    """
    Determine meal period based on hour of day.

    Args:
        hour: Hour in 24-hour format (0-23)

    Returns:
        Meal period string: "Breakfast", "Lunch", "Dinner", or "All-Day"
    """
    if 6 <= hour < 11:
        return "Breakfast"
    elif 11 <= hour < 16:
        return "Lunch"
    elif 16 <= hour < 23:
        return "Dinner"
    else:
        return "All-Day"


class VectorStoreService:
    """Service for managing menu items in Qdrant vector database."""

    def __init__(self, client: QdrantClient, embedding_model):
        """
        Initialize vector store service.

        Args:
            client: Qdrant client instance
            embedding_model: Sentence transformer model for embeddings
        """
        self.client = client
        self.embedding_model = embedding_model
        self.collection_name = "restaurant_menu"
        # Allow dynamic vector size detection
        self.vector_size = None

    async def initialize_collection(self, menu_file_path: str = "/app/app/data/menu.json"):
        """
        Initialize Qdrant collection with menu embeddings.
        Loads from PostgreSQL database instead of menu.json file.

        Args:
            menu_file_path: Path to menu JSON file (deprecated, kept for compatibility)
        """
        try:
            # Remove existing collection to ensure clean re-ingest (idempotent)
            try:
                collections = self.client.get_collections().collections
                if any(col.name == self.collection_name for col in collections):
                    logger.info(f"Deleting existing collection '{self.collection_name}' for clean re-ingest")
                    self.client.delete_collection(collection_name=self.collection_name)
            except Exception:
                # Continue even if delete fails; we'll try to create below
                logger.debug("Could not list or delete existing collections (may not exist)")

            # Determine vector size dynamically from the model (if possible)
            try:
                if hasattr(self.embedding_model, 'get_sentence_embedding_dimension'):
                    self.vector_size = int(self.embedding_model.get_sentence_embedding_dimension())
                elif hasattr(self.embedding_model, 'encode'):
                    # Fallback: compute one embedding to infer size
                    sample = "sample"
                    emb = self.embedding_model.encode(sample)
                    self.vector_size = len(emb)
                else:
                    # Default to 384 for paraphrase-multilingual-MiniLM-L12-v2
                    self.vector_size = 384
            except Exception:
                logger.warning("Could not infer embedding size from model, defaulting to 384")
                self.vector_size = 384

            # Create collection with detected vector size
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE)
            )
            logger.info(f"Created collection '{self.collection_name}' with vector size {self.vector_size}")

            # Load menu from PostgreSQL (instead of JSON file)
            logger.info("Loading menu items from PostgreSQL database...")
            menu_items = await db_service.get_all_menu_items()
            logger.info(f"Loaded {len(menu_items)} menu items from database")

            # Create embeddings and points
            points = []
            for item in menu_items:
                # Create embedding text
                embedding_text = f"{item['category']}: {item['name']}. {item['description']}"
                emb = self.embedding_model.encode(embedding_text)
                # Ensure we convert numpy arrays to Python lists for Qdrant
                try:
                    embedding = emb.tolist()
                except Exception:
                    embedding = list(emb)

                # Create point
                point_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, item["dish_id"]))
                point = PointStruct(
                    id=point_uuid,
                    vector=embedding,
                    payload={
                        "dish_id": item["dish_id"],
                        "name": item["name"],
                        "description": item["description"],
                        "category": item["category"],
                        "meal_period": item.get("meal_period", "All-Day"),
                        "price": float(item["price"]),
                        "popularity_score": item.get("popularity_score", 5),
                        "dietary_tags": item.get("dietary_tags", []),
                        "availability_status": item.get("availability_status", "available"),
                        "quantity": item.get("quantity", 0)  # Include quantity from DB
                    }
                )
                points.append(point)

            # Upsert points
            self.client.upsert(collection_name=self.collection_name, points=points)
            logger.info(f"Ingested {len(points)} menu items into Qdrant from PostgreSQL")

        except Exception as e:
            logger.error(f"Error initializing Qdrant collection: {e}")
            raise

    def search_menu(
        self,
        query_text: str,
        current_hour: int = None,
        top_k: int = 10
    ) -> list:
        """
        Search menu with semantic similarity and time-based filtering.

        Args:
            query_text: Customer's query
            current_hour: Hour of the day (0-23) for meal period filtering
            top_k: Number of results to return

        Returns:
            List of search results with payloads
        """
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query_text).tolist()

            # Build filter conditions
            filter_conditions = [
                FieldCondition(
                    key="availability_status",
                    match=MatchValue(value="available")
                )
            ]

            # Time filter disabled - show all meal periods

            # Create filter
            search_filter = Filter(must=filter_conditions) if filter_conditions else None

            # Perform search
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=top_k,
                with_payload=True
            )

            return results

        except Exception as e:
            logger.error(f"Error searching menu: {e}")
            return []

    def format_menu_context(self, results: list) -> str:
        """
        Format search results for LLM prompt.

        Args:
            results: List of search results from Qdrant

        Returns:
            Formatted menu string
        """
        if not results:
            return "No items currently available."

        menu_items = []
        for result in results:
            payload = result.payload
            # Include description for Tamil context
            item_text = f"- {payload['name']}: {payload['description']}"
            if 'price' in payload:
                item_text += f" (விலை: {payload['price']} ரூபாய்)"
            menu_items.append(item_text)

        return "\n".join(menu_items)

    async def sync_from_database(self):
        """
        Sync Qdrant collection with latest data from PostgreSQL.
        This updates existing items and adds new ones.
        Called periodically to keep Qdrant in sync with database.
        """
        try:
            logger.debug("Starting Qdrant sync from PostgreSQL...")

            # Get all menu items from database
            menu_items = await db_service.get_all_menu_items()
            logger.debug(f"Loaded {len(menu_items)} menu items from database for sync")

            if not menu_items:
                logger.warning("No menu items found in database, skipping sync")
                return

            # Create/update embeddings and points
            points = []
            for item in menu_items:
                # Create embedding text
                embedding_text = f"{item['category']}: {item['name']}. {item['description']}"
                emb = self.embedding_model.encode(embedding_text)

                # Convert to list
                try:
                    embedding = emb.tolist()
                except Exception:
                    embedding = list(emb)

                # Create point with same UUID as initialization
                point_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, item["dish_id"]))
                point = PointStruct(
                    id=point_uuid,
                    vector=embedding,
                    payload={
                        "dish_id": item["dish_id"],
                        "name": item["name"],
                        "description": item["description"],
                        "category": item["category"],
                        "meal_period": item.get("meal_period", "All-Day"),
                        "price": float(item["price"]),
                        "popularity_score": item.get("popularity_score", 5),
                        "dietary_tags": item.get("dietary_tags", []),
                        "availability_status": item.get("availability_status", "available"),
                        "quantity": item.get("quantity", 0)
                    }
                )
                points.append(point)

            # Upsert all points (updates existing, adds new)
            self.client.upsert(collection_name=self.collection_name, points=points)
            logger.debug(f"✓ Synced {len(points)} menu items from PostgreSQL to Qdrant")

        except Exception as e:
            logger.error(f"Error syncing Qdrant from database: {e}")
