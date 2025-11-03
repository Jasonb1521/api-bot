#!/usr/bin/env python3
"""
Migration script to load menu.json data into PostgreSQL database
This script reads the existing menu.json file and populates the menu_items table
"""

import json
import asyncio
import asyncpg
import os
from pathlib import Path


async def migrate_menu_to_postgres():
    """Load menu.json data into PostgreSQL"""

    # Database connection parameters
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'hotelbot')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres123')

    # Read menu.json
    menu_json_path = Path(__file__).parent.parent / 'app' / 'data' / 'menu.json'

    print(f"Reading menu data from: {menu_json_path}")

    with open(menu_json_path, 'r', encoding='utf-8') as f:
        menu_data = json.load(f)

    items = menu_data['menu']['items']
    print(f"Found {len(items)} menu items to migrate")

    # Connect to PostgreSQL
    print(f"Connecting to PostgreSQL at {DB_HOST}:{DB_PORT}...")

    conn = await asyncpg.connect(
        host=DB_HOST,
        port=int(DB_PORT),
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

    print("Connected successfully!")

    # Clear existing data
    await conn.execute("DELETE FROM menu_items")
    print("Cleared existing menu_items data")

    # Insert menu items
    inserted_count = 0

    for item in items:
        # Default quantity based on availability status
        quantity = 50 if item.get('availability_status', 'Available').lower() == 'available' else 0

        await conn.execute('''
            INSERT INTO menu_items
            (dish_id, name, description, category, price, quantity,
             dietary_tags, meal_period, popularity_score, availability_status, image)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ''',
            item['dish_id'],
            item['name'],
            item.get('description', ''),
            item['category'],
            float(item['price']),
            quantity,
            item.get('dietary_tags', []),
            item.get('meal_period', 'All-Day'),
            item.get('popularity_score', 5),
            item.get('availability_status', 'Available').lower(),
            item.get('image', '')
        )

        inserted_count += 1

        if inserted_count % 50 == 0:
            print(f"Migrated {inserted_count}/{len(items)} items...")

    print(f"\n✓ Successfully migrated {inserted_count} menu items to PostgreSQL!")

    # Verify the data
    count = await conn.fetchval("SELECT COUNT(*) FROM menu_items")
    print(f"✓ Verified: {count} items in database")

    # Show sample items
    sample_items = await conn.fetch(
        "SELECT dish_id, name, category, price, quantity, availability_status FROM menu_items LIMIT 5"
    )

    print("\nSample migrated items:")
    print("-" * 80)
    for item in sample_items:
        print(f"{item['dish_id']}: {item['name']} ({item['category']}) - ₹{item['price']} - Qty: {item['quantity']} - {item['availability_status']}")
    print("-" * 80)

    await conn.close()
    print("\n✓ Migration completed successfully!")


if __name__ == "__main__":
    asyncio.run(migrate_menu_to_postgres())
