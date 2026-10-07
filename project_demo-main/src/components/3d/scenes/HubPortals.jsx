import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/useGameStore';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { playGameSfx } from '../../audio/AmbientAudio';

const PortalGalaxy = ({ color, isUnlocked }) => {
  const pointsRef = useRef();
  
  const [positions, colors] = useMemo(() => {
    const pos = [];
    const col = [];
    const colorObj = new THREE.Color(color);
    
    for (let i = 0; i < 2000; i++) {
      const radius = Math.random() * 4 + 1; // Radius 1 to 5
      const angle = Math.random() * Math.PI * 2;
      
      const x = Math.cos(angle) * radius;
      const y = (Math.random() - 0.5) * 1.5;
      const z = Math.sin(angle) * radius;
      pos.push(x, y, z);
      
      const c = colorObj.clone();
      c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.5);
      col.push(c.r, c.g, c.b);
    }
    return [new Float32Array(pos), new Float32Array(col)];
  }, [color]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= isUnlocked ? delta * 0.5 : delta * 0.1;
      pointsRef.current.rotation.z -= isUnlocked ? delta * 0.2 : delta * 0.05;
    }
  });

  return (
    <points ref={pointsRef} rotation={[Math.PI / 4, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.15} vertexColors transparent opacity={isUnlocked ? 0.9 : 0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

const LockAndChains = ({ isShattering }) => {
  const groupRef = useRef();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isShattering) {
      // Generate shatter pieces
      const p = [];
      for (let i = 0; i < 50; i++) {
        p.push({
          pos: new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4),
          vel: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
          rot: new THREE.Vector3(Math.random(), Math.random(), Math.random()),
        });
      }
      setParticles(p);
    }
  }, [isShattering]);

  useFrame((state, delta) => {
    if (isShattering && groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (particles[i]) {
          child.position.addScaledVector(particles[i].vel, delta);
          child.rotation.x += particles[i].rot.x * delta * 5;
          child.rotation.y += particles[i].rot.y * delta * 5;
        }
      });
    }
  });

  if (isShattering) {
    return (
      <group ref={groupRef}>
        {particles.map((_, i) => (
          <mesh key={i}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      {/* Chains */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.2, 0.2, 10, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.2, 0.2, 10, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Lock */}
      <mesh position={[0, 0, 0.5]}>
        <boxGeometry args={[2, 2.5, 1]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Keyhole */}
      <mesh position={[0, -0.2, 1.01]}>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
        <meshBasicMaterial color="#000" />
      </mesh>
    </group>
  );
};

const Portal = ({ position, color, branchId, name, requiredItems }) => {
  const { unlockedPortals, setViewState, setCurrentBranch, setLockedPortalTarget } = useGameStore();
  const [wasUnlocked, setWasUnlocked] = useState(unlockedPortals.includes(branchId));
  const isUnlocked = unlockedPortals.includes(branchId);
  const [isShattering, setIsShattering] = useState(false);

  useEffect(() => {
    if (!wasUnlocked && isUnlocked) {
      // Just unlocked!
      playGameSfx('unlock');
      setIsShattering(true);
      setTimeout(() => {
        setIsShattering(false);
        setWasUnlocked(true);
      }, 2000);
    } else if (wasUnlocked && !isUnlocked) {
      // Reset game triggered
      setWasUnlocked(false);
      setIsShattering(false);
    }
  }, [isUnlocked, wasUnlocked]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isUnlocked) {
      playGameSfx('portal');
      setCurrentBranch(branchId);
      setViewState('WARPING');
      setTimeout(() => {
        setViewState('BRANCH');
      }, 2500); // 2.5s warp effect
    } else {
      playGameSfx('locked');
      setLockedPortalTarget(branchId);
    }
  };

  return (
    <group position={position}>
      <mesh 
        onClick={handleClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <sphereGeometry args={[5, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <PortalGalaxy color={color} isUnlocked={isUnlocked} />
      
      {!wasUnlocked && <LockAndChains isShattering={isShattering} />}

      {/* Label */}
      <Html position={[0, -6, 0]} center>
        <div style={{ color: 'white', textAlign: 'center', fontFamily: 'Outfit, sans-serif', width: '250px', pointerEvents: 'none' }}>
          <h4 style={{ color: isUnlocked ? '#fff' : '#94a3b8', textShadow: isUnlocked ? `0 0 10px ${color}` : 'none' }}>
            {name}
          </h4>
          {!isUnlocked && !isShattering && (
            <div style={{ fontSize: '12px', color: '#f87171' }}>
              🔒 Khóa kín (Cần: {requiredItems})
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

const HubPortals = () => {
  const viewState = useGameStore(state => state.viewState);
  if (viewState !== 'HUB') return null;

  return (
    <group>
      <Portal position={[-16, 0, 0]} color="#94a3b8" branchId={1} name="Nhánh 1: Tinh hệ Bạc" requiredItems="Mở sẵn" />
      <Portal position={[-6, 0, -8]} color="#3b82f6" branchId={2} name="Nhánh 2: Tinh hệ Lam" requiredItems="Chìa khóa Nhãn quan" />
      <Portal position={[6, 0, -8]} color="#eab308" branchId={3} name="Nhánh 3: Tinh hệ Vàng" requiredItems="Huy hiệu Biện Chứng" />
      <Portal position={[16, 0, 0]} color="#ffffff" branchId="BOSS" name="Kho tàng Tối thượng" requiredItems="Chìa khóa Bánh xe Lịch sử" />
    </group>
  );
};

export default HubPortals;
