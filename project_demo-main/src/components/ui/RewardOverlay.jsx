import React from 'react';
import { Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { playGameSfx } from '../audio/AmbientAudio';

const RewardOverlay = () => {
  const { rewardPopup, setRewardPopup, addItem, setViewState } = useGameStore();

  const handleCollectItem = () => {
    if (rewardPopup) {
      playGameSfx('pickup');
      addItem(rewardPopup);
      const targetState = rewardPopup.targetViewState || 'BRANCH';
      setRewardPopup(null);
      setViewState(targetState); // Return to the target state
    }
  };

  if (!rewardPopup) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(5, 8, 17, 0.75)', backdropFilter: 'blur(8px)',
        zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center',
        pointerEvents: 'auto'
      }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-panel text-center py-5"
        style={{
          width: '800px', maxWidth: '90%', padding: '40px',
          borderRadius: '24px', border: '1px solid rgba(56, 189, 248, 0.4)',
          position: 'relative', overflow: 'hidden'
        }}
      >
        <h2 className="mb-4 text-warning fw-bold">Tuyệt vời! Bạn nhận được:</h2>
        <motion.div 
          animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          style={{ fontSize: '80px', marginBottom: '20px' }}
        >
          {rewardPopup.icon}
        </motion.div>
        <h3 className="text-white mb-5">{rewardPopup.name}</h3>
        <Button variant="warning" size="lg" className="fw-bold px-5 py-3 rounded-pill shadow-lg" onClick={handleCollectItem}>
          Nhận vật phẩm & Tiếp tục
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default RewardOverlay;
