import React from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import Branch1Minigame from './Branch1Minigame';
import Branch2Minigame from './Branch2Minigame';
import Branch3Minigame from './Branch3Minigame';

// Boss minigame could be a variation of Branch 1 or its own. We'll use Branch 1 for now.

const QuestionScene3D = () => {
  const { viewState, currentBranch } = useGameStore();

  if (viewState !== 'QUESTION') return null;

  return (
    <group>
      {currentBranch == 1 && <Branch1Minigame />}
      {currentBranch == 2 && <Branch2Minigame />}
      {currentBranch == 3 && <Branch3Minigame />}
      {currentBranch === 'BOSS' && <Branch1Minigame />}
    </group>
  );
};

export default QuestionScene3D;
