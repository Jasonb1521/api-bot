import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../styles/Navigation.css'

const Navigation = () => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navigation">
      <Link 
        to="/kitchen" 
        className={`nav-link ${isActive('/kitchen') ? 'active' : ''}`}
      >
        👨‍🍳 Kitchen
      </Link>
      <Link 
        to="/admin" 
        className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
      >
        ⚙️ Admin
      </Link>
    </nav>
  )
}

export default Navigation
