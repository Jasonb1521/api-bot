import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Navigation from './components/Navigation'
import KitchenPage from './pages/KitchenPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Navigate to="/kitchen" replace />} />
        <Route path="/kitchen" element={<KitchenPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  )
}

export default App
