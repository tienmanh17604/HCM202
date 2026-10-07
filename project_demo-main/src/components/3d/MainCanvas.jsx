import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import BrainModel from './scenes/BrainModel';
import HubPortals from './scenes/HubPortals';
import WarpSpeed from './effects/WarpSpeed';
import BranchScene from './scenes/BranchScene';
import { useGameStore } from '../../store/useGameStore';

const MainCanvas = () => {
  const viewState = useGameStore((state) => state.viewState);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        backgroundColor: '#050811',
        opacity: viewState === 'ENDING' ? 0 : 1,
        transition: 'opacity 2.4s ease',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 35], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#050811']} />
        
        {/* Galaxy Background */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} color="#818cf8" />
        <pointLight position={[-10, -5, -10]} intensity={2} color="#c084fc" />
        
        <OrbitControls enablePan={false} minDistance={10} maxDistance={100} />
        
        <BrainModel />
        <HubPortals />
        <WarpSpeed />
        <BranchScene />
      </Canvas>
    </div>
  );
};

export default MainCanvas;
