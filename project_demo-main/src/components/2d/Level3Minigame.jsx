import React, { useState, useEffect, useRef } from 'react';
import './Level3Minigame.css';
import { useGameStore } from '../../store/useGameStore.js';
import { startEndingAudio } from './EndingSlideshow.jsx';
import { playGameSfx } from '../audio/AmbientAudio.jsx';

const Level3Minigame = () => {
    const { setViewState } = useGameStore();
    
    // Game Flags (must come first before useEffect)
    const [flags, setFlags] = useState({
        hasDagger: false,
        hasMatchbox: false,
        hasSyringe: false,
        hasFlask: false,
        
        crowReleased: false,
        crowBurned: false,
        ghostCut: false,
        rootCut: false,
        atticUnlocked: false,
        corruptedSoulSaved: false,

        // Alchemy Table
        beakerBile: 0,
        beakerTears: 0,
        beakerBlood: 0,
        beakerMoonlight: 0,
        burnerOn: false,
    });

    const [currentRoom, setCurrentRoom] = useState('wall_1');
    const [inventory, setInventory] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [flashMsg, setFlashMsg] = useState('');
    const [popup, setPopup] = useState(null); // 'family_tree', 'syllabus', null
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [introStep, setIntroStep] = useState(0);
    const [isPurifying, setIsPurifying] = useState(false);
    const [basementHintAvailable, setBasementHintAvailable] = useState(false);
    const [wall2HintAvailable, setWall2HintAvailable] = useState(false);
    const [wall3HintAvailable, setWall3HintAvailable] = useState(false);

    const introTexts = [
        "Ta là Kẻ Kế Thừa cuối cùng của dòng họ... Nơi đây từng là thánh địa Giả kim thuật của chúng ta.",
        "Những thí nghiệm cấm kỵ nhằm thấu hiểu chân lý đã tạo ra những quái thai... và những linh hồn không thể siêu thoát.",
        "Kẻ vắng mặt... Nếu ngươi nghe được những dòng này, xin hãy giải quyết những mâu thuẫn để kết thúc sự dằn vặt này..."
    ];

    const flashTimeout = useRef(null);
    const showFlash = (msg) => {
        setFlashMsg(msg);
        if (flashTimeout.current) clearTimeout(flashTimeout.current);
        flashTimeout.current = setTimeout(() => setFlashMsg(''), 3000);
    };

    // Dùng ref để tránh stale closure trong setInterval - luôn đọc giá trị mới nhất
    const roomTimeRef = useRef({ basement: 0, wall_2: 0, wall_3: 0 });
    const flagsRef = useRef(flags);
    const currentRoomRef = useRef(currentRoom);
    const hintRef = useRef({ basement: false, wall_2: false, wall_3: false });

    // Cập nhật ref mỗi khi state thay đổi
    useEffect(() => { flagsRef.current = flags; }, [flags]);
    useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);

    // Global 1-second interval: chỉ chạy 1 lần khi mount, đọc giá trị từ refs
    // Logic: cứ đếm 15s trong phòng là bật hint, không quan tâm puzzle đã giải chưa
    useEffect(() => {
        const interval = setInterval(() => {
            const acc = roomTimeRef.current;
            const room = currentRoomRef.current;
            const hints = hintRef.current;

            if (room === 'basement' && !hints.basement) {
                acc.basement++;
                if (acc.basement >= 15) {
                    hints.basement = true;
                    setBasementHintAvailable(true);
                }
            }
            if (room === 'wall_2' && !hints.wall_2) {
                acc.wall_2++;
                if (acc.wall_2 >= 15) {
                    hints.wall_2 = true;
                    setWall2HintAvailable(true);
                }
            }
            if (room === 'wall_3' && !hints.wall_3) {
                acc.wall_3++;
                if (acc.wall_3 >= 15) {
                    hints.wall_3 = true;
                    setWall3HintAvailable(true);
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []); // Chỉ mount 1 lần duy nhất - không stale closure nhờ refs

    // KHÔNG reset hint khi hoàn thành puzzle - hint vẫn sáng sau khi giải xong

    const addItem = (item) => {
        if (!inventory.some(i => i.id === item.id)) {
            setInventory(prev => [...prev, item]);
            playGameSfx('pickup');
            showFlash(`Đã lấy: ${item.name}`);
        }
    };

    const hasItem = (id) => inventory.some(i => i.id === id);

    const handleRoomChange = (dir) => {
        const loop = ['wall_1', 'wall_2', 'wall_3', 'wall_4'];
        if (loop.includes(currentRoom)) {
            let idx = loop.indexOf(currentRoom);
            if (dir === 'left') idx = (idx - 1 + 4) % 4;
            if (dir === 'right') idx = (idx + 1) % 4;
            playGameSfx('navigate');
            setCurrentRoom(loop[idx]);
        }
    };

    const handleInteract = (target) => {
        if (target === 'hatch_up') {
            if (flags.atticUnlocked) setCurrentRoom('attic');
            else {
                if (selectedItem === 'mist_conflict') {
                    showFlash("Sương mù xung đột đã làm tan chảy dây leo. Cửa lên Gác mái đã mở!");
                    setFlags(f => ({...f, atticUnlocked: true}));
                } else {
                    showFlash("Cửa sập bị quấn chặt bởi dây leo gai. Cần một chất ăn mòn mạnh.");
                }
            }
        }
        else if (target === 'hatch_down') {
            setCurrentRoom('basement');
        }
        else if (target === 'ladder_down') {
            setCurrentRoom(currentRoom === 'attic' ? 'wall_1' : 'wall_4');
        }
        else if (target === 'family_tree') {
            setPopup('family_tree');
        }
        else if (target === 'crow_woman') {
            if (!flags.crowReleased) {
                if (selectedItem === 'dagger') {
                    showFlash("Bạn dùng dao rạch bức tranh. Một con Quạ đen bay ra!");
                    setFlags(f => ({...f, crowReleased: true}));
                } else {
                    showFlash("Một bức chân dung kỳ dị. Người phụ nữ đầu Quạ. Bức tranh có vẻ phồng lên.");
                }
            } else {
                showFlash("Bức tranh đã bị rạch nát.");
            }
        }
        else if (target === 'crow') {
            if (selectedItem === 'matchbox') {
                if (hasItem('syringe')) {
                    showFlash("Con quạ thét lên trong ngọn lửa đỏ rực, khóc ra lệ cam rồi hóa thành tro bụi.");
                    setFlags(f => ({...f, crowBurned: true}));
                    playGameSfx('fire');
                    setTimeout(() => {
                        addItem({ id: 'tears_regret', name: 'Nước mắt Phủ định', icon: '/level3/items/tears.png' });
                    }, 1500);
                } else {
                    showFlash("Cần Ống tiêm để thu thập nước mắt. Nếu đốt bây giờ sẽ uổng phí.");
                }
            } else {
                showFlash("Con quạ chớp mắt nhìn bạn tĩnh lặng.");
            }
        }
        else if (target === 'ghost') {
            if (!flags.ghostCut) {
                if (selectedItem === 'dagger') {
                    showFlash("Bóng ma rên rỉ khi bạn dùng dao. Một chất lỏng đen ứa ra từ bụng.");
                    setFlags(f => ({...f, ghostCut: true}));
                } else {
                    showFlash("Bóng ma Kẻ Khởi Nguyên kẹt trong lồng. Bụng ông ta phình to.");
                }
            } else {
                if (hasItem('syringe')) {
                    addItem({ id: 'black_bile', name: 'Dịch Mật Bảo Thủ', icon: '/level3/items/bile.png' });
                } else {
                    showFlash("Cần Ống tiêm để hút Dịch mật.");
                }
            }
        }
        else if (target === 'tree_mutant') {
            if (!flags.rootCut) {
                if (selectedItem === 'dagger') {
                    showFlash("Rễ cây rỉ ra một loại máu sền sệt đỏ thẫm.");
                    setFlags(f => ({...f, rootCut: true}));
                } else {
                    showFlash("Dị nhân nửa người nửa cây. Rễ đâm sâu vào bồn tắm máu.");
                }
            } else {
                if (hasItem('syringe')) {
                    addItem({ id: 'blood_root', name: 'Máu của Rễ', icon: '/level3/items/blood.png' });
                } else {
                    showFlash("Cần Ống tiêm để thu thập Máu rễ.");
                }
            }
        }
        else if (target === 'window_attic') {
            if (selectedItem === 'flask') {
                showFlash("Bạn đặt bình rỗng dưới ánh trăng rằm...");
                addItem({ id: 'moonlight', name: 'Ánh trăng chưng cất', icon: '/level3/items/moonlight.png' });
            } else {
                showFlash("Một vầng trăng tròn kỳ dị ngoài cửa sổ.");
            }
        }
        else if (target === 'skull') {
            if (selectedItem === 'serum_truth' && !isPurifying) {
                showFlash("Huyết thanh kích hoạt. Hộp sọ phát sáng, bóng đen rùng mình.");
                playGameSfx('purify');
                startEndingAudio();
                setIsPurifying(true);
                setFlags(f => ({...f, corruptedSoulSaved: true}));
                setTimeout(() => {
                    showFlash("Bóng đen tan biến. Chân lý Tuyệt đối đã được phơi bày!");
                }, 1200);
                setTimeout(() => setViewState('ENDING'), 3000);
            } else {
                showFlash("Bóng đen ôm chặt chiếc hộp sọ. Nó cần kí ức để siêu thoát.");
            }
        }
        else if (target === 'alchemy_table') {
            setCurrentRoom('alchemy_zoom');
        }
        else if (target === 'alchemy_add_liquid') {
            if (['black_bile', 'tears_regret', 'blood_root', 'moonlight'].includes(selectedItem)) {
                if (selectedItem === 'black_bile') setFlags(f => ({...f, beakerBile: f.beakerBile + 1}));
                if (selectedItem === 'tears_regret') setFlags(f => ({...f, beakerTears: f.beakerTears + 1}));
                if (selectedItem === 'blood_root') setFlags(f => ({...f, beakerBlood: f.beakerBlood + 1}));
                if (selectedItem === 'moonlight') setFlags(f => ({...f, beakerMoonlight: f.beakerMoonlight + 1}));
                showFlash("Đã nhỏ 1 giọt vào bình.");
                playGameSfx('liquid');
            } else {
                showFlash("Cần chọn một bình chứa dung dịch.");
            }
        }
        else if (target === 'alchemy_light_burner') {
            if (selectedItem === 'matchbox') {
                setFlags(f => ({...f, burnerOn: true}));
                playGameSfx('fire');
                showFlash("Đã châm lửa bếp cồn.");
            } else {
                showFlash("Cần Bao diêm để châm lửa.");
            }
        }
        else if (target === 'alchemy_brew') {
            if (selectedItem === 'flask' && flags.burnerOn) {
                // Check Recipe 1: 1 Bile + 1 Tears
                if (flags.beakerBile === 1 && flags.beakerTears === 1 && flags.beakerBlood === 0 && flags.beakerMoonlight === 0) {
                    showFlash("Phản ứng xảy ra! Thu được Sương mù xung đột.");
                    playGameSfx('craft');
                    addItem({ id: 'mist_conflict', name: 'Sương mù Xung đột', icon: '/level3/items/mist.png' });
                    setFlags(f => ({...f, beakerBile: 0, beakerTears: 0, burnerOn: false}));
                }
                // Check Recipe 2: 2 Tears + 1 Blood
                else if (flags.beakerBile === 0 && flags.beakerTears === 2 && flags.beakerBlood === 1 && flags.beakerMoonlight === 0) {
                    showFlash("Phản ứng xảy ra! Thu được Huyết thanh Trí nhớ.");
                    playGameSfx('craft');
                    addItem({ id: 'serum_truth', name: 'Huyết thanh Trí nhớ', icon: '/level3/items/serum.png' });
                    setFlags(f => ({...f, beakerTears: 0, beakerBlood: 0, burnerOn: false}));
                } else {
                    showFlash("Dung dịch bay hơi vô ích. Sai công thức.");
                    playGameSfx('wrong');
                    setFlags(f => ({...f, beakerBile: 0, beakerTears: 0, beakerBlood: 0, beakerMoonlight: 0, burnerOn: false}));
                }
            } else if (!flags.burnerOn) {
                showFlash("Cần phải châm lửa bếp cồn trước khi chưng cất.");
            } else {
                showFlash("Cần chọn một Bình rỗng (Flask) để thu thập kết quả.");
            }
        }
        else if (target === 'syllabus') {
            setPopup('syllabus');
        }
        else if (target === 'drawer' || target === 'papers') {
            setPopup('cryptic_letter');
        }
        else if (target === 'book_clue') {
            setPopup('book_clue');
        }
        
        // Pickups
        else if (target === 'pickup_dagger') { addItem({ id: 'dagger', name: 'Dao găm', icon: '/level3/items/dagger.png' }); setFlags(f => ({...f, hasDagger: true})); }
        else if (target === 'pickup_matchbox') { addItem({ id: 'matchbox', name: 'Bao diêm', icon: '/level3/items/matchbox.png' }); setFlags(f => ({...f, hasMatchbox: true})); }
        else if (target === 'pickup_syringe') { addItem({ id: 'syringe', name: 'Ống tiêm', icon: '/level3/items/syringe.png' }); setFlags(f => ({...f, hasSyringe: true})); }
        else if (target === 'pickup_flask') { addItem({ id: 'flask', name: 'Bình rỗng', icon: '/level3/items/flask.png' }); setFlags(f => ({...f, hasFlask: true})); }
        
        setSelectedItem(null); // Clear selection after use
    };

    return (
        <div className={isPurifying ? 'l3-ending-fade' : ''} style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto' }}>
            <div className="level3-wrapper">
                
                {/* Main View Area */}
                <div className={`l3-room-container l3-room-${currentRoom}`}>
                    
                    {/* Navigation Arrows */}
                    {['wall_1', 'wall_2', 'wall_3', 'wall_4'].includes(currentRoom) && (
                        <>
                            <div className="l3-nav-arrow l3-nav-left" onClick={() => handleRoomChange('left')}>◀</div>
                            <div className="l3-nav-arrow l3-nav-right" onClick={() => handleRoomChange('right')}>▶</div>
                        </>
                    )}

                    {/* Flash Message */}
                    <div className="l3-flash-msg" style={{ opacity: flashMsg ? 1 : 0 }}>{flashMsg}</div>

                    {/* ROOM CONTENTS */}
                    {currentRoom === 'wall_1' && (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <div className="l3-interactable l3-family-tree has-hint" style={{ left: 250, top: 100 }} onClick={() => handleInteract('family_tree')}>
                            </div>
                            <div className="l3-nav-arrow l3-nav-up" onClick={() => handleInteract('hatch_up')}>▲</div>
                            <div className="l3-interactable has-hint" style={{ position: 'absolute', left: 80, top: 350, width: 200, height: 100, cursor: 'pointer' }} onClick={() => handleInteract('book_clue')}>
                            </div>
                        </div>
                    )}

                    {currentRoom === 'wall_2' && (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <button onClick={() => showFlash('Xé rách bức màn đốt bí ẩn')} style={{ position: 'absolute', top: 20, left: 20, width: 60, height: 30, background: 'linear-gradient(135deg, #4a4a4a, #2a2a2a)', border: '2px solid #666', color: '#888', fontSize: '12px', fontWeight: 'bold', cursor: wall2HintAvailable ? 'pointer' : 'not-allowed', opacity: wall2HintAvailable ? 1 : 0.3, boxShadow: wall2HintAvailable ? '0 0 15px #ffcc00' : 'none', transition: 'all 0.3s ease', borderRadius: '4px' }} disabled={!wall2HintAvailable}>
                                Gợi Ý
                            </button>
                            <div className="l3-interactable l3-crow-woman has-hint" style={{ left: 325, top: 100 }} onClick={() => handleInteract('crow_woman')}>
                                {/* Nền bức tranh */}
                            </div>
                            {flags.crowReleased && (
                                <div className={`l3-interactable ${flags.crowBurned ? 'l3-burn-effect' : ''}`} style={{ position: 'absolute', left: 20, top: 150, width: 350, height: 350, pointerEvents: flags.crowBurned ? 'none' : 'auto' }} onClick={() => handleInteract('crow')}>
                                    <img src="/level3/orthes/quar.png" alt="Crow" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', filter: flags.crowBurned ? 'none' : 'drop-shadow(0 5px 10px rgba(0,0,0,0.8))' }} />
                                </div>
                            )}
                            {!flags.hasMatchbox && (
                                <div className="l3-interactable" style={{ position: 'absolute', left: 310, top: 390, width: 45, height: 45 }} onClick={() => handleInteract('pickup_matchbox')}>
                                    <img src="/level3/items/matchbox.png" alt="Matchbox" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))' }} />
                                </div>
                            )}
                            <div className="l3-interactable" style={{ position: 'absolute', left: 520, top: 340, width: 140, height: 140 }} onClick={() => handleInteract('syllabus')}>
                                <img src="/level3/orthes/book.png" alt="Syllabus Book" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.8)) sepia(0.5)' }} />
                            </div>
                        </div>
                    )}

                    {currentRoom === 'wall_3' && (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <button onClick={() => showFlash('Cái Cây muốn được đục lỗ bằng vật nhọn')} style={{ position: 'absolute', top: 20, left: 20, width: 60, height: 30, background: 'linear-gradient(135deg, #4a4a4a, #2a2a2a)', border: '2px solid #666', color: '#888', fontSize: '12px', fontWeight: 'bold', cursor: wall3HintAvailable ? 'pointer' : 'not-allowed', opacity: wall3HintAvailable ? 1 : 0.3, boxShadow: wall3HintAvailable ? '0 0 15px #ffcc00' : 'none', transition: 'all 0.3s ease', borderRadius: '4px' }} disabled={!wall3HintAvailable}>
                                Gợi Ý
                            </button>
                            <div className="l3-interactable l3-tree-mutant has-hint" style={{ left: 300, top: 150 }} onClick={() => handleInteract('tree_mutant')}>
                            </div>
                            {!flags.hasSyringe && (
                                <div className="l3-interactable" style={{ position: 'absolute', left: 550, top: 200, width: 80, height: 80 }} onClick={() => handleInteract('pickup_syringe')}>
                                    <img src="/level3/items/syringe.png" alt="Syringe" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))' }} />
                                </div>
                            )}
                        </div>
                    )}

                    {currentRoom === 'wall_4' && (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <div className="l3-interactable l3-alchemy-table has-hint" style={{ left: 255, top: 250 }} onClick={() => handleInteract('alchemy_table')}></div>
                            <div className="l3-interactable has-hint" style={{ position: 'absolute', left: 400, top: 280, width: 120, height: 80, cursor: 'pointer' }} onClick={() => handleInteract('papers')}>
                                {/* Mảnh giấy trên bàn (Papers) */}
                            </div>
                            
                            {!flags.hasDagger && (
                                <div className="l3-interactable" style={{ position: 'absolute', left: 190, top: 260, width: 60, height: 60, transform: 'rotate(-20deg)' }} onClick={() => handleInteract('pickup_dagger')}>
                                    <img src="/level3/items/dagger.png" alt="Dagger" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))' }} />
                                </div>
                            )}

                            <div className="l3-interactable has-hint" style={{ position: 'absolute', bottom: 20, left: 200, width: 100, height: 60 }} onClick={() => handleInteract('hatch_down')}>
                            </div>
                        </div>
                    )}

                    {currentRoom === 'basement' && (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <div className="l3-nav-arrow l3-nav-up" onClick={() => handleInteract('ladder_down')}>▲</div>
                            <button onClick={() => showFlash('Con Dao và con Ma tìm thấy nhau')} style={{ position: 'absolute', top: 20, left: 20, width: 60, height: 30, background: 'linear-gradient(135deg, #4a4a4a, #2a2a2a)', border: '2px solid #666', color: '#888', fontSize: '12px', fontWeight: 'bold', cursor: basementHintAvailable ? 'pointer' : 'not-allowed', opacity: basementHintAvailable ? 1 : 0.3, boxShadow: basementHintAvailable ? '0 0 15px #ffcc00' : 'none', transition: 'all 0.3s ease', borderRadius: '4px' }} disabled={!basementHintAvailable}>
                                Gợi Ý
                            </button>
                            <div className="l3-interactable l3-ghost" style={{ left: 350, top: 300, position: 'absolute', width: 150, height: 150 }} onClick={() => handleInteract('ghost')}>
                                <img src="/level3/orthes/ghosh.png" alt="Ghost" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'opacity(0.8) drop-shadow(0 0 20px #fff)' }} />
                            </div>
                            {!flags.hasFlask && (
                                <div className="l3-interactable" style={{ position: 'absolute', left: 620, top: 350, width: 80, height: 80 }} onClick={() => handleInteract('pickup_flask')}>
                                    <img src="/level3/items/flask.png" alt="Flask" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }} />
                                </div>
                            )}
                        </div>
                    )}

                    {currentRoom === 'attic' && (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <div className="l3-nav-arrow l3-nav-down" onClick={() => handleInteract('ladder_down')}>▼</div>
                            <div className="l3-interactable l3-corrupted-soul" style={{ left: 340, top: 150, position: 'absolute', width: 120, height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleInteract('skull')}>
                                <img src="/level3/orthes/head.png" alt="Corrupted Soul" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'drop-shadow(0 0 15px #ff0000)' }} />
                            </div>
                            <div className="l3-interactable has-hint" style={{ position: 'absolute', left: 100, top: 100, width: 100, height: 150, border: '4px solid rgba(255,255,255,0.1)' }} onClick={() => handleInteract('window_attic')}>
                                {/* Cửa sổ */}
                            </div>
                        </div>
                    )}

                    {/* ALCHEMY ZOOM ROOM */}
                    {currentRoom === 'alchemy_zoom' && (
                        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#4e4135', display: 'flex', justifyContent: 'center' }}>
                            <img src="/level3/alchemy.png" alt="Alchemy Set" style={{ width: 500, height: 'auto', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'brightness(2) drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} />
                            
                            {/* Beaker (Nhỏ dung dịch vào phễu phải) */}
                            <div className="l3-interactable" style={{ position: 'absolute', left: 490, top: 120, width: 80, height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleInteract('alchemy_add_liquid')} title="Đổ dung dịch vào phễu này">
                                <div className="l3-liquid-hint-dot" title="Nơi nhỏ dung dịch" />
                            </div>
                            
                            {/* Burner (Bếp cồn dưới bình chính) */}
                            <div className="l3-interactable has-hint" style={{ position: 'absolute', left: 360, top: 380, width: 80, height: 80 }} onClick={() => handleInteract('alchemy_light_burner')} title="Châm lửa bếp cồn"></div>
                            
                            {flags.burnerOn && <div style={{ position: 'absolute', left: 375, top: 345, fontSize: 50, filter: 'drop-shadow(0 0 20px #ff6600)', pointerEvents: 'none' }}>🔥</div>}
                            
                            {/* Flask (Bình thu thập thành phẩm bên trái) */}
                            <div className="l3-interactable has-hint" style={{ position: 'absolute', left: 240, top: 200, width: 120, height: 180 }} onClick={() => handleInteract('alchemy_brew')} title="Bắt đầu chưng cất (Đưa bình rỗng vào)"></div>

                            {/* HUD Trạng thái bình chứa - Ống nghiệm hiển thị bằng vạch màu */}
                            <div className="l3-alchemy-tube-container" style={{ position: 'absolute', left: 30, top: 50, fontFamily: 'Times New Roman, serif', background: 'rgba(20,15,10,0.85)', padding: '20px 25px', borderRadius: '12px', border: '2px solid #8b7355', boxShadow: '0 0 20px rgba(0,0,0,0.9)', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <h3 style={{ margin: '0 0 15px 0', fontSize: 22, color: '#eaddd0', textShadow: '1px 1px 3px #000', borderBottom: '1px solid #8b7355', paddingBottom: '10px' }}>Hỗn Hợp</h3>
                                
                                {/* Ống nghiệm */}
                                <div style={{ width: 45, height: 220, background: 'rgba(255,255,255,0.05)', border: '3px solid #6b5335', borderRadius: '0 0 25px 25px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)' }}>
                                    {Array.from({ length: flags.beakerBile }).map((_, i) => <div key={`bile-${i}`} style={{ height: '33.33%', background: 'linear-gradient(to right, #111, #333, #111)', borderTop: '2px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 5px #000', pointerEvents: 'auto' }} title="Dịch Mật (Đen)" />)}
                                    {Array.from({ length: flags.beakerTears }).map((_, i) => <div key={`tears-${i}`} style={{ height: '33.33%', background: 'linear-gradient(to right, #2196f3, #64b5f6, #2196f3)', borderTop: '2px solid rgba(255,255,255,0.3)', boxShadow: 'inset 0 0 5px #1976d2', pointerEvents: 'auto' }} title="Nước Mắt (Xanh)" />)}
                                    {Array.from({ length: flags.beakerBlood }).map((_, i) => <div key={`blood-${i}`} style={{ height: '33.33%', background: 'linear-gradient(to right, #d32f2f, #ef5350, #d32f2f)', borderTop: '2px solid rgba(255,255,255,0.3)', boxShadow: 'inset 0 0 5px #c62828', pointerEvents: 'auto' }} title="Máu Rễ (Đỏ)" />)}
                                    {Array.from({ length: flags.beakerMoonlight }).map((_, i) => <div key={`moon-${i}`} style={{ height: '33.33%', background: 'linear-gradient(to right, #fbc02d, #fff59d, #fbc02d)', borderTop: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 0 15px #fff9c4', pointerEvents: 'auto' }} title="Ánh Trăng (Vàng)" />)}
                                    
                                    {/* Vạch chia độ */}
                                    <div style={{ position: 'absolute', width: '100%', height: '33.33%', bottom: '33.33%', borderBottom: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none' }}></div>
                                    <div style={{ position: 'absolute', width: '100%', height: '33.33%', bottom: '66.66%', borderBottom: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none' }}></div>
                                </div>
                                
                                <div style={{ marginTop: 15, fontSize: 16, color: flags.burnerOn ? '#ff9800' : '#888', fontStyle: 'italic', textShadow: flags.burnerOn ? '0 0 5px #ff9800' : 'none' }}>
                                    {flags.burnerOn ? 'Đang đun sôi...' : 'Đang nguội lạnh'}
                                </div>
                            </div>

                            {/* Nút thoát */}
                            <div className="l3-nav-arrow l3-nav-down" onClick={() => setCurrentRoom('wall_4')}>▼</div>
                        </div>
                    )}

                </div>

                {/* Backpack Toggle Button */}
                <div 
                    onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                    style={{ position: 'absolute', right: isInventoryOpen ? 140 : 20, bottom: 20, width: 60, height: 60, background: '#2c221a', border: '3px solid #5a4b3c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 600, boxShadow: '0 0 10px #000', transition: 'right 0.3s ease' }}
                    title="Mở túi đồ"
                >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#dcd3c6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                </div>

                {/* Inventory Sidebar */}
                {isInventoryOpen && (
                    <div className="l3-inventory-sidebar" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, background: 'rgba(13, 15, 18, 0.95)' }}>
                        <div style={{ color: '#dcd3c6', textAlign: 'center', padding: '10px 0', borderBottom: '1px solid #5a4b3c', marginBottom: 10 }}>HÀNH TRANG</div>
                        {inventory.map((item, i) => (
                            <div 
                                key={i} 
                                className={`l3-inv-slot ${selectedItem === item.id ? 'selected' : ''}`}
                                onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                                title={item.name}
                            >
                                <img src={item.icon} alt={item.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Popups */}
                {popup === 'family_tree' && (
                    <div className="l3-popup-overlay" onClick={() => setPopup(null)}>
                        <div className="l3-popup-content" style={{ backgroundImage: 'url(/level3/items/Pngtree.png)', backgroundSize: '115%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} onClick={e => e.stopPropagation()}>
                            <button className="l3-close-btn" onClick={() => setPopup(null)}>×</button>
                            <h2 style={{ paddingBottom: 10, textAlign: 'center', fontSize: 20 }}>Cây Phả Hệ Biện Chứng</h2>
                            <ul style={{ lineHeight: 1.6, fontSize: 14, padding: '0 40px 10px 60px' }}>
                                <li><strong>Thế hệ 1 (Khẳng định):</strong> Kẻ Khởi Nguyên - Chôn giấu bí mật trong bụng (Dịch Mật Bảo Thủ).</li>
                                <li><strong>Thế hệ 2 (Phủ định):</strong> Người phụ nữ đầu Quạ - Phá vỡ lồng kính, nhưng trả giá bằng những Lệ sầu (Nước mắt Phủ định).</li>
                                <li><strong>Thế hệ 3 (Phủ định của Phủ định):</strong> Kẻ Kế Thừa - Mang mầm mống của cái cũ nhưng đâm chồi mới (Máu rễ cây).</li>
                                <li><strong>Thế hệ 4 (Bước Nhảy vọt):</strong> Linh hồn Lang Thang - Mắc kẹt giữa sự sống và cái chết cho đến khi dung hợp được mọi mâu thuẫn.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {popup === 'syllabus' && (
                    <div className="l3-popup-overlay" onClick={() => setPopup(null)}>
                        <div className="l3-popup-content" style={{ backgroundImage: 'url(/level3/items/Pngtree.png)', backgroundSize: '115%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} onClick={e => e.stopPropagation()}>
                            <button className="l3-close-btn" onClick={() => setPopup(null)}>×</button>
                            <h2 style={{ paddingBottom: 10, textAlign: 'center', fontSize: 20 }}>Giáo trình Giả kim thuật (Syllabus)</h2>
                            <div style={{ fontSize: 14, fontFamily: 'monospace', lineHeight: 1.5, padding: '0 50px 10px 50px' }}>
                                <p><strong>Quy luật Mâu thuẫn & Lượng đổi Chất đổi:</strong></p>
                                <p>Mọi sự vật đều chứa đựng những mặt đối lập. Hãy trộn lẫn chúng trong chiếc bình thử nghiệm.</p>
                                <p>Sự tích lũy từ từ về lượng (số giọt) khi được kích thích bởi Ngọn Lửa, sẽ dẫn đến một Bước Nhảy Vọt về chất (tạo ra vật phẩm mới).</p>
                                <p><em>*Trang sách bị rách phần công thức... Phải tự mình thử nghiệm, hoặc tìm manh mối ở nơi khác.*</em></p>
                            </div>
                        </div>
                    </div>
                )}

                {popup === 'cryptic_letter' && (
                    <div className="l3-popup-overlay" onClick={() => setPopup(null)}>
                        <div className="l3-popup-content" style={{ backgroundImage: 'url(/level3/items/Pngtree.png)', backgroundSize: '115%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', color: '#3e2723', width: '500px' }} onClick={e => e.stopPropagation()}>
                            <button className="l3-close-btn" style={{ color: '#3e2723' }} onClick={() => setPopup(null)}>×</button>
                            <h2 style={{ paddingBottom: 10, fontFamily: 'cursive', textAlign: 'center', fontSize: 20 }}>Mảnh giấy vương vãi trên bàn</h2>
                            <div style={{ fontSize: 15, fontFamily: 'cursive', lineHeight: 1.6, fontStyle: 'italic', padding: '0 50px 10px 50px' }}>
                                <p>"Cái cũ kỹ bảo thủ và sự phủ định đầy bi phẫn... Khi hai thế hệ đầu tiên đối mặt nhau trong sức nóng rực rỡ, chúng sẽ hóa thành <strong style={{ color: '#000' }}>Làn sương mù</strong> đủ sức ăn mòn mọi rào cản gai góc."</p>
                            </div>
                        </div>
                    </div>
                )}

                {popup === 'book_clue' && (
                    <div className="l3-popup-overlay" onClick={() => setPopup(null)}>
                        <div className="l3-popup-content" style={{ backgroundImage: 'url(/level3/items/Pngtree.png)', backgroundSize: '133%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', color: '#111', width: '500px' }} onClick={e => e.stopPropagation()}>
                            <button className="l3-close-btn" style={{ color: '#111' }} onClick={() => setPopup(null)}>×</button>
                            <h2 style={{ paddingBottom: 10, textAlign: 'center', fontSize: 20 }}>Nhật ký của Kẻ Kế Thừa</h2>
                            <div style={{ fontSize: 15, fontFamily: 'Times New Roman, serif', lineHeight: 1.6, padding: '0 50px 10px 50px' }}>
                                <p>"Linh hồn yếu ớt trên căn gác mái luôn khát khao sự cứu rỗi... Nó chẳng thể tự mình siêu thoát."</p>
                                <p>"Kẻ vất vưởng mang hình hài bóng ma sẽ mãi ôm chiếc hộp sọ... Trừ khi hắn được gột rửa bởi <strong style={{ color: '#333' }}>hai lần Nỗi Đau (Lệ)</strong> và <strong style={{ color: '#8b0000' }}>một giọt Huyết Quản (Máu rễ)</strong> của chính thế hệ mầm non, nung nấu dưới sức nóng của ngọn lửa sinh mệnh."</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Story Intro Overlay */}
                {introStep < introTexts.length && (
                    <div 
                        onClick={() => setIntroStep(i => i + 1)}
                        style={{ position: 'absolute', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 40, cursor: 'pointer' }}
                    >
                        <div style={{ background: 'rgba(20, 15, 10, 0.95)', border: '2px solid #5a4b3c', borderRadius: 8, margin: '0 40px', padding: '20px 40px', boxShadow: '0 0 20px rgba(0,0,0,0.9)' }}>
                            <div style={{ color: '#dcd3c6', fontSize: 22, textAlign: 'center', lineHeight: 1.8, fontFamily: 'Times New Roman, serif', fontStyle: 'italic', animation: 'fadeIn 1.5s' }}>
                                "{introTexts[introStep]}"
                            </div>
                            <div style={{ fontSize: 14, color: '#888', marginTop: 15, textAlign: 'center', animation: 'pulse 2s infinite' }}>[ Click để tiếp tục ]</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Level3Minigame;
