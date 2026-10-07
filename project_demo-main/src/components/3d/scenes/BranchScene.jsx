import React, { useMemo, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playGameSfx } from '../../audio/AmbientAudio';
import { useGameStore } from '../../../store/useGameStore';
import questionsData from '../../../data/questions.json';

const Branch1Background = () => {
  const crystalsRef = useRef();
  
  const [positions, rotations, colors] = useMemo(() => {
    const pos = [];
    const rot = [];
    const col = [];
    const colorTheme = new THREE.Color("#a855f7");

    for (let i = 0; i < 60; i++) {
      pos.push((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80 - 20);
      rot.push(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const c = colorTheme.clone();
      c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
      col.push(c.r, c.g, c.b);
    }
    return [new Float32Array(pos), new Float32Array(rot), new Float32Array(col)];
  }, []);

  useFrame((state) => {
    if (crystalsRef.current) {
      crystalsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      crystalsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <group ref={crystalsRef}>
      {Array.from({ length: 60 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[positions[i*3], positions[i*3+1], positions[i*3+2]]}
          rotation={[rotations[i*3], rotations[i*3+1], rotations[i*3+2]]}
        >
          <octahedronGeometry args={[Math.random() * 1.5 + 0.5]} />
          <meshStandardMaterial 
            color={new THREE.Color(colors[i*3], colors[i*3+1], colors[i*3+2])} 
            transparent opacity={0.6} wireframe={Math.random() > 0.7}
          />
        </mesh>
      ))}
    </group>
  );
};

const ShootingStarsBackground = () => {
  const starsGroupRef = useRef();
  
  const stars = useMemo(() => {
    return Array.from({ length: 30 }).map(() => ({
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100,
      speed: Math.random() * 50 + 50,
      length: Math.random() * 10 + 5
    }));
  }, []);

  useFrame((state, delta) => {
    if (starsGroupRef.current) {
      starsGroupRef.current.children.forEach((mesh, i) => {
        if (!stars[i]) return;
        mesh.position.x += stars[i].speed * delta;
        mesh.position.y -= stars[i].speed * delta * 0.5;
        // Reset when out of bounds
        if (mesh.position.x > 50) {
          mesh.position.x = -50;
          mesh.position.y = (Math.random() - 0.5) * 100;
        }
      });
    }
  });

  return (
    <group>
      <group ref={starsGroupRef}>
        {stars.map((star, i) => (
          <mesh key={i} position={[star.x, star.y, star.z]} rotation={[0, 0, -Math.PI / 8]}>
            <cylinderGeometry args={[0.05, 0.05, star.length, 4]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
      <pointLight color="#3b82f6" intensity={2} distance={100} />
    </group>
  );
};

const SolarSystemBackground = () => {
  const systemRef = useRef();
  const earthRef = useRef();
  const marsRef = useRef();

  useFrame((state, delta) => {
    if (systemRef.current) {
      systemRef.current.rotation.y += delta * 0.1;
    }
    if (earthRef.current) {
      earthRef.current.rotation.y += delta; // Earth spins
    }
  });

  return (
    <group ref={systemRef}>
      {/* Sun */}
      <mesh position={[0, 0, -30]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
        <pointLight color="#fbbf24" intensity={5} distance={200} />
      </mesh>
      
      {/* Earth Orbit */}
      <group position={[0, 0, -30]}>
        <mesh ref={earthRef} position={[25, 0, 0]}>
          <sphereGeometry args={[2, 32, 32]} />
          {/* Faux Earth styling using colors */}
          <meshStandardMaterial color="#3b82f6" emissive="#1e3a8a" emissiveIntensity={0.5} wireframe />
        </mesh>
      </group>

      {/* Mars Orbit */}
      <group position={[0, 0, -30]} rotation={[0, Math.PI / 4, 0]}>
        <mesh ref={marsRef} position={[40, 0, 0]}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial color="#ef4444" wireframe />
        </mesh>
      </group>
      
      {/* Distant Stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(Array.from({length: 1500}).map(() => (Math.random() - 0.5) * 200)), 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.5} color="#eab308" transparent opacity={0.6} />
      </points>
    </group>
  );
};

const InfiniteGalaxiesBackground = () => {
  const outerLayer = useRef();
  const innerLayer = useRef();

  const [outerPoints, innerPoints] = useMemo(() => {
    const createLayer = (count, radius, colorHex) => {
      const pos = [];
      const col = [];
      const colorObj = new THREE.Color(colorHex);
      for(let i=0; i<count; i++){
        const r = Math.random() * radius + 10;
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * (radius / 3);
        pos.push(r * Math.cos(theta), y, r * Math.sin(theta));
        
        const c = colorObj.clone();
        c.offsetHSL(Math.random() * 0.2, 0, (Math.random() - 0.5) * 0.5);
        col.push(c.r, c.g, c.b);
      }
      return [new Float32Array(pos), new Float32Array(col)];
    };
    return [createLayer(3000, 80, "#a855f7"), createLayer(2000, 40, "#ec4899")];
  }, []);

  useFrame((state, delta) => {
    if (outerLayer.current) outerLayer.current.rotation.y += delta * 0.05; // Slow rotation
    if (innerLayer.current) innerLayer.current.rotation.y += delta * 0.15; // Fast rotation
  });

  return (
    <group position={[0, -10, -20]}>
      {/* Stationary Core */}
      <mesh>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
        <pointLight color="#ffffff" intensity={8} distance={200} />
      </mesh>
      
      {/* Inner Fast Nebula */}
      <points ref={innerLayer}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[innerPoints[0], 3]} />
          <bufferAttribute attach="attributes-color" args={[innerPoints[1], 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.8} vertexColors transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      {/* Outer Slow Nebula */}
      <points ref={outerLayer}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outerPoints[0], 3]} />
          <bufferAttribute attach="attributes-color" args={[outerPoints[1], 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.4} vertexColors transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
};

const NeuralConnections = ({ nodePositions, branchQuestions, answeredQuestions }) => {
  const lines = useMemo(() => {
    const pts = [];
    const answeredInBranch = branchQuestions.filter(q => answeredQuestions.includes(q.id));
    answeredInBranch.sort((a, b) => a.id - b.id);
    
    for (let i = 0; i < answeredInBranch.length - 1; i++) {
      const p1 = nodePositions[branchQuestions.indexOf(answeredInBranch[i])];
      const p2 = nodePositions[branchQuestions.indexOf(answeredInBranch[i+1])];
      if (p1 && p2) {
        pts.push(p1, p2);
      }
    }
    return pts;
  }, [nodePositions, branchQuestions, answeredQuestions]);

  if (lines.length === 0) return null;

  return (
    <lineSegments>
      <bufferGeometry>
         <bufferAttribute attach="attributes-position" args={[new Float32Array(lines.flatMap(v => [v.x, v.y, v.z])), 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.8} linewidth={2} />
    </lineSegments>
  );
};

const RadiantCore = () => {
  const coreRef = useRef();
  useFrame((state) => {
    if (coreRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      coreRef.current.scale.setScalar(scale);
      coreRef.current.rotation.y += 0.02;
      coreRef.current.rotation.x += 0.01;
    }
  });

  return (
    <group ref={coreRef}>
      <mesh>
        <icosahedronGeometry args={[8, 2]} />
        <meshStandardMaterial color="#ffffff" emissive="#fbbf24" emissiveIntensity={4} wireframe />
      </mesh>
      <pointLight color="#ffffff" intensity={10} distance={200} />
      <mesh>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial color="#fcd34d" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

const BranchScene = () => {
  const { viewState, currentBranch, answeredQuestions, cooldownNodes, setActiveNode, setViewState } = useGameStore();
  const [hoveredNode, setHoveredNode] = useState(null);

  const branchQuestions = useMemo(() => {
    if (!currentBranch) return [];
    if (currentBranch === 'BOSS') return questionsData.filter(q => q.branchId === 4 || q.branchId === 'BOSS' || q.id === 25);
    return questionsData.filter(q => q.branchId == currentBranch);
  }, [currentBranch]);

  const isCompleted = branchQuestions.length > 0 && branchQuestions.every(q => answeredQuestions.includes(q.id));

  const nodePositions = useMemo(() => {
    const positions = [];
    const n = branchQuestions.length;
    
    if (currentBranch === 'BOSS') {
      positions.push(new THREE.Vector3(0, 0, 0)); // Center boss node
      return positions;
    }

    for (let i = 0; i < n; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / n);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 12 + (i % 3) * 4;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions.push(new THREE.Vector3(x, y, z));
    }
    return positions;
  }, [branchQuestions, currentBranch]);

  // Geometries for different branches
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1.5, 32, 32), []);
  const icosahedronGeo = useMemo(() => new THREE.IcosahedronGeometry(1.5, 0), []);
  const octahedronGeo = useMemo(() => new THREE.OctahedronGeometry(1.5, 0), []);
  const dodecahedronGeo = useMemo(() => new THREE.DodecahedronGeometry(4, 0), []); // Boss node

  const getNodeGeometry = () => {
    if (currentBranch === 1) return octahedronGeo;
    if (currentBranch === 2) return icosahedronGeo;
    if (currentBranch === 3) return sphereGeo;
    if (currentBranch === 'BOSS') return dodecahedronGeo;
    return sphereGeo;
  };

  const getMaterial = (q, idx) => {
    if (answeredQuestions.includes(q.id)) {
      return new THREE.MeshStandardMaterial({ color: '#fbbf24', emissive: '#f59e0b', emissiveIntensity: 2 });
    }
    if (cooldownNodes[q.id]) {
      return new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#7f1d1d', emissiveIntensity: 0.5 });
    }
    if (hoveredNode === idx) {
      return new THREE.MeshStandardMaterial({ color: '#60a5fa', emissive: '#3b82f6', emissiveIntensity: 1 });
    }
    const baseColor = currentBranch === 1 ? '#eab308' : currentBranch === 2 ? '#3b82f6' : currentBranch === 3 ? '#a855f7' : '#ffffff';
    return new THREE.MeshStandardMaterial({ color: baseColor, emissive: baseColor, emissiveIntensity: 0.2 });
  };

  const handleNodeClick = (e, q, idx) => {
    e.stopPropagation();
    if (answeredQuestions.includes(q.id)) return;
    if (cooldownNodes[q.id]) return;

    if (viewState === 'BRANCH') {
      playGameSfx('navigate');
      const globalIndex = questionsData.findIndex(item => item.id === q.id);
      setActiveNode(globalIndex);
      setViewState('QUESTION');
    }
  };

  if (viewState !== 'BRANCH') return null;

  return (
    <group>
      {/* Background conditionally rendered based on Branch */}
      {currentBranch === 1 && <SolarSystemBackground />}
      {currentBranch === 2 && <ShootingStarsBackground />}
      {currentBranch === 3 && <Branch1Background />}
      {currentBranch === 'BOSS' && <InfiniteGalaxiesBackground />}
      
      <NeuralConnections nodePositions={nodePositions} branchQuestions={branchQuestions} answeredQuestions={answeredQuestions} />
      
      {isCompleted && <RadiantCore />}

      {nodePositions.map((pos, idx) => {
        const q = branchQuestions[idx];
        const mat = getMaterial(q, idx);
        const geo = getNodeGeometry();

        return (
          <mesh 
            key={q.id} 
            position={pos} 
            geometry={geo} 
            material={mat}
            onClick={(e) => handleNodeClick(e, q, idx)}
            onPointerOver={(e) => { 
              e.stopPropagation(); 
              if (!answeredQuestions.includes(q.id) && !cooldownNodes[q.id]) {
                setHoveredNode(idx); 
                document.body.style.cursor = 'pointer'; 
              }
            }}
            onPointerOut={(e) => { 
              setHoveredNode(null); 
              document.body.style.cursor = 'default'; 
            }}
          >
            {answeredQuestions.includes(q.id) && (
              <pointLight color="#fbbf24" intensity={2} distance={10} />
            )}
          </mesh>
        );
      })}
    </group>
  );
};

export default BranchScene;
