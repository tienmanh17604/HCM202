import React, { useMemo, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import * as THREE from 'three';
import questionsData from '../../../data/questions.json';

const Scene1 = () => {
  const viewState = useGameStore(state => state.viewState);
  const setViewState = useGameStore(state => state.setViewState);
  const setActiveNode = useGameStore(state => state.setActiveNode);

  // Use the exact number of questions available
  const nodePositions = useMemo(() => {
    const positions = [];
    const numNodes = questionsData.questions ? questionsData.questions.length : questionsData.length; // usually 25
    
    for (let i = 0; i < numNodes; i++) {
      // Golden spiral distribution roughly
      const phi = Math.acos(1 - 2 * (i + 0.5) / numNodes);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      
      const r = 12 + (i % 5) * 3; // Radius 12 to 24 for a wider cluster
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions.push(new THREE.Vector3(x, y, z));
    }
    return positions;
  }, []);

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1.5, 32, 32), []);
  const defaultMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.5, toneMapped: false 
  }), []);
  const hoverMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: 0xfcd34d, emissive: 0xfcd34d, emissiveIntensity: 2, toneMapped: false 
  }), []);

  const [hoveredNode, setHoveredNode] = useState(null);

  const handleNodeClick = (e, index) => {
    e.stopPropagation();
    if (viewState === 'HUB') {
      setActiveNode(index);
      setViewState('QUESTION');
    }
  };

  // Only render nodes if in HUB or QUESTION view
  if (viewState === 'START') return null;

  return (
    <group>
      {/* 25 Question Nodes */}
      {nodePositions.map((pos, idx) => (
        <mesh 
          key={idx} 
          position={pos} 
          geometry={sphereGeo} 
          material={hoveredNode === idx ? hoverMat : defaultMat}
          onClick={(e) => handleNodeClick(e, idx)}
          onPointerOver={(e) => { e.stopPropagation(); setHoveredNode(idx); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e) => { setHoveredNode(null); document.body.style.cursor = 'default'; }}
        />
      ))}
    </group>
  );
};

export default Scene1;
