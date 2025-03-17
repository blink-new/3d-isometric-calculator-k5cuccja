import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, useHelper } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import './App.css'

// Calculator button component
const CalculatorButton = ({ position, size = [0.9, 0.9, 0.2], color = '#4F46E5', hoverColor = '#818CF8', text, onClick }) => {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef()

  return (
    <mesh
      position={position}
      ref={meshRef}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={hovered ? hoverColor : color} />
      <Text
        position={[0, 0, 0.11]}
        fontSize={0.5}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </mesh>
  )
}

// Calculator display component
const CalculatorDisplay = ({ value, position = [0, 3.5, 0], size = [4.2, 1, 0.2] }) => {
  return (
    <group position={position}>
      <mesh receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <Text
        position={[0, 0, 0.11]}
        fontSize={0.6}
        color="#F8FAFC"
        anchorX="right"
        anchorY="middle"
        maxWidth={3.8}
        textAlign="right"
        position-x={size[0] / 2 - 0.2}
      >
        {value}
      </Text>
    </group>
  )
}

// Calculator body component
const CalculatorBody = () => {
  return (
    <mesh position={[0, 0, -0.2]} receiveShadow>
      <boxGeometry args={[5, 8, 0.2]} />
      <meshStandardMaterial color="#0F172A" />
    </mesh>
  )
}

// Main calculator component
const Calculator = () => {
  const [displayValue, setDisplayValue] = useState('0')
  const [storedValue, setStoredValue] = useState(null)
  const [operator, setOperator] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const clearAll = () => {
    setDisplayValue('0')
    setStoredValue(null)
    setOperator(null)
    setWaitingForOperand(false)
  }

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplayValue(String(digit))
      setWaitingForOperand(false)
    } else {
      setDisplayValue(displayValue === '0' ? String(digit) : displayValue + digit)
    }
  }

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplayValue('0.')
      setWaitingForOperand(false)
    } else if (displayValue.indexOf('.') === -1) {
      setDisplayValue(displayValue + '.')
    }
  }

  const performOperation = (nextOperator) => {
    const inputValue = parseFloat(displayValue)

    if (storedValue === null) {
      setStoredValue(inputValue)
    } else if (operator) {
      const currentValue = storedValue || 0
      let newValue = 0

      switch (operator) {
        case '+':
          newValue = currentValue + inputValue
          break
        case '-':
          newValue = currentValue - inputValue
          break
        case '×':
          newValue = currentValue * inputValue
          break
        case '÷':
          newValue = currentValue / inputValue
          break
        default:
          break
      }

      setStoredValue(newValue)
      setDisplayValue(String(newValue))
    }

    setWaitingForOperand(true)
    setOperator(nextOperator)
  }

  const handleEquals = () => {
    if (operator && !waitingForOperand) {
      performOperation('=')
      setOperator(null)
    }
  }

  const handlePercentage = () => {
    const value = parseFloat(displayValue)
    setDisplayValue(String(value / 100))
  }

  const toggleSign = () => {
    const value = parseFloat(displayValue)
    setDisplayValue(String(-value))
  }

  // Create calculator buttons layout
  const buttons = [
    { text: 'C', position: [-1.5, 2, 0], color: '#F43F5E', hoverColor: '#FB7185', onClick: clearAll },
    { text: '±', position: [-0.5, 2, 0], color: '#6D28D9', hoverColor: '#8B5CF6', onClick: toggleSign },
    { text: '%', position: [0.5, 2, 0], color: '#6D28D9', hoverColor: '#8B5CF6', onClick: handlePercentage },
    { text: '÷', position: [1.5, 2, 0], color: '#6D28D9', hoverColor: '#8B5CF6', onClick: () => performOperation('÷') },
    
    { text: '7', position: [-1.5, 1, 0], onClick: () => inputDigit(7) },
    { text: '8', position: [-0.5, 1, 0], onClick: () => inputDigit(8) },
    { text: '9', position: [0.5, 1, 0], onClick: () => inputDigit(9) },
    { text: '×', position: [1.5, 1, 0], color: '#6D28D9', hoverColor: '#8B5CF6', onClick: () => performOperation('×') },
    
    { text: '4', position: [-1.5, 0, 0], onClick: () => inputDigit(4) },
    { text: '5', position: [-0.5, 0, 0], onClick: () => inputDigit(5) },
    { text: '6', position: [0.5, 0, 0], onClick: () => inputDigit(6) },
    { text: '-', position: [1.5, 0, 0], color: '#6D28D9', hoverColor: '#8B5CF6', onClick: () => performOperation('-') },
    
    { text: '1', position: [-1.5, -1, 0], onClick: () => inputDigit(1) },
    { text: '2', position: [-0.5, -1, 0], onClick: () => inputDigit(2) },
    { text: '3', position: [0.5, -1, 0], onClick: () => inputDigit(3) },
    { text: '+', position: [1.5, -1, 0], color: '#6D28D9', hoverColor: '#8B5CF6', onClick: () => performOperation('+') },
    
    { text: '0', position: [-1, -2, 0], size: [1.9, 0.9, 0.2], onClick: () => inputDigit(0) },
    { text: '.', position: [0.5, -2, 0], onClick: inputDot },
    { text: '=', position: [1.5, -2, 0], color: '#059669', hoverColor: '#10B981', onClick: handleEquals }
  ]

  return (
    <group>
      <CalculatorBody />
      <CalculatorDisplay value={displayValue} />
      {buttons.map((button, index) => (
        <CalculatorButton key={index} {...button} />
      ))}
    </group>
  )
}

// Scene setup with lights
const Scene = () => {
  const directionalLightRef = useRef()
  useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1, 'red')

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        ref={directionalLightRef}
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024}
      />
      <Calculator />
    </>
  )
}

function App() {
  return (
    <motion.div 
      className="app-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Canvas 
        shadows 
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <color attach="background" args={['#F8FAFC']} />
        <Scene />
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />
      </Canvas>
    </motion.div>
  )
}

export default App