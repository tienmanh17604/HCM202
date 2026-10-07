import React, { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../../../store/useGameStore';
import questionsData from '../../../../data/questions.json';
import { playGameSfx } from '../../../audio/AmbientAudio';

const ConveyorFloor = () => {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -2, 0] }));
  return (
    <mesh ref={ref}>
      <planeGeometry args={[100, 10]} />
      <meshStandardMaterial color="#475569" wireframe={true} />
    </mesh>
  );
};

const BoxItem = ({ idx, optionText, initialPos, isCorrect, onResult }) => {
  const [ref, api] = useBox(() => ({ mass: 1, position: initialPos, args: [2, 2, 2] }));
  const [clicked, setClicked] = useState(false);
  const [destroyed, setDestroyed] = useState(false);

  // Simulate Conveyor Belt
  useFrame(() => {
    if (!clicked && !destroyed) {
      // Move right constantly
      api.velocity.set(3, 0, 0);
    }
  });

  // Check if box reached the end (Success)
  useEffect(() => {
    const unsubscribe = api.position.subscribe((p) => {
      if (p[0] > 15 && !destroyed) {
        if (isCorrect) {
          onResult(true);
          setDestroyed(true); // stop tracking
        }
      }
      if (p[1] < -10 && !destroyed) {
        if (!isCorrect) {
          // Wrong box successfully destroyed
        } else {
          // Accidentally destroyed correct box
          onResult(false);
        }
        setDestroyed(true);
      }
    });
    return unsubscribe;
  }, [api.position, isCorrect, destroyed, onResult]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (clicked || destroyed) return;
    setClicked(true);
    
    // Apply huge impulse to shoot it off the belt into the "incinerator"
    api.applyImpulse([0, 10, -20], [0, 0, 0]);
    
    if (isCorrect) {
      // You just destroyed the correct answer!
      setTimeout(() => onResult(false), 1000);
    }
  };

  if (destroyed) return null;

  return (
    <mesh ref={ref} onClick={handleClick}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color={clicked ? "#ef4444" : "#94a3b8"} metalness={0.8} roughness={0.2} />
      <Html center transform position={[0, 0, 1.01]} style={{ width: '180px', pointerEvents: 'none' }}>
        <div style={{ color: 'white', fontSize: '14px', textAlign: 'center', background: 'rgba(0,0,0,0.7)', padding: '5px' }}>
          {String.fromCharCode(65 + idx)}. {optionText}
        </div>
      </Html>
    </mesh>
  );
};

const Branch3Minigame = () => {
  const { activeNodeId, setViewState, answerQuestion, setRewardPopup } = useGameStore();
  const question = questionsData[activeNodeId];
  const [answeredState, setAnsweredState] = useState(null);

  const handleResult = (success) => {
    if (answeredState) return;

    if (success) {
      playGameSfx('correct');
      setAnsweredState('correct');
      answerQuestion(question.id, true);
      
      setTimeout(() => {
        if (question.rewardItemId) {
          const itemDef = {
            id: question.rewardItemId,
            name: question.rewardItemId === 'gear' ? 'Bánh răng' :
                  question.rewardItemId === 'scroll' ? 'Cuộn giấy' : 'Vật phẩm',
            icon: question.rewardItemId === 'gear' ? '⚙️' :
                  question.rewardItemId === 'scroll' ? '📜' : '🎁',
          };
          setRewardPopup(itemDef);
        } else {
          setViewState('BRANCH');
        }
      }, 1000);
    } else {
      playGameSfx('wrong');
      setAnsweredState('wrong');
      answerQuestion(question.id, false);
      setTimeout(() => {
        setViewState('BRANCH');
      }, 1500);
    }
  };

  if (!question) return null;

  return (
    <group>
      {/* Question Text */}
      <Html position={[0, 8, 0]} center transform style={{ width: '800px', textAlign: 'center' }}>
        <div style={{ padding: '20px', background: 'rgba(15,23,42,0.8)', border: '2px solid #eab308', borderRadius: '16px', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
          {question.text}
        </div>
      </Html>

      {/* Incinerator Pit */}
      <mesh position={[0, -15, -10]}>
        <boxGeometry args={[40, 5, 20]} />
        <meshBasicMaterial color="#7f1d1d" />
      </mesh>
      <pointLight position={[0, -10, -10]} color="#ef4444" intensity={5} distance={50} />

      {/* Physics World */}
      <Physics gravity={[0, -20, 0]}>
        <ConveyorFloor />
        {question.options.map((opt, idx) => (
          <BoxItem 
            key={idx} 
            idx={idx} 
            optionText={opt} 
            initialPos={[-15 - (idx * 5), 5, 0]} // spawn them sequentially
            isCorrect={idx === question.correctAnswerIndex}
            onResult={handleResult}
          />
        ))}
      </Physics>

      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 10, 10]} intensity={1} color="#eab308" />
    </group>
  );
};

export default Branch3Minigame;
