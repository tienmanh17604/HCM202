import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from 'react-bootstrap';
import { useGameStore } from '../../store/useGameStore';
import { playGameSfx } from '../audio/AmbientAudio';

const GateGuardianModal = () => {
  const { lockedPortalTarget, setLockedPortalTarget, hasKeyForBranch, consumeKeyAndUnlock } = useGameStore();
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    if (lockedPortalTarget) {
      setHasKey(hasKeyForBranch(lockedPortalTarget));
    }
  }, [lockedPortalTarget, hasKeyForBranch]);

  if (!lockedPortalTarget) return null;

  const handleUnlock = () => {
    playGameSfx('unlock');
    consumeKeyAndUnlock(lockedPortalTarget);
    setLockedPortalTarget(null);
  };

  const branchName = lockedPortalTarget === 2 ? 'Không gian Ánh Xanh' 
                   : lockedPortalTarget === 3 ? 'Không gian Vàng Kim' 
                   : 'Bánh xe Lịch Sử';
                   
  const keyName = lockedPortalTarget === 2 ? 'Chìa khóa Nhãn quan Duy vật' 
                : lockedPortalTarget === 3 ? 'Chìa khóa Đám mây Bước nhảy' 
                : 'Chìa khóa Bánh xe Lịch sử';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 100, pointerEvents: 'auto'
        }}
      >
        <motion.div 
          initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))',
            border: '2px solid #fbbf24', borderRadius: '16px',
            padding: '40px', maxWidth: '600px', width: '90%',
            textAlign: 'center', boxShadow: '0 0 50px rgba(251, 191, 36, 0.2)'
          }}
        >
          <motion.div 
            animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 4 }}
            style={{ fontSize: '64px', marginBottom: '20px', filter: 'drop-shadow(0 0 20px #fbbf24)' }}
          >
            🐉
          </motion.div>
          <h2 className="text-warning fw-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>THỬ THÁCH CỦA LONG THẦN</h2>
          <p className="fs-5 text-white mb-4 lh-lg" style={{ fontStyle: 'italic' }}>
            "Hỡi kẻ lữ hành dũng cảm... Ngươi muốn bước vào <strong>{branchName}</strong> ư?<br/>
            Cánh cổng này bị phong ấn bằng quy luật của vũ trụ.<br/>
            Ngươi có mang theo <strong>{keyName}</strong> không?"
          </p>
          
          <div className="d-flex justify-content-center gap-4 mt-5">
            <Button variant="outline-light" className="px-4 py-2 fw-bold" onClick={() => setLockedPortalTarget(null)}>
              Quay lại chế tạo
            </Button>
            
            {hasKey ? (
              <Button variant="warning" className="px-4 py-2 fw-bold" onClick={handleUnlock}>
                Mở Khóa Cánh Cổng
              </Button>
            ) : (
              <Button variant="secondary" className="px-4 py-2 fw-bold" disabled>
                Ngươi chưa đủ tư cách!
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GateGuardianModal;
