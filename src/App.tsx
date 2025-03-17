import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, useTexture, PerspectiveCamera, Environment, Float, RoundedBox } from '@react-three/drei'
import { Vector3, MathUtils, Group, Mesh } from 'three'
import { motion } from 'framer-motion'
import './App.css'

// Calculator state management
function useCalculator() {
  const [display, setDisplay] = useState('0')
  const [storedValue, setStoredValue] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [memory, setMemory] = useState(0)
  const [history, setHistory] = useState<string[]>([])

  const clearAll = () => {
    setDisplay('0')
    setStoredValue(null)
    setOperator(null)
    setWaitingForOperand(false)
  }

  const clearDisplay = () => {
    setDisplay('0')
    setWaitingForOperand(false)
  }

  const toggleSign = () => {
    const value = parseFloat(display)
    setDisplay(String(-value))
  }

  const inputPercent = () => {
    const value = parseFloat(display)
    setDisplay(String(value / 100))
  }

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }

    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display)

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
          newValue = inputValue
      }

      setStoredValue(newValue)
      setDisplay(String(newValue))
      
      // Add to history
      setHistory(prev => [...prev, `${currentValue} ${operator} ${inputValue} = ${newValue}`])
    }

    setWaitingForOperand(true)
    setOperator(nextOperator)
  }

  const handleMemoryAdd = () => {
    setMemory(memory + parseFloat(display))
  }

  const handleMemorySubtract = () => {
    setMemory(memory - parseFloat(display))
  }

  const handleMemoryRecall = () => {
    setDisplay(String(memory))
    setWaitingForOperand(true)
  }

  const handleMemoryClear = () => {
    setMemory(0)
  }

  return {
    display,
    memory,
    history,
    clearAll,
    clearDisplay,
    toggleSign,
    inputPercent,
    inputDot,
    inputDigit,
    performOperation,
    handleMemoryAdd,
    handleMemorySubtract,
    handleMemoryRecall,
    handleMemoryClear
  }
}

