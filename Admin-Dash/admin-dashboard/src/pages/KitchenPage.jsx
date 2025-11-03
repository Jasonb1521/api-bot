import React, { useState } from 'react'
import '../styles/KitchenPage.css'

const KitchenPage = () => {
  const [orders, setOrders] = useState([
    {
      id: 1,
      tableNumber: 5,
      items: [
        { name: 'Biryani', quantity: 2, notes: 'Extra spicy' },
        { name: 'Raita', quantity: 2, notes: '' },
      ],
      status: 'pending',
      time: '10:30 AM',
      priority: 'high'
    },
    {
      id: 2,
      tableNumber: 3,
      items: [
        { name: 'Masala Dosa', quantity: 1, notes: 'No onions' },
        { name: 'Filter Coffee', quantity: 1, notes: 'Less sugar' },
      ],
      status: 'preparing',
      time: '10:25 AM',
      priority: 'medium'
    },
    {
      id: 3,
      tableNumber: 8,
      items: [
        { name: 'Paneer Tikka', quantity: 3, notes: '' },
        { name: 'Naan', quantity: 3, notes: 'Butter naan' },
        { name: 'Dal Makhani', quantity: 1, notes: '' },
      ],
      status: 'pending',
      time: '10:35 AM',
      priority: 'high'
    },
    {
      id: 4,
      tableNumber: 12,
      items: [
        { name: 'Idli', quantity: 4, notes: '' },
        { name: 'Sambar', quantity: 2, notes: 'Extra hot' },
      ],
      status: 'ready',
      time: '10:20 AM',
      priority: 'low'
    },
  ])

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ))
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'status-pending'
      case 'preparing': return 'status-preparing'
      case 'ready': return 'status-ready'
      default: return ''
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'priority-high'
      case 'medium': return 'priority-medium'
      case 'low': return 'priority-low'
      default: return ''
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const preparingOrders = orders.filter(o => o.status === 'preparing')
  const readyOrders = orders.filter(o => o.status === 'ready')

  return (
    <div className="kitchen-page">
      <div className="kitchen-header">
        <div className="header-content">
          <div className="restaurant-logo">
            <div className="logo-icon">🍳</div>
            <div className="restaurant-info">
              <h1>Ammayi Veedu</h1>
              <p>Kitchen Display</p>
            </div>
          </div>
          <div className="kitchen-stats">
            <div className="stat-card pending">
              <span className="stat-number">{pendingOrders.length}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-card preparing">
              <span className="stat-number">{preparingOrders.length}</span>
              <span className="stat-label">Preparing</span>
            </div>
            <div className="stat-card ready">
              <span className="stat-number">{readyOrders.length}</span>
              <span className="stat-label">Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="kitchen-container">
        <div className="orders-column">
          <h2 className="column-title">
            <span className="status-dot pending-dot"></span>
            PENDING ORDERS ({pendingOrders.length})
          </h2>
          <div className="orders-list">
            {pendingOrders.map(order => (
              <div key={order.id} className={`order-card ${getStatusColor(order.status)}`}>
                <div className="order-header">
                  <div className="table-info">
                    <h3>Table {order.tableNumber}</h3>
                    <span className={`priority-badge ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </div>
                  <span className="order-time">{order.time}</span>
                </div>
                
                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <div className="item-info">
                        <span className="quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      {item.notes && (
                        <div className="item-notes">Note: {item.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="order-actions">
                  <button 
                    className="btn-start"
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                  >
                    Start Preparing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="orders-column">
          <h2 className="column-title">
            <span className="status-dot preparing-dot"></span>
            PREPARING ({preparingOrders.length})
          </h2>
          <div className="orders-list">
            {preparingOrders.map(order => (
              <div key={order.id} className={`order-card ${getStatusColor(order.status)}`}>
                <div className="order-header">
                  <div className="table-info">
                    <h3>Table {order.tableNumber}</h3>
                    <span className={`priority-badge ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </div>
                  <span className="order-time">{order.time}</span>
                </div>
                
                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <div className="item-info">
                        <span className="quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      {item.notes && (
                        <div className="item-notes">Note: {item.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="order-actions">
                  <button 
                    className="btn-ready"
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                  >
                    Mark as Ready
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="orders-column">
          <h2 className="column-title">
            <span className="status-dot ready-dot"></span>
            READY TO SERVE ({readyOrders.length})
          </h2>
          <div className="orders-list">
            {readyOrders.map(order => (
              <div key={order.id} className={`order-card ${getStatusColor(order.status)}`}>
                <div className="order-header">
                  <div className="table-info">
                    <h3>Table {order.tableNumber}</h3>
                    <span className={`priority-badge ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </div>
                  <span className="order-time">{order.time}</span>
                </div>
                
                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <div className="item-info">
                        <span className="quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      {item.notes && (
                        <div className="item-notes">Note: {item.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="order-actions">
                  <button 
                    className="btn-complete"
                    onClick={() => setOrders(orders.filter(o => o.id !== order.id))}
                  >
                    Order Served
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default KitchenPage
