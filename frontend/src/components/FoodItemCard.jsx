import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './FoodItemCard.css'

const FoodItemCard = ({ item, onClose }) => {
  const cardRef = useRef(null)
  const timelineRef = useRef(null)

  useEffect(() => {
    if (!item) return

    const card = cardRef.current
    if (!card) return

    console.log(`🎴 FoodItemCard: Starting animation for ${item.name}`)

    // Kill any existing timeline and animations
    if (timelineRef.current) {
      timelineRef.current.kill()
    }
    gsap.killTweensOf(card)

    // Set initial state immediately
    gsap.set(card, {
      scale: 0,
      opacity: 0,
      y: 50,
      transformOrigin: 'center center'
    })

    // Create a new timeline for complete control
    timelineRef.current = gsap.timeline({
      onComplete: () => {
        console.log(`🎴 FoodItemCard: Animation complete for ${item.name}, calling onClose`)
        if (onClose) {
          onClose()
        }
      }
    })

    // Add entrance animation to timeline
    timelineRef.current.to(card, {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
      force3D: true
    })

    // Add pause (stay visible) - 2 seconds
    timelineRef.current.to({}, { duration: 2 })

    // Add exit animation to timeline
    timelineRef.current.to(card, {
      scale: 0.8,
      opacity: 0,
      y: -30,
      duration: 0.4,
      ease: 'power2.in',
      force3D: true
    })

    // Start the timeline immediately
    timelineRef.current.play()

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
      gsap.killTweensOf(card)
    }
  }, [item?.name])  // Only re-run when item NAME changes, not the whole object or onClose

  if (!item) return null

  return (
    <div className="food-item-card-overlay">
      <div className="food-item-card" ref={cardRef}>
        <div className="food-item-card-glow"></div>

        <div className="food-item-card-image-container">
          <img
            src={item.image}
            alt={item.name}
            className="food-item-card-image"
            onError={(e) => {
              e.target.src = '/images/appuchi_logo.png' // Fallback image
            }}
          />
        </div>

        <div className="food-item-card-content">
          <h3 className="food-item-card-name">{item.name}</h3>
          <p className="food-item-card-category">{item.category}</p>
          <div className="food-item-card-price">₹{item.price}</div>
        </div>

        <div className="food-item-card-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default FoodItemCard
