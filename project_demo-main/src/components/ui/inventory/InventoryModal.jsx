import React, { useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { playGameSfx } from '../../audio/AmbientAudio';

const InventoryModal = ({ show, onHide }) => {
  const inventory = useGameStore((state) => state.inventory);
  const craftItem = useGameStore((state) => state.craftItem);
  
  const [slots, setSlots] = useState([null, null]);
  const [craftMessage, setCraftMessage] = useState('');
  const [isCrafting, setIsCrafting] = useState(false);
  const [craftedResult, setCraftedResult] = useState(null);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };

  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    if (isCrafting || craftedResult) return;
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      playGameSfx('navigate');
      const item = JSON.parse(data);
      setSlots((prev) => {
        const newSlots = [...prev];
        newSlots[slotIndex] = item;
        return newSlots;
      });
      setCraftMessage('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeSlot = (slotIndex) => {
    if (isCrafting || craftedResult) return;
    setSlots((prev) => {
      const newSlots = [...prev];
      newSlots[slotIndex] = null;
      return newSlots;
    });
    setCraftMessage('');
  };

  const handleCraft = () => {
    if (!slots[0] || !slots[1]) {
      playGameSfx('wrong');
      setCraftMessage('⚠️ Vui lòng đặt đủ 2 vật phẩm vào máy hợp nhất!');
      return;
    }
    if (slots[0] && slots[1]) {
      playGameSfx('craft');
      setIsCrafting(true);
      setCraftMessage('Đang vận hành Lò Hợp Nhất...');
      
      // Simulate crafting machine animation delay
      setTimeout(() => {
        const result = craftItem(slots[0].id, slots[1].id);
        setIsCrafting(false);
        if (result) {
          playGameSfx('unlock');
          setCraftedResult(result);
          setCraftMessage('✨ Hợp nhất thành công!');
        } else {
          playGameSfx('wrong');
          setCraftMessage('❌ Các mảnh ghép không tương thích!');
          setSlots([null, null]);
        }
      }, 2500); // 2.5s animation
    }
  };

  const resetCrafting = () => {
    setCraftedResult(null);
    setSlots([null, null]);
    setCraftMessage('');
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered dialogClassName="glass-modal">
      <Modal.Header closeButton className="border-0 pt-4 px-4 pb-0" closeVariant="white">
        <Modal.Title className="fw-bold gradient-text fs-3">LÒ RÈN VŨ TRỤ</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4 relative">
        <Row className="g-4">
          {/* Left Side: Inventory Grid */}
          <Col md={6} style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <h6 className="mb-3 text-uppercase text-info fw-bold" style={{ letterSpacing: '2px', fontSize: '12px' }}>
              Kho Tri Thức
            </h6>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
              gap: '15px',
              minHeight: '250px',
              maxHeight: '350px',
              overflowY: 'auto',
              paddingRight: '10px',
              alignContent: 'start'
            }}>
              <AnimatePresence>
                {inventory.map((item, idx) => (
                  <motion.div
                    key={`${item.id}-${idx}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className="item-slot text-center"
                    style={{ width: '80px', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div style={{ 
                      width: '70px', height: '70px', 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '16px',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <span style={{ fontSize: '32px', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }}>{item.icon}</span>
                    </div>
                    <small className="text-light mt-2 fw-bold" style={{ fontSize: '10px', textShadow: '0 0 5px #000' }}>
                      {item.name}
                    </small>
                  </motion.div>
                ))}
              </AnimatePresence>
              {inventory.length === 0 && (
                <div className="w-100 text-center py-5 col-span-full" style={{ gridColumn: '1 / -1' }}>
                  <p className="text-secondary mb-0" style={{ fontSize: '14px' }}>Kho tri thức trống rỗng.<br/>Hãy tiếp tục khám phá!</p>
                </div>
              )}
            </div>
          </Col>

          {/* Right Side: Crafting Table */}
          <Col md={6} className="d-flex flex-column align-items-center position-relative">
            <h6 className="mb-4 text-uppercase text-warning fw-bold w-100" style={{ letterSpacing: '2px', fontSize: '12px' }}>
              Máy Hợp Nhất Chìa Khóa
            </h6>
            
            <div className="d-flex justify-content-center align-items-center mb-5 gap-3 w-100 mt-2 position-relative" style={{ minHeight: '120px' }}>
              
              <AnimatePresence>
                {!craftedResult && (
                  <>
                    <motion.div 
                      animate={isCrafting ? { x: 50, rotate: 360, scale: 0.5, opacity: 0 } : { x: 0, rotate: 0, scale: 1, opacity: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    >
                      <Slot 
                        item={slots[0]} 
                        onDrop={(e) => handleDrop(e, 0)} 
                        onDragOver={handleDragOver}
                        onClick={() => removeSlot(0)}
                      />
                    </motion.div>

                    <motion.span 
                      animate={isCrafting ? { rotate: 1080, scale: 2, opacity: 0 } : { rotate: (slots[0] && slots[1]) ? 180 : 0, scale: 1, opacity: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      style={{ fontSize: '32px', color: isCrafting ? '#fbbf24' : 'rgba(255,255,255,0.2)', fontWeight: '300', zIndex: 2 }}
                    >
                      {isCrafting ? '⚡' : '+'}
                    </motion.span>

                    <motion.div 
                      animate={isCrafting ? { x: -50, rotate: -360, scale: 0.5, opacity: 0 } : { x: 0, rotate: 0, scale: 1, opacity: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    >
                      <Slot 
                        item={slots[1]} 
                        onDrop={(e) => handleDrop(e, 1)} 
                        onDragOver={handleDragOver}
                        onClick={() => removeSlot(1)}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Explosion and Final Item */}
              <AnimatePresence>
                {craftedResult && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: [1.5, 1], rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="position-absolute text-center"
                    style={{ zIndex: 10 }}
                  >
                    <motion.div
                      animate={{ boxShadow: ['0 0 20px #fbbf24', '0 0 60px #fbbf24', '0 0 20px #fbbf24'] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{
                        width: '100px', height: '100px',
                        background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(251,191,36,0) 70%)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        borderRadius: '50%',
                        border: '2px solid #fbbf24'
                      }}
                    >
                      <span style={{ fontSize: '64px', filter: 'drop-shadow(0 0 15px #fbbf24)' }}>{craftedResult.icon}</span>
                    </motion.div>
                    <h5 className="mt-3 text-warning fw-bold text-shadow">{craftedResult.name}</h5>
                    <Button variant="outline-warning" size="sm" className="mt-2 rounded-pill px-3" onClick={resetCrafting}>
                      Thu thập
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
            
            {!craftedResult && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-100 px-3">
                <Button 
                  disabled={isCrafting} 
                  onClick={handleCraft}
                  className={`craft-btn w-100 py-3 fw-bold text-uppercase ${isCrafting ? 'btn-warning' : 'btn-primary'}`}
                  style={{ borderRadius: '12px', letterSpacing: '2px', fontSize: '14px', transition: 'all 0.3s' }}
                >
                  {isCrafting ? 'Đang Hợp Nhất...' : 'Tiến Hành Hợp Nhất'}
                </Button>
              </motion.div>
            )}
            
            <div style={{ minHeight: '40px', marginTop: '20px' }}>
              <AnimatePresence>
                {craftMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-center fw-bold px-4 py-2 rounded-pill`}
                    style={{ 
                      fontSize: '14px',
                      backgroundColor: craftMessage.includes('thành công') ? 'rgba(16, 185, 129, 0.2)' : (craftMessage.includes('Đang') ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                      color: craftMessage.includes('thành công') ? '#34d399' : (craftMessage.includes('Đang') ? '#fbbf24' : '#f87171'),
                      border: `1px solid ${craftMessage.includes('thành công') ? 'rgba(52, 211, 153, 0.3)' : (craftMessage.includes('Đang') ? 'rgba(251, 191, 36, 0.3)' : 'rgba(248, 113, 113, 0.3)')}`
                    }}
                  >
                    {craftMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

const Slot = ({ item, onDrop, onDragOver, onClick }) => {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={onClick}
      className={`crafting-slot ${item ? 'filled' : ''}`}
      title={item ? "Nhấn để gỡ bỏ" : "Kéo vật phẩm vào đây"}
      style={{
        width: '90px', height: '90px',
        border: '2px dashed rgba(255,255,255,0.2)',
        borderRadius: '16px',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        cursor: item ? 'pointer' : 'default',
        backgroundColor: 'rgba(0,0,0,0.2)'
      }}
    >
      {item ? (
        <motion.div 
          initial={{ scale: 0, filter: 'blur(10px)' }} 
          animate={{ scale: 1, filter: 'blur(0px)' }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span style={{ fontSize: '48px', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.8))' }}>
            {item.icon}
          </span>
        </motion.div>
      ) : (
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>SLOT</span>
      )}
    </div>
  );
};

export default InventoryModal;
