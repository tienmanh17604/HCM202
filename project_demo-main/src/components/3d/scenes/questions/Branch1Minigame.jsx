import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../../../store/useGameStore';
import questionsData from '../../../../data/questions.json';
import { playGameSfx } from '../../../audio/AmbientAudio';

const Branch1Minigame = () => {
  const { activeNodeId, setViewState, answerQuestion, setRewardPopup } = useGameStore();
  const question = questionsData[activeNodeId];
  
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answeredState, setAnsweredState] = useState(null); // 'correct', 'wrong', null
  
  const handleSelect = (idx) => {
    if (answeredState) return;
    setSelectedIdx(idx);

    if (idx === question.correctAnswerIndex) {
      playGameSfx('correct');
      setAnsweredState('correct');
      answerQuestion(question.id, true);
      
      setTimeout(() => {
        if (question.rewardItemId) {
          const itemDef = {
            id: question.rewardItemId,
            name: question.rewardItemId === 'stone' ? 'Khối đá nguyên thủy' :
                  question.rewardItemId === 'mirror' ? 'Tấm gương sáng' :
                  question.rewardItemId === 'water' ? 'Bình nước tinh khiết' :
                  question.rewardItemId === 'fire' ? 'Mồi lửa' :
                  question.rewardItemId === 'rope' ? 'Dây thừng' :
                  question.rewardItemId === 'gear' ? 'Bánh răng' : 'Cuộn giấy',
            icon: question.rewardItemId === 'stone' ? '🪨' :
                  question.rewardItemId === 'mirror' ? '🪞' :
                  question.rewardItemId === 'water' ? '💧' :
                  question.rewardItemId === 'fire' ? '🔥' :
                  question.rewardItemId === 'rope' ? '🪢' :
                  question.rewardItemId === 'gear' ? '⚙️' : '📜',
          };
          setRewardPopup(itemDef);
        } else {
          setViewState('BRANCH');
        }
      }, 2000);
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
    <group position={[0, 0, 0]}>
      {/* Question Text */}
      <Html position={[0, 8, 0]} center transform style={{ width: '800px', textAlign: 'center' }}>
        <div style={{ padding: '20px', background: 'rgba(15,23,42,0.8)', border: '2px solid #a855f7', borderRadius: '16px', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
          {question.text}
        </div>
      </Html>

      {/* Floating Monoliths (Options) */}
      {question.options.map((opt, idx) => {
        const isSelected = selectedIdx === idx;
        const isCorrect = answeredState === 'correct' && isSelected;
        const isWrong = answeredState === 'wrong' && isSelected;
        
        const xPos = (idx % 2 === 0 ? -6 : 6);
        const yPos = idx < 2 ? 3 : -3;

        return (
          <group key={idx} position={[xPos, yPos, 0]} onClick={(e) => { e.stopPropagation(); handleSelect(idx); }}>
            <mesh>
              <boxGeometry args={[10, 3, 1]} />
              <meshStandardMaterial 
                color={isCorrect ? '#22c55e' : isWrong ? '#ef4444' : '#6b21a8'} 
                emissive={isCorrect ? '#22c55e' : isWrong ? '#ef4444' : '#a855f7'}
                emissiveIntensity={isSelected ? 2 : 0.5}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
            <Html center transform position={[0, 0, 0.6]} style={{ width: '400px', pointerEvents: 'none' }}>
              <div style={{ color: 'white', fontSize: '18px', textAlign: 'center', textShadow: '0 0 5px black' }}>
                <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
              </div>
            </Html>

            {/* Light Beam Effect on Correct */}
            {isCorrect && (
              <mesh position={[0, 10, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 20, 16]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
              </mesh>
            )}
          </group>
        );
      })}

      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 10]} intensity={2} color="#c084fc" />
    </group>
  );
};

export default Branch1Minigame;
