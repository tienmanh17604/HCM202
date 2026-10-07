import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../../store/useGameStore';

const WarpSpeed = () => {
  const viewState = useGameStore(state => state.viewState);
  const currentBranch = useGameStore(state => state.currentBranch);
  const pointsRef = useRef();

  // Generate random star positions
  const [positions, colors] = useMemo(() => {
    const pos = [];
    const col = [];
    
    // Choose color based on branch
    const colorTheme = new THREE.Color();
    if (currentBranch === 1) colorTheme.set("#a855f7"); // Purple
    else if (currentBranch === 2) colorTheme.set("#3b82f6"); // Blue
    else if (currentBranch === 3) colorTheme.set("#eab308"); // Gold
    else colorTheme.set("#ffffff"); // Multi/Boss

    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 200; // Spread deeply
      pos.push(x, y, z);
      
      // Slightly vary the color
      const c = colorTheme.clone();
      if (currentBranch === 'BOSS') c.setHSL(Math.random(), 0.8, 0.6);
      else c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
      
      col.push(c.r, c.g, c.b);
    }
    return [new Float32Array(pos), new Float32Array(col)];
  }, [currentBranch]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 2; i < positions.length; i += 3) {
        positions[i] += delta * 150; // Move Z towards camera quickly
        if (positions[i] > 50) {
          positions[i] = -150; // Reset back
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (viewState !== 'WARPING') return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.5} vertexColors transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

export default WarpSpeed;
