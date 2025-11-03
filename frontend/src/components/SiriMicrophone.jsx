import React from 'react'
import CustomOrb from './CustomOrb'
import './SiriMicrophone.css'

const SiriMicrophone = ({ isRecording, onMicClick, transcription, audioLevel = 0 }) => {
  // Siri-style vibrant colorful design with dynamic gradients
  const siriConfig = {
    palette: {
      mainBgStart: '#000000',
      mainBgEnd: '#1a1a2e',
      // Layer 1: Purple/Pink
      layer1Start: '#FF006E',
      layer1End: '#8338EC',
      // Layer 2: Blue/Cyan
      layer2Start: '#00F5FF',
      layer2End: '#0096FF',
      // Layer 3: Orange/Yellow
      layer3Start: '#FF006E',
      layer3End: '#FFBE0B',
      // Layer 4: Green/Teal
      layer4Start: '#06FFA5',
      layer4End: '#00D9FF',
      // Layer 5: Purple/Magenta
      layer5Start: '#B537F2',
      layer5End: '#FF006E',
    },
    size: 0.38,
    animationSpeedBase: isRecording ? 2.5 : 1.0,
    numLayers: 5
  }

  return (
    <div
      className={`siri-orb-container ${isRecording ? 'recording' : ''}`}
      onClick={onMicClick}
      style={{
        background: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none'
      }}
    >
      <CustomOrb
        isRecording={isRecording}
        size={siriConfig.size}
        animationSpeedBase={siriConfig.animationSpeedBase}
        palette={siriConfig.palette}
        numLayers={siriConfig.numLayers}
        audioLevel={audioLevel}
      />
    </div>
  )
}

export default SiriMicrophone
