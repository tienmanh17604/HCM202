import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import questionsData from '../../data/questions.json';
import { playGameSfx } from '../audio/AmbientAudio';

// --- Branch 2 RPG Minigame Component ---
const RPGMinigame = ({ question, onWin, onLose }) => {
  // Arena size: 800x500
  const arenaWidth = 800;
  const arenaHeight = 500;
  
  const [playerPos, setPlayerPos] = useState({ x: 400, y: 250 });
  const [carryingIdx, setCarryingIdx] = useState(null);
  const [readingIdx, setReadingIdx] = useState(null);
  
  const playerRef = useRef({ x: 400, y: 250 });
  const keysRef = useRef({ w: false, a: false, s: false, d: false });
  const reqRef = useRef(null);

  const speed = 4;
  const interactRadius = 80;
  
  const triggeredRef = useRef(false);
  const itemsRef = useRef([]);
  const readingIdxRef = useRef(null);
  
  useEffect(() => {
    readingIdxRef.current = readingIdx;
  }, [readingIdx]);

  // Initialize well-spaced random items only once
  useEffect(() => {
    const minDistance = 150;
    const spawnPoints = [];
    
    // Helper to check if a new point is far enough from existing points
    const isValid = (newP) => {
      for (const p of spawnPoints) {
        if (Math.hypot(p.x - newP.x, p.y - newP.y) < minDistance) {
          return false;
        }
      }
      return true;
    };

    // Rejection sampling for 6 items
    while (spawnPoints.length < 6) {
      const candidate = {
        x: 80 + Math.random() * (arenaWidth - 160),
        y: 80 + Math.random() * (arenaHeight - 200) // Keep away from bottom
      };
      // For fallback in case it gets stuck, although 800x500 is large enough for 6 points at distance 150
      if (isValid(candidate) || Math.random() < 0.01) { 
        spawnPoints.push(candidate);
      }
    }

    const generatedItems = [
      { idx: 0, text: question.options[0], ...spawnPoints[0], color: '#38bdf8' },
      { idx: 1, text: question.options[1], ...spawnPoints[1], color: '#38bdf8' },
      { idx: 2, text: question.options[2], ...spawnPoints[2], color: '#38bdf8' },
      { idx: 3, text: question.options[3], ...spawnPoints[3], color: '#38bdf8' },
      { idx: 4, text: "Chỉ là một khối vật chất vô nghĩa...", ...spawnPoints[4], color: '#38bdf8', isDistraction: true },
      { idx: 5, text: "Mảnh vỡ vệ tinh cũ, không có giá trị...", ...spawnPoints[5], color: '#38bdf8', isDistraction: true }
    ];
    itemsRef.current = generatedItems;
  }, [question]);

  const items = itemsRef.current;
  const blackHolePos = { x: 400, y: 430 }; // Bottom center

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        keysRef.current[key] = true;
      }
      if (key === 'f') handleF();
      if (key === 'j') handleJ();
    };
    
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        keysRef.current[key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); 

  const handleF = () => {
    playGameSfx('navigate');
    setReadingIdx(prev => {
      if (prev !== null) return null; 
      let closest = null;
      let minDist = interactRadius;
      itemsRef.current.forEach(item => {
        const dist = Math.hypot(playerRef.current.x - item.x, playerRef.current.y - item.y);
        if (dist < minDist) {
          minDist = dist;
          closest = item.idx;
        }
      });
      return closest;
    });
  };

  const handleJ = () => {
    playGameSfx('pickup');
    setCarryingIdx(prev => {
      if (prev !== null) return null; 
      let closest = null;
      let minDist = interactRadius;
      itemsRef.current.forEach(item => {
        const dist = Math.hypot(playerRef.current.x - item.x, playerRef.current.y - item.y);
        if (dist < minDist) {
          minDist = dist;
          closest = item.idx;
        }
      });
      if (closest !== null) setReadingIdx(null); 
      return closest;
    });
  };

  // Game Loop
  useEffect(() => {
    const update = () => {
      if (readingIdxRef.current === null) {
        let dx = 0;
        let dy = 0;
        if (keysRef.current.w) dy -= speed;
        if (keysRef.current.s) dy += speed;
        if (keysRef.current.a) dx -= speed;
        if (keysRef.current.d) dx += speed;

        if (dx !== 0 || dy !== 0) {
          setPlayerPos(prev => {
            let nx = prev.x + dx;
            let ny = prev.y + dy;
            nx = Math.max(20, Math.min(arenaWidth - 20, nx));
            ny = Math.max(20, Math.min(arenaHeight - 20, ny));
            playerRef.current = { x: nx, y: ny };
            return playerRef.current;
          });
        }
      }

      reqRef.current = requestAnimationFrame(update);
    };
    reqRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(reqRef.current);
  }, []);

  // Check Black Hole Win/Loss Condition
  useEffect(() => {
    if (triggeredRef.current) return;
    
    const distToHole = Math.hypot(playerPos.x - blackHolePos.x, playerPos.y - blackHolePos.y);
    if (distToHole < 50 && carryingIdx !== null) {
      const carriedItem = itemsRef.current.find(i => i.idx === carryingIdx);
      if (carriedItem && !carriedItem.isDistraction && carryingIdx === question.correctAnswerIndex) {
        triggeredRef.current = true;
        onWin();
      } else {
        triggeredRef.current = true;
        onLose();
      }
    }
  }, [playerPos, carryingIdx, question, onWin, onLose]);

  // Determine what UI prompt to show
  let promptText = "";
  if (readingIdx !== null) {
    // Currently reading
  } else if (carryingIdx !== null) {
    promptText = "[J] Thả vật liệu xuống";
  } else {
    // Check if near any item
    let isNear = false;
    itemsRef.current.forEach(item => {
      if (Math.hypot(playerPos.x - item.x, playerPos.y - item.y) < interactRadius) isNear = true;
    });
    if (isNear) {
      promptText = "[F] Đọc thông tin | [J] Nhặt";
    }
  }

  return (
    <div style={{ position: 'relative', width: arenaWidth + 'px', height: arenaHeight + 'px', margin: '0 auto', background: '#0f172a', border: '2px solid #38bdf8', borderRadius: '16px', overflow: 'hidden' }}>
      
      {/* HUD Info */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', color: '#94a3b8', fontSize: '14px' }}>
        Phím W, A, S, D để di chuyển
      </div>
      
      {/* Prompt UI */}
      {promptText && (
        <div style={{ position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', color: 'black', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
          {promptText}
        </div>
      )}

      {/* Reading Panel (Fullscreen Modal) */}
      <AnimatePresence>
        {readingIdx !== null && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
              background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
              zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <motion.div
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
               style={{
                 background: '#0f172a',
                 border: `3px solid ${itemsRef.current[readingIdx].color}`,
                 borderRadius: '24px',
                 padding: '40px',
                 width: '70%',
                 textAlign: 'center',
                 boxShadow: `0 0 40px rgba(56, 189, 248, 0.5)`
               }}
            >
              <h2 className="mb-4" style={{ color: itemsRef.current[readingIdx].color, textShadow: `0 0 10px ${itemsRef.current[readingIdx].color}` }}>
                <i className="bi bi-info-circle me-3"></i>Thông tin Mảnh Vật Liệu
              </h2>
              <div className="fs-4 my-4 lh-lg mx-auto text-white" style={{ maxWidth: '90%' }}>
                {itemsRef.current[readingIdx].text}
              </div>
              <div className="mt-5 d-flex gap-4 justify-content-center">
                <Button variant="outline-light" size="lg" onClick={handleF} className="fw-bold px-4 py-2">
                  <i className="bi bi-x-circle me-2"></i> Đóng lại [F]
                </Button>
                <Button variant="success" size="lg" onClick={handleJ} className="fw-bold px-4 py-2" style={{ boxShadow: '0 0 15px #198754' }}>
                  <i className="bi bi-hand-index-thumb me-2"></i> Nhặt Lên [J]
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Black Hole */}
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        style={{
          position: 'absolute',
          top: blackHolePos.y - 50,
          left: blackHolePos.x - 50,
          width: '100px', height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #000 20%, #a855f7 70%, transparent 100%)',
          boxShadow: '0 0 30px #a855f7'
        }}
      />
      <div style={{ position: 'absolute', top: blackHolePos.y - 15, left: blackHolePos.x - 30, color: '#fff', fontSize: '12px', pointerEvents: 'none', fontWeight: 'bold' }}>
        LỐI RA
      </div>

      {/* The Items on the ground */}
      {items.map(item => {
        if (carryingIdx === item.idx) return null; // Hidden if being carried
        return (
          <div key={item.idx} style={{
            position: 'absolute',
            top: item.y - 25,
            left: item.x - 25,
            width: '50px', height: '50px',
            backgroundColor: item.color,
            boxShadow: `0 0 20px ${item.color}`,
            borderRadius: '8px',
            animation: 'float 2s infinite ease-in-out',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '24px'
          }}>
            ?
          </div>
        );
      })}

      {/* The Player */}
      <div
        style={{
          position: 'absolute',
          top: playerPos.y - 20,
          left: playerPos.x - 20,
          width: '40px', height: '40px',
          backgroundColor: '#e2e8f0',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 10px rgba(255,255,255,0.5)',
          zIndex: 5
        }}
      >
        🧑‍🚀
        {/* Held Item */}
        {carryingIdx !== null && (
          <div style={{
            position: 'absolute',
            top: '-20px',
            width: '20px', height: '20px',
            backgroundColor: items[carryingIdx].color,
            boxShadow: `0 0 10px ${items[carryingIdx].color}`,
            borderRadius: '4px'
          }} />
        )}
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(10deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

// --- Main Question Overlay ---
const QuestionOverlay = () => {
  const { 
    activeNodeId, 
    viewState, 
    setViewState, 
    currentBranch,
    answerQuestion,
    setRewardPopup
  } = useGameStore();

  const [answeredState, setAnsweredState] = useState(null); // 'correct', 'wrong', null
  const answeringRef = useRef(false); // Guard chống double-click nhanh

  // Reset trạng thái khi mở câu hỏi mới (tránh hiển thị đáp án cũ)
  useEffect(() => {
    setAnsweredState(null);
    answeringRef.current = false;
  }, [activeNodeId]);

  if (viewState !== 'QUESTION' || activeNodeId === null) return null;

  const question = questionsData[activeNodeId];
  if (!question) return null;

  const triggerWin = () => {
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
        closeOverlay();
      }
    }, 1000);
  };

  const triggerLose = (exit = true) => {
    playGameSfx('wrong');
    setAnsweredState('wrong');
    if (currentBranch !== 'BOSS') {
      answerQuestion(question.id, false);
    }
    if (exit) {
      setTimeout(() => {
        closeOverlay();
      }, 1500);
    }
  };

  const handleStandardAnswer = (idx) => {
    if (answeredState || answeringRef.current) return;
    answeringRef.current = true;
    if (idx === question.correctAnswerIndex) {
      triggerWin();
    } else {
      triggerLose(true);
    }
  };

  const closeOverlay = () => {
    answeringRef.current = false;
    setAnsweredState(null);
    setViewState('BRANCH');
  };

  const isBranch2 = currentBranch == 2;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(5, 8, 17, 0.85)', backdropFilter: 'blur(10px)',
        zIndex: 40, display: 'flex', justifyContent: 'center', alignItems: 'center',
        pointerEvents: 'auto'
      }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-panel"
        style={{
          width: '900px', maxWidth: '95%', padding: '40px',
          borderRadius: '24px', border: '1px solid rgba(56, 189, 248, 0.4)',
          position: 'relative', overflow: 'hidden'
        }}
      >
        <div className="d-flex justify-content-between mb-4 align-items-center">
          <span className="badge bg-info text-dark px-3 py-2 fs-6">Nhánh {question.branchId}</span>
          <Button variant="outline-light" size="sm" onClick={closeOverlay}>
            <i className="bi bi-x-lg me-1"></i>Đóng
          </Button>
        </div>

        <motion.div key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="mb-4 lh-base text-white text-center" style={{ fontSize: '24px' }}>
            {question.text}
          </h3>
          
          {isBranch2 ? (
            <RPGMinigame question={question} onWin={triggerWin} onLose={triggerLose} />
          ) : (
            <div className="d-flex flex-column gap-3 mt-5">
              {question.options.map((opt, idx) => {
                const isCorrectAnswer = answeredState === 'correct' && idx === question.correctAnswerIndex;
                return (
                  <motion.div
                    key={idx}
                    animate={answeredState === 'wrong' ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Button 
                      variant={isCorrectAnswer ? 'success' : 'outline-info'}
                      className={`w-100 text-start py-3 px-4 fs-5 ${isCorrectAnswer ? 'fw-bold' : ''}`}
                      onClick={() => handleStandardAnswer(idx)}
                      disabled={answeredState === 'correct'}
                      style={{ 
                        borderRadius: '16px', borderWidth: isCorrectAnswer ? '2px' : '1px',
                        color: isCorrectAnswer ? '#fff' : '#e2e8f0',
                        backgroundColor: isCorrectAnswer ? '#198754' : 'rgba(15,23,42,0.6)'
                      }}
                    >
                      <strong style={{ color: isCorrectAnswer ? '#fff' : '#38bdf8', marginRight: '10px' }}>
                        {String.fromCharCode(65 + idx)}.
                      </strong> 
                      {opt}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {answeredState === 'correct' && !question.rewardItemId && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 text-center text-success fw-bold fs-4">
              ✨ Câu trả lời chính xác!
            </motion.div>
          )}

          {answeredState === 'wrong' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 text-center text-danger fw-bold fs-4">
              ❌ Sai rồi! {currentBranch === 'BOSS' ? 'Bạn có thể thử lại!' : 'Nơ-ron này đã bị khóa tạm thời.'}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default QuestionOverlay;
