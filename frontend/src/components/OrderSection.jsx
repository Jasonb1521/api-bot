import React from 'react'

const OrderSection = ({ orderItems }) => {
  return (
    <div className="order-section">
      <div className="order-header">
        <h2>Your Order</h2>
        <span className="order-count">{orderItems.length} items</span>
      </div>
      
      <div className="order-content">
        <svg 
          className="empty-order-icon" 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M30 50h60M30 50v40h60V50" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="none"
          />
          <path 
            d="M40 40v15M50 40v15M60 40v15M70 40v15M80 40v15" 
            stroke="currentColor" 
            strokeWidth="1.5"
          />
          <path 
            d="M35 70h50M35 75h50" 
            stroke="currentColor" 
            strokeWidth="1"
          />
        </svg>
        
        <div className="empty-order-text">
          <h3>No items ordered yet</h3>
          <p>Start speaking to add items to your order</p>
        </div>
      </div>
    </div>
  )
}

export default OrderSection
