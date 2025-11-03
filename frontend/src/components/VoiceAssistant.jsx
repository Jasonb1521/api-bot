import React, { useEffect, useRef, useState } from 'react'

const VoiceAssistant = ({ isRecording, setIsRecording, connectionStatus }) => {
  const [wsStatus, setWsStatus] = useState('Disconnected')
  const [transcription, setTranscription] = useState('')
  const [botResponse, setBotResponse] = useState('')
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioGenerating, setAudioGenerating] = useState(false)
  const [currentOrder, setCurrentOrder] = useState([])
  const [orderTotal, setOrderTotal] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState(null)
  const wsRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const processorRef = useRef(null)
  const sourceRef = useRef(null)
  const audioElementRef = useRef(null)
  const audioChunksRef = useRef([])
  const wasRecordingRef = useRef(false)
  const sentenceQueueRef = useRef([])
  const currentSentenceChunksRef = useRef([])
  const isPlayingSentenceRef = useRef(false)

  const SAMPLE_RATE = 16000
  const CHUNK_SIZE = 512
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const WS_URL = `${wsProtocol}//${window.location.host}/ws/audio`

  useEffect(() => {
    connectWebSocket()

    return () => {
      disconnectWebSocket()
      stopRecording()
    }
  }, [])

  useEffect(() => {
    console.log('🎯 isRecording changed to:', isRecording)
    if (isRecording) {
      console.log('🎤 Starting recording from useEffect')
      startRecording()
    } else {
      console.log('⏹️ Stopping recording from useEffect')
      stopRecording()
    }
  }, [isRecording])

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket(WS_URL)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
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

          if (data.type === 'transcription') {
            console.log('📝 ASR Transcription:', data.text)
            setTranscription(data.text)
          } else if (data.type === 'bot_response') {
            console.log('🤖 LLM Response:', data.text)
            console.log('Response Length:', data.text.length, 'characters')
            console.log('Timestamp:', new Date().toISOString())
            setBotResponse(data.text)
          } else if (data.type === 'audio_generating') {
            console.log('⏳ Audio generating:', data.message)
            setAudioGenerating(true)
          } else if (data.type === 'audio_stream_start') {
            console.log('🎵 Audio stream start - Total sentences:', data.total_sentences)
            sentenceQueueRef.current = []
            currentSentenceChunksRef.current = []
            isPlayingSentenceRef.current = false

            // Pause recording if currently recording
            if (isRecording) {
              wasRecordingRef.current = true
              setIsRecording(false)
              console.log('⏸️ Pausing recording for audio playback')
            }
          } else if (data.type === 'sentence_audio_start') {
            console.log(`🎵 Sentence ${data.sentence_index + 1} audio start - Size: ${data.total_size} bytes`)
            console.log(`📝 Sentence text: ${data.sentence_text}`)
            currentSentenceChunksRef.current = []
          } else if (data.type === 'sentence_audio_complete') {
            console.log(`✅ Sentence ${data.sentence_index + 1} audio complete - Chunks: ${currentSentenceChunksRef.current.length}`)

            // Add completed sentence to queue
            if (currentSentenceChunksRef.current.length > 0) {
              sentenceQueueRef.current.push([...currentSentenceChunksRef.current])
              currentSentenceChunksRef.current = []

              // Start playing if not already playing
              if (!isPlayingSentenceRef.current) {
                playNextSentence()
              }
            }
          } else if (data.type === 'audio_stream_complete') {
            console.log(`✅ Audio stream complete - Total sentences: ${data.total_sentences}`)
            setAudioGenerating(false)
          } else if (data.type === 'audio_error') {
            console.error('❌ Audio error:', data.message)
            setAudioGenerating(false)
            setIsPlayingAudio(false)
            sentenceQueueRef.current = []
            currentSentenceChunksRef.current = []
            isPlayingSentenceRef.current = false

            // Resume recording if it was paused
            if (wasRecordingRef.current) {
              wasRecordingRef.current = false
              setIsRecording(true)
            }
          } else if (data.type === 'status') {
            console.log('📡 Status:', data.message)
          } else if (data.type === 'order_update') {
            // Real-time cart update
            console.log('🛒 Order update:', data.current_order)
            setCurrentOrder(data.current_order)
            setOrderTotal(data.total)
          } else if (data.type === 'order_confirmed') {
            // Order confirmed - show confirmation screen
            console.log('✅ Order confirmed:', data)
            setConfirmedOrder({
              order_id: data.order_id,
              items: data.items,
              total: data.total,
              order_number: data.order_number
            })
            setShowConfirmation(true)
            setCurrentOrder([])
            setOrderTotal(0)

            // Auto-dismiss after duration and redirect to homepage
            const duration = data.confirmation_duration || 10
            setTimeout(() => {
              setShowConfirmation(false)
              setConfirmedOrder(null)
              // Redirect to homepage
              window.location.href = '/'
            }, duration * 1000)
          }
        } catch (e) {
          console.error('❌ Error parsing message:', e)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setWsStatus('Error')
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket closed')
        setWsStatus('Disconnected')

        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            console.log('Reconnecting...')
            connectWebSocket()
          }
        }, 3000)
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
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
      // First, ensure everything is cleaned up
      await stopRecording()

      // Wait a bit for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 200))

      // Double-check: if AudioContext still exists, force close it
      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close()
        } catch (e) {
          console.warn('Failed to close existing AudioContext:', e)
        }
        audioContextRef.current = null
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser')
      }

      // Log browser info for debugging
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
      console.log('Browser:', isFirefox ? 'Firefox' : navigator.userAgent)
      console.log('Requesting microphone access...')

      // Don't specify sample rate - let browser choose to avoid mismatch
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      console.log('Microphone access granted')
      streamRef.current = stream

      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) {
        throw new Error('AudioContext is not supported in this browser')
      }

      // FIREFOX BUG WORKAROUND: Never specify sampleRate parameter
      // Firefox Bug #1725336 - Custom sample rates not supported with MediaStream
      // Must use default system sample rate for both AudioContext and MediaStream
      audioContextRef.current = new AudioContext()
      const nativeSampleRate = audioContextRef.current.sampleRate

      console.log(`AudioContext sample rate: ${nativeSampleRate} Hz (system default)`)
      console.log(`Target output sample rate: ${SAMPLE_RATE} Hz (will resample)`)

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream)

      const bufferSize = 4096
      processorRef.current = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1)

      let audioBuffer = []
      const resampleRatio = nativeSampleRate / SAMPLE_RATE

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)

        // Resample from native rate to target rate
        const resampledLength = Math.floor(inputData.length / resampleRatio)
        const resampledData = new Float32Array(resampledLength)

        for (let i = 0; i < resampledLength; i++) {
          const srcIndex = Math.floor(i * resampleRatio)
          resampledData[i] = inputData[srcIndex]
        }

        // Add resampled data to buffer
        for (let i = 0; i < resampledData.length; i++) {
          audioBuffer.push(resampledData[i])

          if (audioBuffer.length >= CHUNK_SIZE) {
            const chunk = audioBuffer.splice(0, CHUNK_SIZE)
            const float32Array = new Float32Array(chunk)
            const int16Array = new Int16Array(CHUNK_SIZE)

            for (let j = 0; j < CHUNK_SIZE; j++) {
              const s = Math.max(-1, Math.min(1, float32Array[j]))
              int16Array[j] = s < 0 ? s * 0x8000 : s * 0x7FFF
            }

            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(int16Array.buffer)
            }
          }
        }
      }

      sourceRef.current.connect(processorRef.current)
      processorRef.current.connect(audioContextRef.current.destination)

      console.log('Recording started successfully')
    } catch (error) {
      console.error('Error starting recording:', error)
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      setIsRecording(false)

      let errorMessage = 'Could not access microphone. '

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Permission denied. Please allow microphone access in your browser settings.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Microphone is already in use by another application.'
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Security error. Make sure you are using HTTPS.'
      } else {
        errorMessage += error.message || 'Unknown error occurred.'
      }

      alert(errorMessage)
    }
  }

  const stopRecording = async () => {
    console.log('Stopping recording...')

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

      // Close AudioContext and wait for it to fully close
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          await audioContextRef.current.close()
        }
        audioContextRef.current = null
      }

      console.log('Recording stopped')
    } catch (error) {
      console.error('Error stopping recording:', error)
    }
  }

  const playNextSentence = async () => {
    try {
      // Check if there are sentences to play
      if (sentenceQueueRef.current.length === 0) {
        console.log('✅ All sentences played')
        isPlayingSentenceRef.current = false
        setIsPlayingAudio(false)

        // Resume recording if it was paused
        if (wasRecordingRef.current) {
          wasRecordingRef.current = false
          setTimeout(() => {
            setIsRecording(true)
            console.log('🎤 Resuming recording after all audio playback')
          }, 500)  // Small delay before resuming
        }
        return
      }

      // Get next sentence from queue
      const sentenceChunks = sentenceQueueRef.current.shift()
      isPlayingSentenceRef.current = true
      setIsPlayingAudio(true)

      console.log(`🎵 Playing sentence - Chunks: ${sentenceChunks.length}, Queue remaining: ${sentenceQueueRef.current.length}`)

      // Combine all chunks into a single blob
      const audioBlob = new Blob(sentenceChunks, { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)

      console.log('🎵 Sentence audio - Size:', audioBlob.size, 'bytes')

      // Create or reuse audio element
      if (!audioElementRef.current) {
        console.log('🎵 Creating new Audio element')
        audioElementRef.current = new Audio()
      }

      const audio = audioElementRef.current
      audio.src = audioUrl
      audio.volume = 1.0
      audio.preload = 'auto'

      // Set up event handlers
      audio.onended = () => {
        console.log('🔇 Sentence playback ended')
        URL.revokeObjectURL(audioUrl)

        // Play next sentence
        playNextSentence()
      }

      audio.onerror = (error) => {
        console.error('❌ Sentence playback error:', error)
        URL.revokeObjectURL(audioUrl)
        isPlayingSentenceRef.current = false
        setIsPlayingAudio(false)

        // Try to continue with next sentence
        if (sentenceQueueRef.current.length > 0) {
          playNextSentence()
        } else {
          // Resume recording if it was paused
          if (wasRecordingRef.current) {
            wasRecordingRef.current = false
            setIsRecording(true)
          }
        }
      }

      // Play the audio with error handling
      try {
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          await playPromise
          console.log('▶️ Sentence playback started successfully')
        }
      } catch (playError) {
        console.error('❌ Failed to play sentence audio:', playError)
        console.error('Error name:', playError.name)
        console.error('Error message:', playError.message)

        // Common browser errors:
        if (playError.name === 'NotAllowedError') {
          console.error('Browser requires user interaction to play audio')
        } else if (playError.name === 'NotSupportedError') {
          console.error('Audio format not supported')
        }

        // Try to continue with next sentence
        if (sentenceQueueRef.current.length > 0) {
          playNextSentence()
        } else {
          isPlayingSentenceRef.current = false
          setIsPlayingAudio(false)
        }
      }

    } catch (error) {
      console.error('❌ Error playing sentence:', error)
      isPlayingSentenceRef.current = false
      setIsPlayingAudio(false)

      // Try to continue with next sentence
      if (sentenceQueueRef.current.length > 0) {
        playNextSentence()
      } else {
        // Resume recording if it was paused
        if (wasRecordingRef.current) {
          wasRecordingRef.current = false
          setIsRecording(true)
        }
      }
    }
  }

  const playAudio = async () => {
    try {
      console.log('🎵 playAudio called - Chunks available:', audioChunksRef.current.length)

      if (audioChunksRef.current.length === 0) {
        console.log('❌ No audio chunks to play')
        return
      }

      // Combine all audio chunks into a single blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)

      console.log('🎵 Playing audio - Size:', audioBlob.size, 'bytes')
      console.log('🎵 Audio URL created:', audioUrl)

      // Create or reuse audio element
      if (!audioElementRef.current) {
        console.log('🎵 Creating new Audio element')
        audioElementRef.current = new Audio()
      }

      const audio = audioElementRef.current
      audio.src = audioUrl

      // Add additional properties for better compatibility
      audio.volume = 1.0
      audio.preload = 'auto'

      setIsPlayingAudio(true)

      // Set up event handlers
      audio.onended = () => {
        console.log('🔇 Audio playback ended')
        setIsPlayingAudio(false)
        URL.revokeObjectURL(audioUrl)
        audioChunksRef.current = []

        // Resume recording if it was paused
        if (wasRecordingRef.current) {
          wasRecordingRef.current = false
          setTimeout(() => {
            setIsRecording(true)
            console.log('🎤 Resuming recording after audio playback')
          }, 500)  // Small delay before resuming
        }
      }

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error)
        setIsPlayingAudio(false)
        URL.revokeObjectURL(audioUrl)
        audioChunksRef.current = []

        // Resume recording if it was paused
        if (wasRecordingRef.current) {
          wasRecordingRef.current = false
          setIsRecording(true)
        }
      }

      // Play the audio with error handling
      try {
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          await playPromise
          console.log('▶️ Audio playback started successfully')
        }
      } catch (playError) {
        console.error('❌ Failed to play audio:', playError)
        console.error('Error name:', playError.name)
        console.error('Error message:', playError.message)

        // Common browser errors:
        if (playError.name === 'NotAllowedError') {
          console.error('Browser requires user interaction to play audio')
        } else if (playError.name === 'NotSupportedError') {
          console.error('Audio format not supported')
        }
      }

    } catch (error) {
      console.error('❌ Error playing audio:', error)
      setIsPlayingAudio(false)
      audioChunksRef.current = []

      // Resume recording if it was paused
      if (wasRecordingRef.current) {
        wasRecordingRef.current = false
        setIsRecording(true)
      }
    }
  }

  const handleRecordClick = () => {
    console.log('🖱️ Record button clicked, current isRecording:', isRecording, 'isPlayingAudio:', isPlayingAudio)

    // Don't allow recording changes while playing audio
    if (isPlayingAudio) {
      console.log('❌ Cannot change recording state while playing audio')
      return
    }

    // If starting to record, send start_ordering message to clear cart
    if (!isRecording && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_ordering' }))
      console.log('📤 Sent start_ordering message to backend')
    }

    console.log('✅ Toggling recording to:', !isRecording)
    setIsRecording(!isRecording)
  }

  return (
    <div className="voice-assistant">
      <div className="voice-header">
        <h2 className="voice-title">VOICE ASSISTANT</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="connection-status">
            <div className={`status-indicator ${wsStatus === 'Connected' ? 'connected' : ''}`}></div>
            {wsStatus}
          </div>
          <button className="settings-icon">⚙️</button>
        </div>
      </div>

      <div className="voice-controls">
        <button
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={handleRecordClick}
        >
          <div className="pause-icon">
            <div className="pause-bar"></div>
            <div className="pause-bar"></div>
          </div>
        </button>

        {transcription && (
          <div className="transcription-box">
            <strong>You:</strong> {transcription}
          </div>
        )}

        {botResponse && (
          <div className="bot-response-box">
            <strong>Assistant:</strong> {botResponse}
            {audioGenerating && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                🔊 Generating speech...
              </div>
            )}
            {isPlayingAudio && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#4CAF50' }}>
                🔊 Playing audio...
              </div>
            )}
          </div>
        )}

        {/* Current Order Cart */}
        {currentOrder.length > 0 && (
          <div className="current-order-cart" style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: '2px solid #4CAF50'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>Your Order</h3>
            {currentOrder.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #ddd'
              }}>
                <span>{item.quantity}x {item.name}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '2px solid #333',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              <span>Total</span>
              <span>₹{orderTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Order Confirmation Modal */}
      {showConfirmation && confirmedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: '#4CAF50', marginBottom: '16px' }}>Order Confirmed!</h2>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>
              Order #{confirmedOrder.order_number}
            </p>

            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              {confirmedOrder.items.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '2px solid #333',
                fontWeight: 'bold',
                fontSize: '20px'
              }}>
                <span>Total</span>
                <span>₹{confirmedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <p style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '8px' }}>
              Bill sent to kitchen!
            </p>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Redirecting to homepage...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceAssistant
