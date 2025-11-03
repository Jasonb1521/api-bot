import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import './OrderScreen.css'

const menuItems = [
  { id: 1, name: 'Chicken Biriyani', category: 'Biriyani', price: 180, image: '/images/chicken biriyani.jpg' },
  { id: 2, name: 'Veg Fried Rice', category: 'Fried Rice', price: 120, image: '/images/25veg fried rice.jpg' },
  { id: 3, name: 'Chicken Fried Rice', category: 'Fried Rice', price: 150, image: '/images/26chicken fried rice.jpg' },
  { id: 4, name: 'Egg Fried Rice', category: 'Fried Rice', price: 130, image: '/images/28egg fried rice.jpg' },
  { id: 5, name: 'Gobi Fried Rice', category: 'Fried Rice', price: 125, image: '/images/29gobi fried rice.jpg' },
  { id: 6, name: 'Paneer Fried Rice', category: 'Fried Rice', price: 140, image: '/images/30panner fried rice.jpg' },
  { id: 7, name: 'Veg Noodles', category: 'Noodles', price: 110, image: '/images/35veg noodles.jpg' },
  { id: 8, name: 'Chicken Noodles', category: 'Noodles', price: 140, image: '/images/34chicken noodles.jpg' },
  { id: 9, name: 'Egg Noodles', category: 'Noodles', price: 120, image: '/images/33egg noodles.jpg' },
  { id: 10, name: 'Gobi Noodles', category: 'Noodles', price: 115, image: '/images/32gobi noodles.jpg' },
  { id: 11, name: 'Meals', category: 'Special', price: 100, image: '/images/meals.jpg' },
  { id: 12, name: 'Chicken Fry', category: 'Special', price: 160, image: '/images/chicken fry.jpg' },
  { id: 13, name: 'Mutton Fry', category: 'Special', price: 200, image: '/images/mutton fry.jpg' },
  { id: 14, name: 'Fish Curry', category: 'Special', price: 180, image: '/images/fish curry.jpg' },
  { id: 15, name: 'Palipalayam Chicken', category: 'Special', price: 170, image: '/images/palipalayam chicken.jpg' },
  { id: 16, name: 'Schezwan Egg Noodles', category: 'Schezwan', price: 130, image: '/images/41schewzan egg noodles.jpg' },
  { id: 17, name: 'Schezwan Chicken Noodles', category: 'Schezwan', price: 150, image: '/images/44schewzan chicken noodles.jpg' },
  { id: 18, name: 'Omelette', category: 'Breakfast', price: 40, image: '/images/23 omblete.jpg' }
]

