import React, { useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import { useSpring, a } from '@react-spring/three';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../../../store/useGameStore';
import questionsData from '../../../../data/questions.json';
import { playGameSfx } from '../../../audio/AmbientAudio';

const DraggableFragment = ({ idx, optionText, initialPos, onDrop, isCorrect }) => {
  const { size, viewport } = useThree();
  const aspect = viewport.width / size.width;
  
  const [spring, api] = useSpring(() => ({
    position: initialPos,
    scale: [1, 1, 1],
    rotation: [Math.random(), Math.random(), 0],
    config: { mass: 1, tension: 170, friction: 26 }
  }));

  const bind = useDrag(({ offset: [x, y], active, event }) => {
    event.stopPropagation();
    if (active) {
      api.start({
        position: [initialPos[0] + x * aspect, initialPos[1] - y * aspect, initialPos[2]],
        scale: [1.2, 1.2, 1.2],
      });
    } else {
      // Dropped
      const dropX = initialPos[0] + x * aspect;
      const dropY = initialPos[1] - y * aspect;
      
      // Check if dropped in the chasm zone (center bottom)
      const inChasm = dropX > -4 && dropX < 4 && dropY > -6 && dropY < -2;
      
      if (inChasm) {
        onDrop(idx, isCorrect, api);
      } else {
        api.start({ position: initialPos, scale: [1, 1, 1] }); // Snap back
      }
    }
  }, { pointerEvents: true });

  return (
    <a.mesh {...bind()} position={spring.position} scale={spring.scale} rotation={spring.rotation}>
      <dodecahedronGeometry args={[2.5, 0]} />
      <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.7} wireframe={false} />
      <Html center transform position={[0, 0, 2.6]} style={{ width: '200px', pointerEvents: 'none' }}>
        <div style={{ color: 'white', fontSize: '14px', textAlign: 'center', background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '8px' }}>
          {optionText}
        </div>
      </Html>
    </a.mesh>
  );
};

const Branch2Minigame = () => {
  const { activeNodeId, setViewState, answerQuestion, setRewardPopup } = useGameStore();
  const question = questionsData[activeNodeId];
  const [answeredState, setAnsweredState] = useState(null);

  const handleDrop = (idx, isCorrect, api) => {
    if (answeredState) return;

    if (isCorrect) {
      playGameSfx('correct');
      setAnsweredState('correct');
      // Morph into a bridge
      api.start({
        position: [0, -4, 0],
        scale: [4, 0.5, 2],
        rotation: [0, 0, 0],
        config: { tension: 100 }
      });

      answerQuestion(question.id, true);
      setTimeout(() => {
        if (question.rewardItemId) {
          const itemDef = {
            id: question.rewardItemId,
            name: question.rewardItemId === 'rope' ? 'Dây thừng' :
                  question.rewardItemId === 'water' ? 'Bình nước tinh khiết' :
                  question.rewardItemId === 'fire' ? 'Mồi lửa' : 'Vật phẩm',
            icon: question.rewardItemId === 'rope' ? '🪢' :
                  question.rewardItemId === 'water' ? '💧' :
                  question.rewardItemId === 'fire' ? '🔥' : '🎁',
          };
          setRewardPopup(itemDef);
        } else {
          setViewState('BRANCH');
        }
      }, 2000);

    } else {
      playGameSfx('wrong');
      setAnsweredState('wrong');
      // Fall into chasm
      api.start({
        position: [0, -15, -5],
        scale: [0, 0, 0],
        rotation: [Math.PI, Math.PI, 0],
        config: { mass: 2, tension: 50 }
      });
      answerQuestion(question.id, false);
      setTimeout(() => {
        setViewState('BRANCH');
      }, 1500);
    }
  };

  if (!question) return null;

  const positions = [
    [-8, 6, 0], [8, 6, 0], [-8, 0, 0], [8, 0, 0]
  ];

  return (
    <group>
      {/* Question Text */}
      <Html position={[0, 9, 0]} center transform style={{ width: '800px', textAlign: 'center' }}>
        <div style={{ padding: '20px', background: 'rgba(15,23,42,0.8)', border: '2px solid #3b82f6', borderRadius: '16px', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
          {question.text}
        </div>
      </Html>

      {/* The Chasm */}
      <mesh position={[0, -4, -2]}>
        <boxGeometry args={[10, 0.5, 4]} />
        <meshStandardMaterial color="#0f172a" emissive="#1e3a8a" emissiveIntensity={0.5} transparent opacity={0.8} />
      </mesh>
      <Html position={[0, -4, 0]} center transform>
        <div style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '20px', textShadow: '0 0 10px #3b82f6', pointerEvents: 'none' }}>
          KÉO MẢNH ĐÁ VÀO ĐÂY LÀM CẦU
        </div>
      </Html>

      {/* Fragments */}
      {question.options.map((opt, idx) => (
        <DraggableFragment 
          key={idx} 
          idx={idx} 
          optionText={opt} 
          initialPos={positions[idx]} 
          isCorrect={idx === question.correctAnswerIndex}
          onDrop={handleDrop}
        />
      ))}

      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 10, 10]} intensity={1} color="#60a5fa" />
    </group>
  );
};

export default Branch2Minigame;
