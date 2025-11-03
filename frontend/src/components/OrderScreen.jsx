import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import SiriMicrophone from './SiriMicrophone'
import FoodItemCard from './FoodItemCard'
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

// Tamil-English name mappings for food item detection
const tamilNameMap = {
  // Biriyani variations
  'பிரியாணி': ['Chicken Biriyani', 'Veg Biriyani', 'Mutton Biriyani'],
  'சிக்கன் பிரியாணி': ['Chicken Biriyani'],
  'வெஜ் பிரியாணி': ['Veg Biriyani'],
  'மட்டன் பிரியாணி': ['Mutton Biriyani'],
  'biryani': ['Chicken Biriyani'],
  'biriyani': ['Chicken Biriyani'],

  // Fried Rice variations
  'ஃப்ரைடு ரைஸ்': ['Veg Fried Rice', 'Chicken Fried Rice', 'Egg Fried Rice'],
  'ஃப்ரைட் ரைஸ்': ['Veg Fried Rice', 'Chicken Fried Rice', 'Egg Fried Rice'],
  'வெஜ் ஃப்ரைடு ரைஸ்': ['Veg Fried Rice'],
  'வெஜிடபுல் ரைஸ்': ['Veg Fried Rice'],
  'சிக்கன் ஃப்ரைடு ரைஸ்': ['Chicken Fried Rice'],
  'எக் ஃப்ரைடு ரைஸ்': ['Egg Fried Rice'],
  'கோபி ஃப்ரைடு ரைஸ்': ['Gobi Fried Rice'],
  'பன்னீர் ஃப்ரைடு ரைஸ்': ['Paneer Fried Rice'],
  'fried rice': ['Veg Fried Rice', 'Chicken Fried Rice'],

  // Noodles variations
  'நூடுல்ஸ்': ['Veg Noodles', 'Chicken Noodles', 'Egg Noodles'],
  'வெஜ் நூடுல்ஸ்': ['Veg Noodles'],
  'வெஜிடபுல் நூடுல்ஸ்': ['Veg Noodles'],
  'சிக்கன் நூடுல்ஸ்': ['Chicken Noodles'],
  'எக் நூடுல்ஸ்': ['Egg Noodles'],
  'கோபி நூடுல்ஸ்': ['Gobi Noodles'],
  'noodles': ['Veg Noodles', 'Chicken Noodles'],

  // Schezwan variations
  'செஸ்வான்': ['Schezwan Egg Noodles', 'Schezwan Chicken Noodles'],
  'செஸ்வான் நூடுல்ஸ்': ['Schezwan Egg Noodles', 'Schezwan Chicken Noodles'],
  'செஸ்வான் சிக்கன்': ['Schezwan Chicken Noodles'],
  'schezwan': ['Schezwan Egg Noodles', 'Schezwan Chicken Noodles'],

  // Special items
  'சிக்கன் ஃப்ரை': ['Chicken Fry'],
  'சிக்கன் பொரிக்கல்': ['Chicken Fry'],
  'மட்டன் ஃப்ரை': ['Mutton Fry'],
  'மட்டன் பொரிக்கல்': ['Mutton Fry'],
  'ஃபிஷ் கறி': ['Fish Curry'],
  'மீன் குழம்பு': ['Fish Curry'],
  'பாலிப்பாளையம் சிக்கன்': ['Palipalayam Chicken'],
  'பாலிப்பாளையம்': ['Palipalayam Chicken'],
  'meals': ['Meals'],
  'மீல்ஸ்': ['Meals'],
  'சாப்பாடு': ['Meals'],

  // Omelette variations
  'ஆம்லெட்': ['Omelette'],
  'ஓம்லெட்': ['Omelette'],
  'முட்டை': ['Omelette', 'Egg Fried Rice', 'Egg Noodles'],
  'omelette': ['Omelette'],
  'omelet': ['Omelette'],

  // Generic terms
  'சிக்கன்': ['Chicken Biriyani', 'Chicken Fried Rice', 'Chicken Noodles', 'Chicken Fry'],
  'chicken': ['Chicken Biriyani', 'Chicken Fried Rice', 'Chicken Noodles', 'Chicken Fry'],
  'மட்டன்': ['Mutton Fry'],
  'mutton': ['Mutton Fry'],
  'வெஜ்': ['Veg Fried Rice', 'Veg Noodles'],
  'வெஜிடபுல்': ['Veg Fried Rice', 'Veg Noodles'],
  'veg': ['Veg Fried Rice', 'Veg Noodles'],
  'vegetable': ['Veg Fried Rice', 'Veg Noodles'],
}

