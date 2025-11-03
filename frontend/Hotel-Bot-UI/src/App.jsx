import { useState } from 'react'
import MagicBento from './components/MagicBento'
import OrderScreen from './components/OrderScreen'
import './App.css'

function App() {
  const [isOrderingMode, setIsOrderingMode] = useState(false)

  const handleStartOrdering = () => {
    setIsOrderingMode(true)
  }

  const handleCloseOrdering = () => {
    setIsOrderingMode(false)
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="logo-container">
          <img src="/images/appuchi_logo.png" alt="Appuchi Vilas Logo" className="app-logo" />
        </div>
        <h1>Appuchi Vilas</h1>
        <p>Authentic South Indian Cuisine</p>
      </div>

      <div className={`main-content ${isOrderingMode ? 'hidden' : ''}`}>
        <MagicBento
          textAutoHide={true}
          enableStars={false}
          enableSpotlight={false}
          enableBorderGlow={false}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect={false}
          spotlightRadius={300}
          particleCount={12}
          glowColor="255, 140, 0"
        />

        <div className="start-button-container">
          <button className="start-button" onClick={handleStartOrdering}>
            <span>Start Ordering</span>
            <svg className="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {isOrderingMode && <OrderScreen onClose={handleCloseOrdering} />}
    </div>
  )
}

export default App
