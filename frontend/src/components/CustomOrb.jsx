import React, { useEffect, useRef } from 'react'

const CustomOrb = ({
  isRecording = false,
  size = 0.7,
  animationSpeedBase = 1.0,
  palette = {},
  numLayers = 5,
  audioLevel = 0
}) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const timeRef = useRef(0)

  // Default Siri-style vibrant palette
  const defaultPalette = {
    mainBgStart: '#000000',
    mainBgEnd: '#1a1a2e',
    layer1Start: '#FF006E',
    layer1End: '#8338EC',
    layer2Start: '#00F5FF',
    layer2End: '#0096FF',
    layer3Start: '#FF006E',
    layer3End: '#FFBE0B',
    layer4Start: '#06FFA5',
    layer4End: '#00D9FF',
    layer5Start: '#B537F2',
    layer5End: '#FF006E',
  }

  const colors = { ...defaultPalette, ...palette }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    // Set canvas size
    const canvasSize = 300 * size
    canvas.width = canvasSize * dpr
    canvas.height = canvasSize * dpr
    canvas.style.width = `${canvasSize}px`
    canvas.style.height = `${canvasSize}px`
    ctx.scale(dpr, dpr)

    const centerX = canvasSize / 2
    const centerY = canvasSize / 2
    const baseRadius = canvasSize * 0.3

    const animate = () => {
      timeRef.current += 0.01 * animationSpeedBase

      // Clear canvas
      ctx.clearRect(0, 0, canvasSize, canvasSize)

      // Create glass-like background with gradient and highlights
      const bgGradient = ctx.createRadialGradient(
        centerX - canvasSize * 0.2, centerY - canvasSize * 0.2, 0,
        centerX, centerY, canvasSize / 2
      )
      bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
      bgGradient.addColorStop(0.3, 'rgba(100, 100, 150, 0.1)')
      bgGradient.addColorStop(0.7, 'rgba(20, 20, 40, 0.3)')
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)')

      // Draw background circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, canvasSize / 2, 0, Math.PI * 2)
      ctx.fillStyle = bgGradient
      ctx.fill()

      // Add glass shine highlight on top
      const shineGradient = ctx.createRadialGradient(
        centerX - canvasSize * 0.15, centerY - canvasSize * 0.15, 0,
        centerX, centerY, canvasSize * 0.4
      )
      shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
      shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)')
      shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.globalCompositeOperation = 'screen'
      ctx.beginPath()
      ctx.arc(centerX - canvasSize * 0.1, centerY - canvasSize * 0.1, canvasSize * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = shineGradient
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      // Draw multiple colorful blob layers with Siri-style animation
      const layerConfigs = []
      for (let i = 0; i < numLayers; i++) {
        const layerNum = i + 1
        layerConfigs.push({
          radius: baseRadius * (1.5 - i * 0.18),
          speed: 1.2 + i * 0.4,
          offset: (Math.PI * 2 * i) / numLayers,
          gradient: [
            colors[`layer${layerNum}Start`] || colors.layer1Start,
            colors[`layer${layerNum}End`] || colors.layer1End
          ],
          opacity: isRecording ? 0.85 - i * 0.12 : 0.65 - i * 0.1,
          points: 14 + i * 3,
          waveIntensity: (isRecording ? 0.3 + i * 0.08 : 0.2 + i * 0.05) * (1 + audioLevel * 2)
        })
      }

      layerConfigs.forEach((layer, layerIndex) => {
        ctx.save()

        // Add enhanced glow effect for Siri-style appearance
        ctx.shadowBlur = (isRecording ? 60 : 35) * (1 + audioLevel * 1.5)
        ctx.shadowColor = layer.gradient[0]

        ctx.globalAlpha = layer.opacity
        ctx.globalCompositeOperation = layerIndex % 2 === 0 ? 'screen' : 'lighten' // Alternate blend modes for richer colors

        // Create blob shape using bezier curves
        ctx.beginPath()

        const points = layer.points
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2

          // Add multiple wave frequencies for organic movement
          const wave1 = Math.sin(timeRef.current * layer.speed + angle * 3 + layer.offset) * layer.waveIntensity
          const wave2 = Math.cos(timeRef.current * layer.speed * 0.8 + angle * 5 - layer.offset) * (layer.waveIntensity * 0.6)
          const wave3 = Math.sin(timeRef.current * layer.speed * 1.5 + angle * 2) * (layer.waveIntensity * 0.4)
          const wave4 = Math.cos(timeRef.current * layer.speed * 0.5 - angle * 4) * (layer.waveIntensity * 0.3)

          const radius = layer.radius * (1 + wave1 + wave2 + wave3 + wave4)

          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            // Calculate control points for smooth curves
            const prevAngle = ((i - 1) / points) * Math.PI * 2
            const prevWave1 = Math.sin(timeRef.current * layer.speed + prevAngle * 3 + layer.offset) * layer.waveIntensity
            const prevWave2 = Math.cos(timeRef.current * layer.speed * 0.8 + prevAngle * 5 - layer.offset) * (layer.waveIntensity * 0.6)
            const prevWave3 = Math.sin(timeRef.current * layer.speed * 1.5 + prevAngle * 2) * (layer.waveIntensity * 0.4)
            const prevWave4 = Math.cos(timeRef.current * layer.speed * 0.5 - prevAngle * 4) * (layer.waveIntensity * 0.3)
            const prevRadius = layer.radius * (1 + prevWave1 + prevWave2 + prevWave3 + prevWave4)

            const cp1x = centerX + Math.cos(prevAngle + 0.2) * prevRadius
            const cp1y = centerY + Math.sin(prevAngle + 0.2) * prevRadius
            const cp2x = centerX + Math.cos(angle - 0.2) * radius
            const cp2y = centerY + Math.sin(angle - 0.2) * radius

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
          }
        }

        ctx.closePath()

        // Create vibrant gradient for the blob with dynamic color transitions
        const gradient = ctx.createRadialGradient(
          centerX + Math.sin(timeRef.current * 0.8 + layerIndex) * 25,
          centerY + Math.cos(timeRef.current * 0.8 + layerIndex) * 25,
          0,
          centerX,
          centerY,
          layer.radius * 1.3
        )

        // Add color stops with smooth transitions
        const midColor = `rgba(${
          parseInt(layer.gradient[0].slice(1, 3), 16) * 0.5 + parseInt(layer.gradient[1].slice(1, 3), 16) * 0.5
        }, ${
          parseInt(layer.gradient[0].slice(3, 5), 16) * 0.5 + parseInt(layer.gradient[1].slice(3, 5), 16) * 0.5
        }, ${
          parseInt(layer.gradient[0].slice(5, 7), 16) * 0.5 + parseInt(layer.gradient[1].slice(5, 7), 16) * 0.5
        }, 1)`

        gradient.addColorStop(0, layer.gradient[0])
        gradient.addColorStop(0.3, layer.gradient[1])
        gradient.addColorStop(0.6, midColor)
        gradient.addColorStop(1, layer.gradient[0])

        ctx.fillStyle = gradient
        ctx.fill()

        ctx.restore()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording, size, animationSpeedBase, colors, numLayers, audioLevel])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
      }}
    />
  )
}

export default CustomOrb