// Function to detect food items mentioned in text
const detectFoodItems = (text) => {
  if (!text) return []

  const textLower = text.toLowerCase()
  const matches = []

  // First, check Tamil name mappings with specificity scores
  Object.entries(tamilNameMap).forEach(([tamilName, englishNames]) => {
    if (text.includes(tamilName) || textLower.includes(tamilName.toLowerCase())) {
      englishNames.forEach(name => {
        // Higher score for more specific matches (longer Tamil names are more specific)
        const score = tamilName.length * 2
        matches.push({ name, score, source: 'tamil' })
      })
    }
  })

  // Then check direct English menu item names
  menuItems.forEach(item => {
    const itemNameLower = item.name.toLowerCase()

    // Check for exact or partial matches
    if (textLower.includes(itemNameLower)) {
      matches.push({ name: item.name, score: itemNameLower.length * 3, source: 'exact' })
    } else {
      // Check for word-by-word matches (e.g., "chicken" matches "Chicken Biriyani")
      // BUT with lower score to deprioritize generic matches
      const words = itemNameLower.split(' ')
      if (words.some(word => word.length > 3 && textLower.includes(word))) {
        matches.push({ name: item.name, score: 1, source: 'word' })
      }
    }
  })

  // Sort by score (highest first) and get unique items
  const uniqueMatches = []
  const seen = new Set()

  matches
    .sort((a, b) => b.score - a.score)
    .forEach(match => {
      if (!seen.has(match.name)) {
        seen.add(match.name)
        uniqueMatches.push(match)
      }
    })

  // Get the best match
  const detectedItems = uniqueMatches
    .slice(0, 1)  // Take only the best match
    .map(match => menuItems.find(item => item.name === match.name))
    .filter(item => item !== undefined)

  return detectedItems
}

const OrderScreen = ({ onClose }) => {
  // Order state
  const [orders, setOrders] = useState([])
  const [showOrderSide, setShowOrderSide] = useState(false)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)

  // WebSocket voice bot state
  const [isListening, setIsListening] = useState(false)
  const [wsStatus, setWsStatus] = useState('Disconnected')
  const [transcription, setTranscription] = useState('')
  const [botResponse, setBotResponse] = useState('')
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const [audioLevel, setAudioLevel] = useState(0)

  // Food item card state
  const [highlightedItem, setHighlightedItem] = useState(null)

  // WebSocket and audio refs
  const wsRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const processorRef = useRef(null)
  const sourceRef = useRef(null)
  const audioElementRef = useRef(null)
  const sentenceQueueRef = useRef([])
  const currentSentenceChunksRef = useRef([])
  const isPlayingSentenceRef = useRef(false)
  const wasRecordingRef = useRef(false)
  const menuSideRef = useRef(null)
  const lastHighlightedItemRef = useRef({ name: null, timestamp: 0 })
  const fullBotResponseRef = useRef('') // Accumulate full response for food detection

  const SAMPLE_RATE = 16000
  const CHUNK_SIZE = 512
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const WS_URL = `${wsProtocol}//${window.location.host}/ws/audio`

  // Initialize WebSocket connection and start listening automatically on mount
  useEffect(() => {
    connectWebSocket()

    // Start listening automatically after connection
    setTimeout(() => {
      setIsListening(true)
    }, 1000) // Wait 1 second for WebSocket to connect

    return () => {
      disconnectWebSocket()
      stopRecording()
    }
  }, [])

  // Handle recording state changes
  useEffect(() => {
    if (isListening) {
      startRecording()
    } else {
      stopRecording()
    }
  }, [isListening])

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket(WS_URL)

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected')
        setWsStatus('Connected')
      }

      wsRef.current.onmessage = async (event) => {
        // Handle binary audio data
        if (event.data instanceof Blob) {
          console.log('🔊 Received audio chunk:', event.data.size, 'bytes')
          currentSentenceChunksRef.current.push(event.data)
          return
        }

        // Handle JSON messages
        try {
          const data = JSON.parse(event.data)
          console.log('📨 Received WebSocket message:', data.type)

          if (data.type === 'transcription') {
            console.log('📝 Transcription:', data.text)
            setTranscription(data.text)
            // Add user message to conversation history
            setConversationHistory(prev => [...prev, { type: 'user', text: data.text }])
          } else if (data.type === 'bot_response') {
            console.log('🤖 Bot Response:', data.text)
            // Accumulate full response for later food item detection
            fullBotResponseRef.current += data.text
            setBotResponse(prev => prev + data.text) // Show text progressively
          } else if (data.type === 'audio_stream_start') {
            console.log('🎵 Audio stream starting...')
            // Reset accumulated response at the start of a new response
            fullBotResponseRef.current = ''
            setBotResponse('') // Reset displayed text
            sentenceQueueRef.current = []
            currentSentenceChunksRef.current = []
            isPlayingSentenceRef.current = false

            // Pause recording during playback
            if (isListening) {
              wasRecordingRef.current = true
              setIsListening(false)
            }
          } else if (data.type === 'sentence_audio_start') {
            console.log(`🎵 Sentence ${data.sentence_index + 1} starting`)
            currentSentenceChunksRef.current = []
          } else if (data.type === 'sentence_audio_complete') {
            console.log(`✅ Sentence ${data.sentence_index + 1} complete`)

            if (currentSentenceChunksRef.current.length > 0) {
              sentenceQueueRef.current.push([...currentSentenceChunksRef.current])
              currentSentenceChunksRef.current = []

              if (!isPlayingSentenceRef.current) {
                playNextSentence()
              }
            }
          } else if (data.type === 'audio_stream_complete') {
            console.log('✅ Audio stream complete')
            console.log('📝 Full bot response:', fullBotResponseRef.current)

            // Add COMPLETE bot response to conversation history
            if (fullBotResponseRef.current) {
              setConversationHistory(prev => [...prev, { type: 'bot', text: fullBotResponseRef.current }])

              // NOW detect food items from the COMPLETE response
              const detectedItems = detectFoodItems(fullBotResponseRef.current)
              console.log('🔍 Detected items:', detectedItems)

              if (detectedItems.length > 0) {
                const item = detectedItems[0]
                const now = Date.now()
                const lastHighlight = lastHighlightedItemRef.current

                console.log('⏱️ Last highlighted:', lastHighlight, 'Time diff:', now - lastHighlight.timestamp)

                // Only show card if it's a different item OR it's been more than 5 seconds
                if (item.name !== lastHighlight.name || (now - lastHighlight.timestamp) > 5000) {
                  console.log('🍽️ Detected food item:', item.name)
                  setHighlightedItem(item)
                  lastHighlightedItemRef.current = { name: item.name, timestamp: now }
                } else {
                  console.log('⏭️ Skipping duplicate item:', item.name)
                }
              } else {
                console.log('❌ No food items detected in response')
              }
            }
          } else if (data.type === 'status') {
            console.log('📡 Status:', data.message)
          } else if (data.type === 'order_confirmed') {
            // Order confirmed - show confirmation screen
            console.log('✅ Order confirmed:', data)

            // Set the order confirmation state with confirmed items
            setOrders(data.items || [])
            setShowOrderConfirmation(true)

            // Auto-dismiss after duration and redirect to homepage
            const duration = data.confirmation_duration || 10
            setTimeout(() => {
              setShowOrderConfirmation(false)
              setOrders([])
              setShowOrderSide(false)
              // Refresh the page
              window.location.reload()
            }, duration * 1000)
          }
        } catch (e) {
          console.error('❌ Error parsing message:', e)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setWsStatus('Error')
      }

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket closed')
        setWsStatus('Disconnected')

        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            console.log('🔄 Reconnecting...')
            connectWebSocket()
          }
        }, 3000)
      }
    } catch (error) {
      console.error('❌ WebSocket connection error:', error)
      setWsStatus('Error')
    }
  }

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const startRecording = async () => {
    try {
      await stopRecording()
      await new Promise(resolve => setTimeout(resolve, 200))

      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close()
        } catch (e) {
          console.warn('Failed to close AudioContext:', e)
        }
        audioContextRef.current = null
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported')
      }

      console.log('🎤 Requesting microphone access...')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      console.log('✅ Microphone access granted')
      streamRef.current = stream

      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioContextRef.current = new AudioContext()
      const nativeSampleRate = audioContextRef.current.sampleRate

      console.log(`AudioContext: ${nativeSampleRate} Hz → ${SAMPLE_RATE} Hz (resampling)`)

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream)
      const bufferSize = 4096
      processorRef.current = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1)

      let audioBuffer = []
      const resampleRatio = nativeSampleRate / SAMPLE_RATE

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)

        // Calculate audio level (RMS - Root Mean Square)
        let sum = 0
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i]
        }
        const rms = Math.sqrt(sum / inputData.length)
        const level = Math.min(1, rms * 10) // Amplify and clamp to 0-1
        setAudioLevel(level)

        // Resample to 16kHz
        const resampledLength = Math.floor(inputData.length / resampleRatio)
        const resampledData = new Float32Array(resampledLength)

        for (let i = 0; i < resampledLength; i++) {
          const srcIndex = Math.floor(i * resampleRatio)
          resampledData[i] = inputData[srcIndex]
        }

        // Buffer and send chunks
        for (let i = 0; i < resampledData.length; i++) {
          audioBuffer.push(resampledData[i])

          if (audioBuffer.length >= CHUNK_SIZE) {
            const chunk = audioBuffer.splice(0, CHUNK_SIZE)
            const float32Array = new Float32Array(chunk)
            const int16Array = new Int16Array(CHUNK_SIZE)

            // Convert to Int16 PCM
            for (let j = 0; j < CHUNK_SIZE; j++) {
              const s = Math.max(-1, Math.min(1, float32Array[j]))
              int16Array[j] = s < 0 ? s * 0x8000 : s * 0x7FFF
            }

            // Send to WebSocket
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(int16Array.buffer)
            }
          }
        }
      }

      sourceRef.current.connect(processorRef.current)
      processorRef.current.connect(audioContextRef.current.destination)

      console.log('✅ Recording started')
    } catch (error) {
      console.error('❌ Recording error:', error)
      setIsListening(false)

      let errorMessage = 'Could not access microphone. '
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permission denied.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found.'
      } else {
        errorMessage += error.message
      }
      alert(errorMessage)
    }
  }

  const stopRecording = async () => {
    try {
      if (processorRef.current) {
        processorRef.current.disconnect()
        processorRef.current.onaudioprocess = null
        processorRef.current = null
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close()
        audioContextRef.current = null
      }

      console.log('⏹️ Recording stopped')
    } catch (error) {
      console.error('❌ Error stopping recording:', error)
    }
  }

  const playNextSentence = async () => {
    try {
      if (sentenceQueueRef.current.length === 0) {
        console.log('✅ All sentences played')
        isPlayingSentenceRef.current = false
        setIsPlayingAudio(false)

        // Resume recording
        if (wasRecordingRef.current) {
          wasRecordingRef.current = false
          setTimeout(() => setIsListening(true), 500)
        }
        return
      }

      const sentenceChunks = sentenceQueueRef.current.shift()
      isPlayingSentenceRef.current = true
      setIsPlayingAudio(true)

      const audioBlob = new Blob(sentenceChunks, { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)

      if (!audioElementRef.current) {
        audioElementRef.current = new Audio()
      }

      const audio = audioElementRef.current
      audio.src = audioUrl
      audio.volume = 1.0

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        playNextSentence()
      }

      audio.onerror = (error) => {
        console.error('❌ Playback error:', error)
        URL.revokeObjectURL(audioUrl)
        isPlayingSentenceRef.current = false
        setIsPlayingAudio(false)
      }

      await audio.play()
      console.log('▶️ Playing sentence')
    } catch (error) {
      console.error('❌ playNextSentence error:', error)
    }
  }

  const animateItemToOrder = (item, event) => {
    setShowOrderSide(true)

    const flyingElement = document.createElement('div')
    flyingElement.className = 'flying-food-item'
    flyingElement.innerHTML = `<img src="${item.image}" alt="${item.name}" />`
    document.body.appendChild(flyingElement)

    const clickedElement = event?.currentTarget || event?.target
    let startRect

    if (clickedElement) {
      const menuItemElement = clickedElement.closest('.menu-item')
      if (menuItemElement) {
        startRect = menuItemElement.getBoundingClientRect()
      }
    }

    if (!startRect) {
      const menuSide = document.querySelector('.menu-side')
      startRect = menuSide ? menuSide.getBoundingClientRect() : {
        left: window.innerWidth / 4,
        top: window.innerHeight / 2,
        width: 0,
        height: 0
      }
    }

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
        addToOrder(item)
        flyingElement.remove()
      }
    }, 100)
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

      {/* Latest Message Display - Top */}
      {(conversationHistory.length > 0 || transcription || botResponse) && (
        <div style={{
          position: 'fixed',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: '90%',
          maxWidth: '1000px',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <p style={{
            fontSize: 'clamp(12px, 2vw, 16px)',
            color: 'black',
            fontWeight: '700',
            padding: '0',
            margin: '0',
            wordWrap: 'break-word',
            textShadow: '0 0 1px white'
          }}>
            {conversationHistory.length > 0
              ? conversationHistory[conversationHistory.length - 1].text
              : (botResponse || transcription || 'Listening...')}
          </p>
        </div>
      )}

      {/* Siri Orb - Bottom Center */}
      <div style={{
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'auto',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        width: '120px',
        height: '120px'
      }}>
        <SiriMicrophone
          isRecording={isListening}
          onMicClick={() => {}}
          transcription={transcription}
          audioLevel={audioLevel}
        />
      </div>

      <div className="split-container">
        {/* Menu Side */}
        <div className={`menu-side ${showOrderSide ? 'half-width' : 'full-width'}`} ref={menuSideRef}>
          <div className="menu-header-overlay">
            <h2>Menu</h2>
          </div>

          {/* Menu Items */}
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

        {/* Order Side */}
        {showOrderSide && (
          <div className="order-side">
            <div className="order-header">
              <h2>Your Order</h2>
              <span className="order-count">{orders.length} items</span>
            </div>

            <div className="order-items">
              {orders.map(order => (
                <div key={order.id} className="order-item">
                  <img src={order.image} alt={order.name} className="order-item-image" />
                  <div className="order-item-details">
                    <h4>{order.name}</h4>
                    <p>₹{order.price}</p>
                  </div>
                  <div className="order-item-quantity">
                    <button onClick={() => removeFromOrder(order.id)}>-</button>
                    <span>{order.quantity}</span>
                    <button onClick={() => addToOrder(order)}>+</button>
                  </div>
                  <p className="order-item-total">₹{order.price * order.quantity}</p>
                </div>
              ))}
            </div>

            <div className="order-total">
              <h3>Total</h3>
              <h3>₹{getTotalPrice()}</h3>
            </div>

            <button className="place-order-btn" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </div>
        )}
      </div>

      {showOrderConfirmation && (
        <div className="order-confirmation">
          <div className="confirmation-content">
            <svg className="checkmark" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h2>Order Confirmed!</h2>
            <p>Bill sent to kitchen</p>

            {/* Show ordered items */}
            {orders.length > 0 && (
              <div style={{
                marginTop: '20px',
                textAlign: 'left',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <h3 style={{ marginBottom: '10px', textAlign: 'center' }}>Your Order:</h3>
                {orders.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div style={{
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '2px solid rgba(255,255,255,0.5)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '1.2em'
                }}>
                  <span>Total:</span>
                  <span>₹{orders.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                </div>
              </div>
            )}

            <p style={{ marginTop: '20px', fontSize: '0.9em', opacity: 0.8 }}>
              Redirecting to home in 10 seconds...
            </p>
          </div>
        </div>
      )}

      {/* Highlighted Food Item Card */}
      {highlightedItem && (
        <FoodItemCard
          item={highlightedItem}
          onClose={() => setHighlightedItem(null)}
        />
      )}
    </div>
  )
}

export default OrderScreen