// 3D Button component with advanced effects
function Button({ position, size = [0.9, 0.9, 0.2], color = '#333', hoverColor = '#555', textColor = '#fff', text, onClick, fontSize = 0.4, textPosition = [0, 0, 0.11] }) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const buttonRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)

  // Animate button on hover and press
  useFrame(() => {
    if (!buttonRef.current) return
    
    // Scale animation
    buttonRef.current.scale.x = MathUtils.lerp(
      buttonRef.current.scale.x,
      hovered ? 1.05 : 1,
      0.1
    )
    buttonRef.current.scale.y = MathUtils.lerp(
      buttonRef.current.scale.y,
      hovered ? 1.05 : 1,
      0.1
    )
    
    // Position animation for press effect
    if (meshRef.current) {
      meshRef.current.position.z = MathUtils.lerp(
        meshRef.current.position.z,
        pressed ? -0.05 : 0,
        0.2
      )
    }
  })

  return (
    <group 
      ref={buttonRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => {
        setHovered(false)
        setPressed(false)
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => {
        setPressed(false)
        onClick()
      }}
    >
      <RoundedBox 
        ref={meshRef}
        args={size} 
        radius={0.1} 
        smoothness={4}
      >
        <meshStandardMaterial 
          color={hovered ? hoverColor : color} 
          metalness={0.5}
          roughness={0.2}
          emissive={hovered ? hoverColor : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </RoundedBox>
      <Text
        position={textPosition}
        fontSize={fontSize}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {text}
      </Text>
    </group>
  )
}

// Display component with glass effect
function Display({ value, position = [0, 3.5, 0.1], width = 4.8, height = 1.2 }) {
  const displayRef = useRef<Group>(null)
  
  return (
    <group ref={displayRef} position={position}>
      <RoundedBox args={[width, height, 0.2]} radius={0.1} smoothness={4}>
        <meshPhysicalMaterial 
          color="#111827"
          metalness={0.2}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transmission={0.1}
        />
      </RoundedBox>
      <Text
        position={[0, 0, 0.11]}
        fontSize={0.6}
        color="#38bdf8"
        anchorX="right"
        anchorY="middle"
        maxWidth={width - 0.4}
        font="/fonts/Inter-Bold.woff"
        position-x={width / 2 - 0.3}
      >
        {value}
      </Text>
    </group>
  )
}

// Calculator body component
function CalculatorBody() {
  const calculator = useCalculator()
  
  // Define button layout
  const buttons = [
    // Row 1 - Memory and Clear functions
    { position: [-2, 2, 0], text: 'MC', color: '#1e293b', hoverColor: '#334155', onClick: calculator.handleMemoryClear },
    { position: [-1, 2, 0], text: 'MR', color: '#1e293b', hoverColor: '#334155', onClick: calculator.handleMemoryRecall },
    { position: [0, 2, 0], text: 'M+', color: '#1e293b', hoverColor: '#334155', onClick: calculator.handleMemoryAdd },
    { position: [1, 2, 0], text: 'M-', color: '#1e293b', hoverColor: '#334155', onClick: calculator.handleMemorySubtract },
    { position: [2, 2, 0], text: 'AC', color: '#7f1d1d', hoverColor: '#b91c1c', onClick: calculator.clearAll },
    
    // Row 2
    { position: [-2, 1, 0], text: '7', onClick: () => calculator.inputDigit('7') },
    { position: [-1, 1, 0], text: '8', onClick: () => calculator.inputDigit('8') },
    { position: [0, 1, 0], text: '9', onClick: () => calculator.inputDigit('9') },
    { position: [1, 1, 0], text: '÷', color: '#0c4a6e', hoverColor: '#0369a1', onClick: () => calculator.performOperation('÷') },
    { position: [2, 1, 0], text: '%', color: '#0c4a6e', hoverColor: '#0369a1', onClick: calculator.inputPercent },
    
    // Row 3
    { position: [-2, 0, 0], text: '4', onClick: () => calculator.inputDigit('4') },
    { position: [-1, 0, 0], text: '5', onClick: () => calculator.inputDigit('5') },
    { position: [0, 0, 0], text: '6', onClick: () => calculator.inputDigit('6') },
    { position: [1, 0, 0], text: '×', color: '#0c4a6e', hoverColor: '#0369a1', onClick: () => calculator.performOperation('×') },
    { position: [2, 0, 0], text: '±', color: '#0c4a6e', hoverColor: '#0369a1', onClick: calculator.toggleSign },
    
    // Row 4
    { position: [-2, -1, 0], text: '1', onClick: () => calculator.inputDigit('1') },
    { position: [-1, -1, 0], text: '2', onClick: () => calculator.inputDigit('2') },
    { position: [0, -1, 0], text: '3', onClick: () => calculator.inputDigit('3') },
    { position: [1, -1, 0], text: '-', color: '#0c4a6e', hoverColor: '#0369a1', onClick: () => calculator.performOperation('-') },
    { position: [2, -1, 0], text: 'C', color: '#7f1d1d', hoverColor: '#b91c1c', onClick: calculator.clearDisplay },
    
    // Row 5
    { position: [-2, -2, 0], text: '0', size: [1.9, 0.9, 0.2], onClick: () => calculator.inputDigit('0') },
    { position: [-0.5, -2, 0], text: '.', onClick: calculator.inputDot },
    { position: [1, -2, 0], text: '+', color: '#0c4a6e', hoverColor: '#0369a1', onClick: () => calculator.performOperation('+') },
    { position: [2, -2, 0], text: '=', color: '#0c4a6e', hoverColor: '#0369a1', onClick: () => calculator.performOperation('=') },
  ]

  return (
    <Float 
      speed={2} 
      rotationIntensity={0.2} 
      floatIntensity={0.5}
      floatingRange={[-0.05, 0.05]}
    >
      {/* Calculator base */}
      <RoundedBox args={[5.5, 6.5, 0.5]} radius={0.2} smoothness={4} position={[0, 0, -0.3]}>
        <meshPhysicalMaterial 
          color="#0f172a" 
          metalness={0.7}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.2}
        />
      </RoundedBox>
      
      {/* Display */}
      <Display value={calculator.display} />
      
      {/* Buttons */}
      {buttons.map((button, index) => (
        <Button key={index} {...button} />
      ))}
    </Float>
  )
}

// Scene setup with camera and lighting
function Scene() {
  const { camera } = useThree()
  
  useEffect(() => {
    // Set initial camera position for isometric view
    camera.position.set(8, 8, 8)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return (
    <>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <CalculatorBody />
      
      <Environment preset="city" />
      <OrbitControls 
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        minDistance={8}
        maxDistance={20}
      />
    </>
  )
}

function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false)
  
  useEffect(() => {
    // Preload font
    const font = new FontFace('Inter', 'url(/fonts/Inter-Bold.woff)')
    font.load().then(() => {
      document.fonts.add(font)
      setFontsLoaded(true)
    })
  }, [])

  return (
    <motion.div 
      className="app-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <Canvas shadows dpr={[1, 2]}>
        <Scene />
      </Canvas>
      
      <div className="controls-overlay">
        <h1>3D Calculator</h1>
        <p>Drag to rotate • Scroll to zoom</p>
      </div>
    </motion.div>
  )
}

export default App