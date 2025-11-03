import React, { useState, useEffect } from 'react'
import '../styles/AdminPage.css'

const API_URL = '/api'

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('menu')
  const [menuItems, setMenuItems] = useState([])
  const [tables, setTables] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const [newItem, setNewItem] = useState({
    dish_id: '',
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    dietary_tags: [],
    meal_period: '',
    popularity_score: 5,
    image: ''
  })
  const [newTable, setNewTable] = useState({ number: '', capacity: '' })

  // Fetch menu items on mount
  useEffect(() => {
    fetchMenuItems()
    fetchTables()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`${API_URL}/menu-items`)
      const data = await response.json()
      setMenuItems(data)
    } catch (error) {
      console.error('Error fetching menu items:', error)
    }
  }

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_URL}/tables`)
      const data = await response.json()
      setTables(data)
    } catch (error) {
      console.error('Error fetching tables:', error)
    }
  }

  const handleAddMenuItem = async () => {
    if (newItem.dish_id && newItem.name && newItem.price && newItem.category) {
      try {
        const response = await fetch(`${API_URL}/menu-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dish_id: newItem.dish_id,
            name: newItem.name,
            description: newItem.description || '',
            category: newItem.category,
            price: parseFloat(newItem.price),
            quantity: parseInt(newItem.quantity) || 0,
            dietary_tags: newItem.dietary_tags,
            meal_period: newItem.meal_period || 'All-Day',
            popularity_score: parseInt(newItem.popularity_score) || 5,
            image: newItem.image || ''
          })
        })
        if (response.ok) {
          await fetchMenuItems()
          setNewItem({
            dish_id: '',
            name: '',
            description: '',
            category: '',
            price: '',
            quantity: '',
            dietary_tags: [],
            meal_period: '',
            popularity_score: 5,
            image: ''
          })
          alert('Menu item added successfully!')
        } else {
          const error = await response.json()
          alert(`Error adding item: ${error.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error adding menu item:', error)
        alert('Error adding menu item. Check console for details.')
      }
    } else {
      alert('Please fill in all required fields: Dish ID, Name, Price, and Category')
    }
  }

  // Filter menu items by search query
  const filteredMenuItems = menuItems.filter(item => {
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      (item.dish_id && item.dish_id.toLowerCase().includes(query)) ||
      item.category.toLowerCase().includes(query)
    )
  })

  const updateQuantity = async (id, change) => {
    const item = menuItems.find(item => item.id === id)
    if (!item) return

    const newQuantity = Math.max(0, item.quantity + change)
    try {
      const response = await fetch(`${API_URL}/menu-items/${id}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      })
      if (response.ok) {
        setMenuItems(menuItems.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        ))
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const setQuantity = async (id, newQuantity) => {
    const qty = Math.max(0, parseInt(newQuantity) || 0)
    try {
      const response = await fetch(`${API_URL}/menu-items/${id}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty })
      })
      if (response.ok) {
        setMenuItems(menuItems.map(item =>
          item.id === id ? { ...item, quantity: qty } : item
        ))
      }
    } catch (error) {
      console.error('Error setting quantity:', error)
    }
  }

  const deleteMenuItem = async (id) => {
    try {
      const response = await fetch(`${API_URL}/menu-items/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setMenuItems(menuItems.filter(item => item.id !== id))
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
    }
  }

  const updateTableStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/tables/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        setTables(tables.map(table =>
          table.id === id ? { ...table, status } : table
        ))
      }
    } catch (error) {
      console.error('Error updating table status:', error)
    }
  }

  const handleAddTable = async () => {
    if (newTable.number && newTable.capacity) {
      try {
        const response = await fetch(`${API_URL}/tables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: parseInt(newTable.number),
            capacity: parseInt(newTable.capacity)
          })
        })
        if (response.ok) {
          await fetchTables()
          setNewTable({ number: '', capacity: '' })
        }
      } catch (error) {
        console.error('Error adding table:', error)
      }
    }
  }

  const deleteTable = async (id) => {
    try {
      const response = await fetch(`${API_URL}/tables/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setTables(tables.filter(table => table.id !== id))
      }
    } catch (error) {
      console.error('Error deleting table:', error)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-content">
          <div className="restaurant-logo">
            <div className="logo-icon">🍳</div>
            <div className="restaurant-info">
              <h1>Ammayi Veedu</h1>
              <p>Admin Dashboard</p>
            </div>
          </div>
          <div className="admin-user">
            <span>Admin</span>
            <div className="user-avatar">👤</div>
          </div>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-sidebar">
          <button
            className={`tab-button ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            📋 Food Inventory
          </button>
          <button
            className={`tab-button ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            ➕ Add Menu Item
          </button>
          <button
            className={`tab-button ${activeTab === 'tables' ? 'active' : ''}`}
            onClick={() => setActiveTab('tables')}
          >
            🪑 Table Management
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'menu' && (
            <div className="section">
              <h2 className="section-title">FOOD INVENTORY MANAGEMENT</h2>
              <p style={{color: '#666', marginBottom: '20px'}}>
                Manage daily inventory quantities. Menu items are loaded from menu.json.
                Update quantities to reflect today's availability.
              </p>

              <div className="menu-list">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                  <h3>Menu Items ({filteredMenuItems.length}{searchQuery ? ` of ${menuItems.length}` : ''})</h3>
                  <input
                    type="text"
                    placeholder="🔍 Search by name, dish ID, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '10px 15px',
                      width: '400px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
                <div className="items-grid">
                  {filteredMenuItems.map(item => (
                    <div key={item.id} className={`menu-card ${item.quantity === 0 ? 'unavailable' : ''}`}>
                      <div className="menu-card-header">
                        <h4>{item.name}</h4>
                        <span className="price">₹{item.price}</span>
                      </div>
                      <p className="category">{item.category}</p>
                      <div className="quantity-control">
                        <label style={{marginBottom: '10px', display: 'block', fontWeight: 'bold'}}>Available Today:</label>
                        <input
                          type="number"
                          className="quantity-input"
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.id, e.target.value)}
                          min="0"
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '18px',
                            textAlign: 'center',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            marginBottom: '10px'
                          }}
                        />
                        <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                          <button
                            className="btn-quantity"
                            onClick={() => updateQuantity(item.id, 1)}
                            style={{
                              flex: 1,
                              padding: '12px',
                              fontSize: '24px',
                              fontWeight: 'bold',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'background-color 0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                          >
                            +
                          </button>
                          <button
                            className="btn-quantity"
                            onClick={() => updateQuantity(item.id, -1)}
                            style={{
                              flex: 1,
                              padding: '12px',
                              fontSize: '24px',
                              fontWeight: 'bold',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'background-color 0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                          >
                            -
                          </button>
                        </div>
                      </div>
                      <button
                        className="btn-delete-item"
                        onClick={() => deleteMenuItem(item.id)}
                      >
                        Delete Item
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="section">
              <h2 className="section-title">ADD NEW MENU ITEM</h2>
              <p style={{color: '#666', marginBottom: '30px'}}>
                Fill in all required fields to add a new item to the menu. Items will be synced to the voice bot automatically.
              </p>

              <div className="add-item-form" style={{maxWidth: '800px', margin: '0 auto'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>

                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'}}>
                      Dish ID <span style={{color: 'red'}}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 027, 028"
                      value={newItem.dish_id}
                      onChange={(e) => setNewItem({...newItem, dish_id: e.target.value})}
                      style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '6px'}}
                    />
                    <small style={{color: '#999'}}>Unique identifier for the dish</small>
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'}}>
                      Dish Name <span style={{color: 'red'}}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Chicken Biryani"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '6px'}}
                    />
                    <small style={{color: '#999'}}>Name displayed to customers</small>
                  </div>

                  <div style={{gridColumn: 'span 2'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'}}>
                      Description
                    </label>
                    <textarea
                      placeholder="e.g., Aromatic basmati rice with tender chicken pieces"
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      rows="3"
                      style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '6px', resize: 'vertical'}}
                    />
                    <small style={{color: '#999'}}>Brief description of the dish</small>
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'}}>
                      Category <span style={{color: 'red'}}>*</span>
                    </label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '6px'}}
                    >
                      <option value="">Select Category</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Rice">Rice</option>
                      <option value="Noodles">Noodles</option>
                      <option value="Biryani">Biryani</option>
                      <option value="Starters">Starters</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                    <small style={{color: '#999'}}>Food category</small>
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'}}>
                      Price (₹) <span style={{color: 'red'}}>*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 150"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                      min="0"
                      step="0.01"
                      style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '6px'}}
                    />
                    <small style={{color: '#999'}}>Price in rupees</small>
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'}}>
                      Initial Quantity
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 50"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                      min="0"
                      style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '6px'}}
                    />
                    <small style={{color: '#999'}}>Available quantity (default: 0)</small>
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'}}>
                      Meal Period
                    </label>
                    <select
                      value={newItem.meal_period}
                      onChange={(e) => setNewItem({...newItem, meal_period: e.target.value})}
                      style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '6px'}}
                    >
                      <option value="">Select Meal Period</option>
                      <option value="Breakfast">Breakfast (6-11 AM)</option>
                      <option value="Lunch">Lunch (11 AM-4 PM)</option>
                      <option value="Dinner">Dinner (4-11 PM)</option>
                      <option value="All-Day">All-Day</option>
                    </select>
                    <small style={{color: '#999'}}>When this item is available (default: All-Day)</small>
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'}}>
                      Dietary Tags
                    </label>
                    <select
                      multiple
                      value={newItem.dietary_tags}
                      onChange={(e) => setNewItem({...newItem, dietary_tags: Array.from(e.target.selectedOptions, option => option.value)})}
                      style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '6px', minHeight: '80px'}}
                    >
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Spicy">Spicy</option>
                      <option value="Gluten-Free">Gluten-Free</option>
                    </select>
                    <small style={{color: '#999'}}>Hold Ctrl/Cmd to select multiple</small>
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'}}>
                      Popularity Score
                    </label>
                    <input
                      type="number"
                      placeholder="1-10"
                      value={newItem.popularity_score}
                      onChange={(e) => setNewItem({...newItem, popularity_score: e.target.value})}
                      min="1"
                      max="10"
                      style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '6px'}}
                    />
                    <small style={{color: '#999'}}>1-10 rating (default: 5)</small>
                  </div>

                  <div style={{gridColumn: 'span 2'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333'}}>
                      Image Path
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Appuchi Villas/biryani.jpg"
                      value={newItem.image}
                      onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                      style={{width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '6px'}}
                    />
                    <small style={{color: '#999'}}>Path to dish image (optional)</small>
                  </div>
                </div>

                <div style={{marginTop: '30px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #b3d9ff'}}>
                  <strong style={{color: '#0066cc'}}>📋 Selected Dietary Tags:</strong>
                  <div style={{marginTop: '5px'}}>
                    {newItem.dietary_tags.length > 0 ? (
                      newItem.dietary_tags.map(tag => (
                        <span key={tag} style={{
                          display: 'inline-block',
                          padding: '5px 10px',
                          margin: '5px 5px 0 0',
                          backgroundColor: '#0066cc',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span style={{color: '#999'}}>No tags selected</span>
                    )}
                  </div>
                </div>

                <div style={{marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center'}}>
                  <button
                    className="btn-primary"
                    onClick={handleAddMenuItem}
                    style={{padding: '15px 40px', fontSize: '16px'}}
                  >
                    ✅ Add Menu Item
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setNewItem({
                      dish_id: '',
                      name: '',
                      description: '',
                      category: '',
                      price: '',
                      quantity: '',
                      dietary_tags: [],
                      meal_period: '',
                      popularity_score: 5,
                      image: ''
                    })}
                    style={{padding: '15px 40px', fontSize: '16px', backgroundColor: '#999', color: 'white'}}
                  >
                    🔄 Reset Form
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="section">
              <h2 className="section-title">TABLE MANAGEMENT</h2>
              
              <div className="add-item-form">
                <h3>Add New Table</h3>
                <div className="form-row">
                  <input
                    type="number"
                    placeholder="Table Number"
                    value={newTable.number}
                    onChange={(e) => setNewTable({...newTable, number: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Capacity (people)"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({...newTable, capacity: e.target.value})}
                  />
                  <button className="btn-primary" onClick={handleAddTable}>Add Table</button>
                </div>
              </div>

              <div className="menu-list">
                <h3>Tables ({tables.length})</h3>
                <div className="tables-grid">
                  {tables.map(table => (
                    <div key={table.id} className={`table-card ${table.status}`}>
                      <h3>Table {table.number}</h3>
                      <p className="capacity">Capacity: {table.capacity} people</p>
                      <div className="status-badge">{table.status}</div>
                      <div className="table-actions">
                        <button onClick={() => updateTableStatus(table.id, 'available')}>
                          Available
                        </button>
                        <button onClick={() => updateTableStatus(table.id, 'occupied')}>
                          Occupied
                        </button>
                        <button onClick={() => updateTableStatus(table.id, 'reserved')}>
                          Reserved
                        </button>
                      </div>
                      <button 
                        className="btn-delete-table"
                        onClick={() => deleteTable(table.id)}
                      >
                        Delete Table
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPage
