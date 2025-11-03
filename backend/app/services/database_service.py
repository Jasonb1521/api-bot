"""
Database service for PostgreSQL operations
Handles menu item queries, inventory management, and order processing
"""

import asyncpg
import os
from typing import List, Dict, Optional, Any
from datetime import datetime


class DatabaseService:
    """Service for PostgreSQL database operations"""

    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '5432')),
            'database': os.getenv('DB_NAME', 'hotelbot'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'postgres123'),
            'min_size': 5,
            'max_size': 20,
            'command_timeout': 60
        }

    async def initialize(self):
        """Initialize database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(**self.db_config)
            print(f"✓ Database pool created: {self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}")

            # Test connection
            async with self.pool.acquire() as conn:
                version = await conn.fetchval('SELECT version()')
                print(f"✓ PostgreSQL version: {version.split(',')[0]}")

                # Check if menu_items table exists and has data
                count = await conn.fetchval('SELECT COUNT(*) FROM menu_items')
                print(f"✓ Menu items in database: {count}")

        except Exception as e:
            print(f"✗ Database initialization failed: {e}")
            raise

    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            print("✓ Database pool closed")

    async def get_all_menu_items(self) -> List[Dict[str, Any]]:
        """
        Get all menu items from database

        Returns:
            List of menu items with all fields
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch('''
                SELECT
                    dish_id, name, description, category, price,
                    quantity, dietary_tags, meal_period, popularity_score,
                    availability_status, image
                FROM menu_items
                ORDER BY category, popularity_score DESC
            ''')

            return [dict(row) for row in rows]

    async def get_available_menu_items(self) -> List[Dict[str, Any]]:
        """
        Get only available menu items (quantity > 0)

        Returns:
            List of available menu items
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch('''
                SELECT
                    dish_id, name, description, category, price,
                    quantity, dietary_tags, meal_period, popularity_score,
                    availability_status, image
                FROM menu_items
                WHERE availability_status = 'available' AND quantity > 0
                ORDER BY category, popularity_score DESC
            ''')

            return [dict(row) for row in rows]

    async def get_item_by_dish_id(self, dish_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific menu item by dish_id

        Args:
            dish_id: The dish ID to look up

        Returns:
            Menu item dict or None if not found
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT
                    dish_id, name, description, category, price,
                    quantity, dietary_tags, meal_period, popularity_score,
                    availability_status, image
                FROM menu_items
                WHERE dish_id = $1
            ''', dish_id)

            return dict(row) if row else None

    async def check_item_availability(self, dish_id: str) -> tuple[bool, int]:
        """
        Check if an item is available and get its quantity

        Args:
            dish_id: The dish ID to check

        Returns:
            Tuple of (is_available, quantity)
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT availability_status, quantity
                FROM menu_items
                WHERE dish_id = $1
            ''', dish_id)

            if not row:
                return False, 0

            is_available = row['availability_status'] == 'available' and row['quantity'] > 0
            return is_available, row['quantity']

    async def decrement_item_quantity(self, dish_id: str, quantity: int = 1) -> bool:
        """
        Decrement the quantity of a menu item (when order is confirmed)
        Auto-updates availability_status to 'unavailable' if quantity reaches 0

        Args:
            dish_id: The dish ID to update
            quantity: Amount to decrement (default 1)

        Returns:
            True if successful, False if item not found or insufficient quantity
        """
        async with self.pool.acquire() as conn:
            # Check current quantity
            current_qty = await conn.fetchval(
                'SELECT quantity FROM menu_items WHERE dish_id = $1',
                dish_id
            )

            if current_qty is None:
                print(f"✗ Item {dish_id} not found")
                return False

            if current_qty < quantity:
                print(f"✗ Insufficient quantity for {dish_id}: {current_qty} < {quantity}")
                return False

            # Update quantity (trigger will auto-update availability_status)
            new_qty = await conn.fetchval('''
                UPDATE menu_items
                SET quantity = quantity - $1
                WHERE dish_id = $2
                RETURNING quantity
            ''', quantity, dish_id)

            print(f"✓ Updated {dish_id}: quantity {current_qty} → {new_qty}")

            return True

    async def update_item_quantity(self, dish_id: str, new_quantity: int) -> bool:
        """
        Update the quantity of a menu item (admin operation)
        Auto-updates availability_status based on quantity

        Args:
            dish_id: The dish ID to update
            new_quantity: New quantity value

        Returns:
            True if successful, False if item not found
        """
        async with self.pool.acquire() as conn:
            result = await conn.execute('''
                UPDATE menu_items
                SET quantity = $1
                WHERE dish_id = $2
            ''', new_quantity, dish_id)

            if result == "UPDATE 0":
                return False

            print(f"✓ Updated {dish_id} quantity to {new_quantity}")
            return True

    async def get_items_by_category(self, category: str) -> List[Dict[str, Any]]:
        """
        Get menu items by category

        Args:
            category: Category name

        Returns:
            List of menu items in that category
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch('''
                SELECT
                    dish_id, name, description, category, price,
                    quantity, dietary_tags, meal_period, popularity_score,
                    availability_status, image
                FROM menu_items
                WHERE category = $1 AND availability_status = 'available'
                ORDER BY popularity_score DESC
            ''', category)

            return [dict(row) for row in rows]

    async def get_item_by_name(self, dish_name: str) -> Optional[Dict[str, Any]]:
        """
        Find menu item by name (fuzzy match using LIKE)

        Args:
            dish_name: Dish name to search (e.g., "Idli", "Coffee")

        Returns:
            Menu item dict with all fields or None if not found
        """
        if not self.pool:
            raise RuntimeError("Database pool not initialized")

        async with self.pool.acquire() as conn:
            # Fuzzy search with LIKE - case insensitive
            row = await conn.fetchrow('''
                SELECT
                    dish_id, name, description, category, price,
                    quantity, dietary_tags, meal_period, popularity_score,
                    availability_status, image
                FROM menu_items
                WHERE LOWER(name) LIKE LOWER($1)
                AND availability_status = 'available'
                ORDER BY popularity_score DESC
                LIMIT 1
            ''', f'%{dish_name}%')

            if row:
                return dict(row)
            else:
                print(f"✗ Item not found: {dish_name}")
                return None

    async def get_database_stats(self) -> Dict[str, Any]:
        """
        Get database statistics

        Returns:
            Dict with total items, available items, unavailable items, categories
        """
        async with self.pool.acquire() as conn:
            stats = await conn.fetchrow('''
                SELECT
                    COUNT(*) as total_items,
                    COUNT(*) FILTER (WHERE availability_status = 'available' AND quantity > 0) as available_items,
                    COUNT(*) FILTER (WHERE availability_status = 'unavailable' OR quantity = 0) as unavailable_items,
                    COUNT(DISTINCT category) as total_categories,
                    SUM(quantity) as total_stock
                FROM menu_items
            ''')

            return dict(stats)


# Global database service instance
db_service = DatabaseService()
