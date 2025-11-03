-- Initialize HotelBot database schema
-- Creates tables for menu items and orders

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    dish_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    dietary_tags TEXT[] DEFAULT '{}',
    meal_period VARCHAR(50) DEFAULT 'All-Day',
    popularity_score INTEGER DEFAULT 5,
    availability_status VARCHAR(20) DEFAULT 'available',
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- Create index on availability_status for faster queries
CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON menu_items(availability_status);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    table_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE
    ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE
    ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Print success message
DO $$
BEGIN
    RAISE NOTICE '✓ Database schema initialized successfully!';
END $$;
