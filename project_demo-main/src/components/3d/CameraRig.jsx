import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

const CameraRig = () => {
  const { camera } = useThree();
  const viewState = useGameStore(state => state.viewState);
  const setViewState = useGameStore(state => state.setViewState);
  const activeNodeId = useGameStore(state => state.activeNodeId);
  
  const hubPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const targetPos = useRef(new THREE.Vector3(0, 5, 25));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Store pointer for parallax in HUB
  const pointer = useRef(new THREE.Vector2());

  useEffect(() => {
    const handleMouseMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isInitialized = useRef(false);

  useFrame((state) => {
    if (!isInitialized.current) {
      camera.position.set(0, 5, 25);
      camera.lookAt(0, 0, 0);
      isInitialized.current = true;
    }

    if (viewState === 'START') {
      // Orbit slowly around the brain
      const t = state.clock.elapsedTime * 0.2;
      targetPos.current.set(Math.sin(t) * 25, 5, Math.cos(t) * 25);
      targetLookAt.current.set(0, 0, 0);
      
      camera.position.lerp(targetPos.current, 0.05);
      
      const dummy = new THREE.Object3D();
      dummy.position.copy(camera.position);
      dummy.lookAt(targetLookAt.current);
      camera.quaternion.slerp(dummy.quaternion, 0.05);
      
    } else if (viewState === 'FLYING') {
      // Cinematic pull-back to reveal the vast neural network
      targetPos.current.set(0, 5, 35);
      camera.position.lerp(targetPos.current, 0.04);
      
      targetLookAt.current.set(0, 0, 0);
      const dummy = new THREE.Object3D();
      dummy.position.copy(camera.position);
      dummy.lookAt(targetLookAt.current);
      camera.quaternion.slerp(dummy.quaternion, 0.05);
      
      if (camera.position.distanceTo(targetPos.current) < 2) {
        setViewState('HUB'); // Switch to interactive Hub
      }
      
    } else if (viewState === 'HUB') {
      // Floating outside the cluster with mouse parallax
      const t = state.clock.elapsedTime * 0.1;
      targetPos.current.set(
         pointer.current.x * 10 + Math.sin(t) * 5, 
         5 + pointer.current.y * 10, 
         35 + Math.cos(t) * 5
      );
      camera.position.lerp(targetPos.current, 0.05);
      
      targetLookAt.current.set(0, 0, 0);
      
      const dummy = new THREE.Object3D();
      dummy.position.copy(camera.position);
      dummy.lookAt(targetLookAt.current);
      camera.quaternion.slerp(dummy.quaternion, 0.05);
      
    } else if (viewState === 'QUESTION') {
      // Look at the active question node
      if (activeNodeId !== null) {
        const i = activeNodeId;
        const phi = Math.acos(1 - 2 * (i + 0.5) / 25);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const r = 25 + (i % 5) * 2; // Matches Scene1 math exactly
        
        targetLookAt.current.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );
        
        const dummy = new THREE.Object3D();
        dummy.position.copy(camera.position);
        dummy.lookAt(targetLookAt.current);
        camera.quaternion.slerp(dummy.quaternion, 0.1);
      }
    }
  });

  return null;
};

export default CameraRig;