const OrderScreen = ({ onClose }) => {
  const [orders, setOrders] = useState([])
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showOrderSide, setShowOrderSide] = useState(false)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const recognitionRef = useRef(null)
  const menuSideRef = useRef(null)

  const categories = ['All', ...new Set(menuItems.map(item => item.category))]

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory)

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex
        const transcriptText = event.results[current][0].transcript.toLowerCase()
        setTranscript(transcriptText)

        if (event.results[current].isFinal) {
          processVoiceCommand(transcriptText)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start()
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isListening])

  const processVoiceCommand = (command) => {
    // Find matching menu items
    const matchedItems = menuItems.filter(item =>
      command.includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(command)
    )

    if (matchedItems.length > 0) {
      matchedItems.forEach(item => {
        animateItemToOrder(item)
      })
    }
  }

  const animateItemToOrder = (item, event) => {
    // Show order side first
    setShowOrderSide(true)
    
    // Create flying element
    const flyingElement = document.createElement('div')
    flyingElement.className = 'flying-food-item'
    flyingElement.innerHTML = `<img src="${item.image}" alt="${item.name}" />`

    document.body.appendChild(flyingElement)

    // Get the clicked element position
    const clickedElement = event?.currentTarget || event?.target
    let startRect
    
    if (clickedElement) {
      const menuItemElement = clickedElement.closest('.menu-item')
      if (menuItemElement) {
        startRect = menuItemElement.getBoundingClientRect()
      }
    }
    
    // Fallback to menu side center if no click event
    if (!startRect) {
      const menuSide = document.querySelector('.menu-side')
      startRect = menuSide ? menuSide.getBoundingClientRect() : { left: window.innerWidth / 4, top: window.innerHeight / 2, width: 0, height: 0 }
    }

    // Wait a bit for order side to appear, then animate
    setTimeout(() => {
      const orderSide = document.querySelector('.order-side')
      
      if (orderSide) {
        const orderRect = orderSide.getBoundingClientRect()
        
        flyingElement.style.left = `${startRect.left + startRect.width / 2}px`
        flyingElement.style.top = `${startRect.top + startRect.height / 2}px`

        gsap.to(flyingElement, {
          left: orderRect.left + orderRect.width / 2,
          top: orderRect.top + orderRect.height / 2,
          scale: 0.3,
          rotation: 360,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            addToOrder(item)
            flyingElement.remove()
          }
        })
      } else {
        // If no order side yet, just add without animation
        addToOrder(item)
        flyingElement.remove()
      }
    }, 100)
  }

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const addToOrder = (item) => {
    const existingOrder = orders.find(order => order.id === item.id)
    if (existingOrder) {
      setOrders(orders.map(order =>
        order.id === item.id
          ? { ...order, quantity: order.quantity + 1 }
          : order
      ))
    } else {
      setOrders([...orders, { ...item, quantity: 1 }])
    }
    setShowOrderSide(true)
  }

  const removeFromOrder = (itemId) => {
    const existingOrder = orders.find(order => order.id === itemId)
    if (existingOrder.quantity > 1) {
      setOrders(orders.map(order =>
        order.id === itemId
          ? { ...order, quantity: order.quantity - 1 }
          : order
      ))
    } else {
      setOrders(orders.filter(order => order.id !== itemId))
    }
  }

  const getTotalPrice = () => {
    return orders.reduce((total, order) => total + (order.price * order.quantity), 0)
  }

  const handlePlaceOrder = () => {
    setShowOrderConfirmation(true)
    setTimeout(() => {
      setShowOrderConfirmation(false)
      setOrders([])
      setShowOrderSide(false)
    }, 3000)
  }

  return (
    <div className="order-screen">
      <div className="order-screen-logo">
        <img src="/images/appuchi_logo.png" alt="Appuchi Vilas Logo" />
      </div>

      <button className="close-button" onClick={onClose}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="split-container">
        {/* Menu List Side with Flying Posters */}
        <div className={`menu-side ${showOrderSide ? 'half-width' : 'full-width'}`} ref={menuSideRef}>
          <div className="menu-header-overlay">
            <h2>Menu</h2>
          </div>

          {transcript && (
            <div className="transcript-display">
              Listening: "{transcript}"
            </div>
          )}

          <div className="menu-items-list">
            {menuItems.map(item => (
              <div key={item.id} className="menu-item">
                <div className="menu-item-card" onClick={(e) => animateItemToOrder(item, e)}>
                  <img src={item.image} alt={item.name} className="menu-item-image" />
                  <div className="menu-item-details">
                    <h3>{item.name}</h3>
                    <p className="menu-item-category">{item.category}</p>
                    <p className="menu-item-price">₹{item.price}</p>
                  </div>
                  <button className="add-btn" onClick={(e) => { e.stopPropagation(); animateItemToOrder(item, e); }}>
                    ADD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order List Side */}
        {showOrderSide && (
          <div className="order-side">
          <div className="order-header">
            <h2>Your Order</h2>
          </div>

          <div className="order-items-list">
            {orders.length === 0 ? (
              <div className="empty-order">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <path d="M32 8L40 24H56L44 36L48 52L32 42L16 52L20 36L8 24H24L32 8Z" fill="rgba(255, 140, 0, 0.2)" stroke="rgba(255, 140, 0, 0.5)" strokeWidth="2"/>
                </svg>
                <p>No items in order</p>
                <p className="empty-subtitle">Say the name of a dish to add it</p>
              </div>
            ) : (
              <>
                {orders.map(order => (
                  <div key={order.id} className="order-item">
                    <img src={order.image} alt={order.name} className="order-item-image" />
                    <div className="order-item-details">
                      <h4>{order.name}</h4>
                      <p className="order-item-price">₹{order.price} × {order.quantity}</p>
                    </div>
                    <div className="quantity-controls">
                      <button onClick={() => removeFromOrder(order.id)}>−</button>
                      <span>{order.quantity}</span>
                      <button onClick={() => addToOrder(order)}>+</button>
                    </div>
                    <p className="order-item-total">₹{order.price * order.quantity}</p>
                  </div>
                ))}

                <div className="order-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{getTotalPrice()}</span>
                  </div>
                  <div className="summary-row">
                    <span>GST (5%)</span>
                    <span>₹{Math.round(getTotalPrice() * 0.05)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>₹{getTotalPrice() + Math.round(getTotalPrice() * 0.05)}</span>
                  </div>
                </div>

                <button className="place-order-btn" onClick={handlePlaceOrder}>
                  Place Order
                </button>
              </>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Order Confirmation Modal */}
      {showOrderConfirmation && (
        <div className="order-confirmation-overlay">
          <div className="order-confirmation-card">
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
                <div className="icon-circle"></div>
                <div className="icon-fix"></div>
              </div>
            </div>
            <h2 className="confirmation-title">Order Confirmed!</h2>
            <p className="confirmation-message">Your order has been placed successfully</p>
            <p className="confirmation-submessage">Thank you for ordering with us</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderScreen
