const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ============= MENU ITEMS ROUTES =============

// Get all menu items
app.get('/api/menu-items', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM menu_items ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single menu item
app.get('/api/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create menu item
app.post('/api/menu-items', async (req, res) => {
  try {
    const {
      dish_id,
      name,
      description,
      category,
      price,
      quantity,
      dietary_tags,
      meal_period,
      popularity_score,
      image
    } = req.body;

    const result = await pool.query(
      `INSERT INTO menu_items
       (dish_id, name, description, category, price, quantity, dietary_tags, meal_period, popularity_score, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        dish_id,
        name,
        description || '',
        category,
        price,
        quantity || 0,
        dietary_tags || [],
        meal_period || 'All-Day',
        popularity_score || 5,
        image || ''
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Update menu item
app.put('/api/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, quantity } = req.body;
    const result = await pool.query(
      'UPDATE menu_items SET name = $1, price = $2, category = $3, quantity = $4 WHERE id = $5 RETURNING *',
      [name, price, category, quantity, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update menu item quantity
app.patch('/api/menu-items/:id/quantity', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const result = await pool.query(
      'UPDATE menu_items SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete menu item
app.delete('/api/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM menu_items WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============= TABLES ROUTES =============

// Get all tables
app.get('/api/tables', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tables ORDER BY table_number ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single table
app.get('/api/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM tables WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create table
app.post('/api/tables', async (req, res) => {
  try {
    const { number, capacity } = req.body;
    const result = await pool.query(
      'INSERT INTO tables (number, capacity, status) VALUES ($1, $2, $3) RETURNING *',
      [number, capacity, 'available']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Table number already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Update table
app.put('/api/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number, capacity, status } = req.body;
    const result = await pool.query(
      'UPDATE tables SET number = $1, capacity = $2, status = $3 WHERE id = $4 RETURNING *',
      [number, capacity, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update table status
app.patch('/api/tables/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE tables SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete table
app.delete('/api/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM tables WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json({ message: 'Table deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
