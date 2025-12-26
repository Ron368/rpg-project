import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Center, Edges, Sparkles, Text } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import './LoadingScreen3D.css'

function DataCube({ progress = 0 }) {
  const group = useRef(null)
  const inner = useRef(null)

  useFrame((_, dt) => {
    if (group.current) {
      group.current.rotation.x += dt * 0.35
      group.current.rotation.y += dt * 0.6
    }
    if (inner.current) {
      inner.current.rotation.x -= dt * 0.8
      inner.current.rotation.y += dt * 0.35
    }
  })

  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100)

  return (
    <group ref={group}>
      {/* Outer wireframe "data block" */}
      <mesh>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial
          color="#021018"
          emissive="#56e0ff"
          emissiveIntensity={1.6}
          wireframe
          transparent
          opacity={0.35}
        />
        <Edges color="#56e0ff" />
      </mesh>

      {/* Inner core */}
      <mesh ref={inner} scale={0.65}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial
          color="#020712"
          emissive="#00d4ff"
          emissiveIntensity={2.2}
          wireframe
          transparent
          opacity={0.22}
        />
        <Edges color="#00d4ff" />
      </mesh>

      {/* Floating "data sparks" */}
      <Sparkles count={90} scale={[6, 4, 6]} size={2.2} speed={0.25} color="#56e0ff" />

      {/* Text */}
      <Center position={[0, -2.1, 0]}>
        <Text
          fontSize={0.34}
          letterSpacing={0.12}
          color="#cbeeff"
          anchorX="center"
          anchorY="middle"
        >
          COMPILING DATA
        </Text>
      </Center>

      <Center position={[0, -2.6, 0]}>
        <Text fontSize={0.22} letterSpacing={0.08} color="#88d4ff">
          {pct}%
        </Text>
      </Center>
    </group>
  )
}

export default function LoadingScreen3D({ visible = true, progress = 0 }) {
  // If not visible, remove from DOM entirely (so it won't block clicks)
  if (!visible) return null

  const style = useMemo(() => ({ opacity: 1, pointerEvents: 'auto' }), [])

  return (
    <div className="loading3d-overlay" style={style} aria-hidden={!visible}>
      <div className="loading3d-scanlines" />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#050b14']} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[3, 3, 2]} intensity={0.9} color="#bdf3ff" />
        <pointLight position={[-3, -1, 3]} intensity={1.2} color="#56e0ff" />

        <DataCube progress={progress} />

        <EffectComposer>
          <Bloom intensity={1.15} luminanceThreshold={0.12} luminanceSmoothing={0.2} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}