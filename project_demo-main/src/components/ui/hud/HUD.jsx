import React, { useState } from 'react';
import { Badge, Button } from 'react-bootstrap';
import { GiBackpack } from 'react-icons/gi';
import { useGameStore } from '../../../store/useGameStore';
import InventoryModal from '../inventory/InventoryModal';

import questionsData from '../../../data/questions.json';

const HUD = () => {
  const { inventory, viewState, setViewState, cooldownNodes, resetCooldowns, currentBranch, answeredQuestions } = useGameStore();
  const [showModal, setShowModal] = useState(false);

  // Check dead end condition
  let isDeadEnd = false;
  if (currentBranch) {
    const branchQuestions = questionsData.filter(q => q.branchId === currentBranch);
    const unanswered = branchQuestions.filter(q => !answeredQuestions.includes(q.id));
    const lockedCount = unanswered.filter(q => cooldownNodes[q.id]).length;
    
    if (unanswered.length > 0 && lockedCount === unanswered.length) {
      isDeadEnd = true;
    }
  }

  return (
    <>
      {/* Emergency Reset Button */}
      <div style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 10 }}>
        {isDeadEnd && (
          <Button 
            variant="outline-warning"
            onClick={resetCooldowns}
            className="hud-btn d-flex align-items-center gap-2 px-4 py-2"
            style={{ borderRadius: '30px', backgroundColor: 'rgba(15, 23, 42, 0.7)', boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)' }}
          >
            <i className="bi bi-arrow-clockwise fs-5"></i>
            <span className="fw-bold" style={{ letterSpacing: '1px' }}>KHÔI PHỤC NƠ-RON</span>
          </Button>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: '40px', left: '40px', zIndex: 10 }}>
        {viewState === 'HUB' && (
          <Button 
            variant="outline-info"
            onClick={() => setViewState('START')}
            className="hud-btn d-flex align-items-center gap-2 px-4 py-2 mb-3"
            style={{ borderRadius: '30px', backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
          >
            <i className="bi bi-house fs-5"></i>
            <span className="fw-bold" style={{ letterSpacing: '1px' }}>QUAY LẠI SẢNH CHÍNH</span>
          </Button>
        )}
        {viewState === 'BRANCH' && (
          <Button 
            variant="outline-info"
            onClick={() => setViewState('HUB')}
            className="hud-btn d-flex align-items-center gap-2 px-4 py-2"
            style={{ borderRadius: '30px', backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
          >
            <i className="bi bi-arrow-left fs-5"></i>
            <span className="fw-bold" style={{ letterSpacing: '1px' }}>QUAY LẠI CỔNG VŨ TRỤ</span>
          </Button>
        )}
      </div>

      {viewState !== 'START' && (
        <div style={{ position: 'fixed', top: '30px', right: '30px', zIndex: 10 }}>
          <Button 
            onClick={() => setShowModal(true)}
            className="hud-btn d-flex align-items-center gap-3 px-4 py-2"
            style={{ borderRadius: '30px' }}
          >
            <GiBackpack size={26} style={{ color: '#38bdf8' }} />
            <span className="fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '14px' }}>Túi Đồ</span>
            {inventory.length > 0 && (
              <Badge 
                bg="none" 
                style={{ 
                  background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  position: 'absolute', 
                  top: '-5px', 
                  right: '-5px',
                  fontSize: '13px',
                  padding: '6px 10px',
                  border: '2px solid rgba(15, 23, 42, 0.9)',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px rgba(225, 29, 72, 0.5)'
                }}
              >
                {inventory.length}
              </Badge>
            )}
          </Button>
        </div>
      )}

      <InventoryModal show={showModal} onHide={() => setShowModal(false)} />
    </>
  );
};

export default HUD;
