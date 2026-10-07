import React, { useEffect, useRef, useState } from 'react';
import './Level2Minigame.css';
import { useGameStore } from '../../store/useGameStore.js';
import { playGameSfx } from '../audio/AmbientAudio.jsx';

const dialoguesHegel = [
    "[1] Sự phát triển luôn bắt đầu từ việc tích lũy dần dần về Lượng.",
    "[8] Hãy chú ý đến giới hạn (Độ). Chỉ khi vượt qua Điểm nút, sự vật mới tạo ra bước nhảy về Chất.",
    "[3] Nhưng thế vẫn chưa đủ. Các mặt đối lập không tồn tại cô lập.",
    "[1] Chúng vừa thống nhất vừa đấu tranh với nhau. Đó mới là nguồn gốc thực sự của sự vận động."
];

const CONFIG = { speed: 4, interactDist: 70 };

const Level2Minigame = () => {
    const wrapperRef = useRef(null);
    const playerRef = useRef(null);
    const spriteRef = useRef(null);
    const promptRef = useRef(null);
    const flashRef = useRef(null);
    
    const requestRef = useRef();
    const keys = useRef({});
    let flashTimeout = useRef(null);

    const { setViewState, setRewardPopup } = useGameStore();

    // React State for UI
    const [gameState, setGameState] = useState('PLAYING'); // PLAYING, DIALOG, INVENTORY, GAMEOVER, QUIZ, SAFE_CODE
    const [dialogIndex, setDialogIndex] = useState(0);
    const [inventory, setInventory] = useState([]);
    const [previewItemIndex, setPreviewItemIndex] = useState(-1);
    const [quizSelectedIndex, setQuizSelectedIndex] = useState(0);
    const [safeCodeInput, setSafeCodeInput] = useState('');
    const [hintVisible, setHintVisible] = useState(true);

    // Engine State (Refs for speed)
    const stateRef = useRef({
        player: { x: 400, y: 450 },
        flags: { 
            energyCollected: 0,
            energyInMachine: 0,
            machineJumped: false,
            hasDarkOrb: false,
            fusionDone: false,
            doorUnlocked: false,
            win: false,
            safeUnlocked: false,
            rockMoved: false,
            hegelQuizDone: false
        },
        interactables: [
            { id: 'hegel', x: 400, y: 250, w: 40, h: 60, type: 'npc' },
            { id: 'machine', x: 150, y: 400, w: 80, h: 100, type: 'machine' },
            { id: 'safe', x: 100, y: 150, w: 40, h: 50, type: 'safe' },
            { id: 'rock', x: 650, y: 100, w: 60, h: 40, type: 'rock' },
            { id: 'energy-1', x: 160, y: 150, w: 30, h: 30, type: 'energy' }, // Bắn ra xa két sắt
            { id: 'energy-2', x: 570, y: 100, w: 30, h: 30, type: 'energy' }, // Bắn ra xa tảng đá
            { id: 'energy-3', x: 700, y: 500, w: 30, h: 30, type: 'energy' },
            { id: 'orb-black', x: 100, y: 500, w: 30, h: 30, type: 'dark_orb' },
            { id: 'fusion', x: 650, y: 300, w: 50, h: 50, type: 'fusion' },
            { id: 'door', x: 400, y: 30, w: 140, h: 60, type: 'door' }
        ]
    });

    const showFlash = (txt) => {
        if (flashRef.current) {
            flashRef.current.textContent = txt;
            flashRef.current.style.opacity = '1';
            if (flashTimeout.current) clearTimeout(flashTimeout.current);
            flashTimeout.current = setTimeout(() => {
                if (flashRef.current) flashRef.current.style.opacity = '0';
            }, 3000);
        }
    };

    const dist = (x1, y1, x2, y2) => Math.sqrt((x1-x2)**2 + (y1-y2)**2);

    const isColliding = (nX, nY) => {
        if (nX < 20 || nX > 780 || nY < 60 || nY > 580) return true;
        for (let obj of stateRef.current.interactables) {
            if (['npc', 'machine', 'fusion', 'safe', 'rock'].includes(obj.type)) {
                const left = obj.x - obj.w/2 - 15;
                const right = obj.x + obj.w/2 + 15;
                const top = obj.y - obj.h/2 - 15;
                const bottom = obj.y + obj.h/2 + 15;
                if (nX > left && nX < right && nY > top && nY < bottom) return true;
            }
        }
        return false;
    };

    const finishGame = () => {
        setGameState('GAMEOVER');
        stateRef.current.flags.win = true;
    };

    const handleExit = () => {
        playGameSfx('correct');
        setRewardPopup({ id: 'badge2', name: 'Huy hiệu Biện Chứng', icon: '🌟', targetViewState: 'HUB' });
        setViewState('HUB');
    };

    const invRef = useRef([]);
    const previewInvRef = useRef(-1);
    const gameStateRef = useRef('PLAYING');
    const quizRef = useRef(0);

    useEffect(() => { invRef.current = inventory; }, [inventory]);
    useEffect(() => { previewInvRef.current = previewItemIndex; }, [previewItemIndex]);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { quizRef.current = quizSelectedIndex; }, [quizSelectedIndex]);

    const handleInteractCore = () => {
        playGameSfx('click');
        const p = stateRef.current.player;
        const state = stateRef.current;
        let interacted = false;

        for (let obj of state.interactables) {
            if (interacted) return;
            let checkDist = obj.type === 'door' ? 80 : CONFIG.interactDist;
            const d = dist(p.x, p.y, obj.x, obj.y);

            if (d < checkDist) {
                interacted = true;
                if (obj.type === 'npc') {
                    if (!state.flags.hegelQuizDone) {
                        setGameState('QUIZ'); setQuizSelectedIndex(0);
                    } else {
                        setGameState('DIALOG'); setDialogIndex(0);
                    }
                }
                else if (obj.type === 'rock') {
                    if (!state.flags.rockMoved) {
                        state.flags.rockMoved = true;
                        document.getElementById('l2-rock').classList.add('moved');
                        document.getElementById('l2-energy-2').style.display = 'block';
                        showFlash("Bạn dùng sức đẩy tảng đá sang một bên, lộ ra một khối năng lượng!");
                    } else {
                        showFlash("Tảng đá đã được đẩy đi.");
                    }
                }
                else if (obj.type === 'safe') {
                    if (state.flags.safeUnlocked) {
                        showFlash("Két sắt đã mở.");
                    } else {
                        setGameState('SAFE_CODE');
                        setSafeCodeInput('');
                    }
                }
                else if (obj.type === 'energy') {
                    const el = document.getElementById(`l2-${obj.id}`);
                    if (el && el.style.display !== 'none') {
                        el.style.display = 'none';
                        setInventory(prev => [...prev, { id: 'energy_block', name: 'Khối năng lượng', icon: '🔋', type: 'equip', desc: 'Sự tích lũy về lượng.' }]);
                        playGameSfx('pickup');
                        showFlash("ĐÃ NHẶT: KHỐI NĂNG LƯỢNG");
                    }
                }
                else if (obj.type === 'dark_orb') {
                    const el = document.getElementById('l2-orb-black-pickup');
                    if (el && el.style.display !== 'none' && !state.flags.hasDarkOrb) {
                        state.flags.hasDarkOrb = true;
                        el.style.display = 'none';
                        setInventory(prev => [...prev, { id: 'orb_black', name: 'Quả cầu Bóng tối', icon: '🔮', type: 'equip', desc: 'Mặt đối lập của ánh sáng.' }]);
                        playGameSfx('pickup');
                        showFlash("ĐÃ NHẶT: QUẢ CẦU BÓNG TỐI");
                    }
                }
                else if (obj.type === 'machine') {
                    if (state.flags.machineJumped) {
                        showFlash("Cỗ máy đã hoàn tất bước nhảy về Chất.");
                        return;
                    }
                    const energyIndex = invRef.current.findIndex(i => i.id === 'energy_block');
                    if (energyIndex !== -1) {
                        state.flags.energyInMachine++;
                        const newInv = [...invRef.current];
                        newInv.splice(energyIndex, 1);
                        setInventory(newInv);
                        
                        const pct = Math.floor((state.flags.energyInMachine / 3) * 100);
                        document.getElementById('l2-machine-screen').textContent = `${pct}%`;
                        document.getElementById('l2-machine-bar').style.width = `${pct}%`;

                        if (state.flags.energyInMachine < 3) {
                            showFlash(`Đang trong giới hạn Độ (${pct}%). Chưa có sự thay đổi về Chất.`);
                        } else {
                            state.flags.machineJumped = true;
                            playGameSfx('craft');
                            showFlash("Đạt ĐIỂM NÚT! Bước nhảy xảy ra!");
                            document.getElementById('l2-machine-screen').textContent = "MAX";
                            document.getElementById('l2-machine-screen').style.color = "#fff";
                            document.getElementById('l2-machine-screen').style.background = "#00f2fe";
                            
                            setTimeout(() => {
                                setInventory(prev => [...prev, { id: 'orb_white', name: 'Quả cầu Ánh sáng', icon: '✨', type: 'equip', desc: 'Sinh ra từ bước nhảy về Chất.' }]);
                                document.getElementById('l2-orb-black-pickup').style.display = 'block';
                                showFlash("Cỗ máy sinh ra CẦU ÁNH SÁNG! Bóng tối cũng xuất hiện...");
                            }, 3000);
                        }
                    } else {
                        showFlash("Cỗ máy tĩnh lặng chờ đợi tích lũy lượng (Cần Khối năng lượng)...");
                    }
                }
                else if (obj.type === 'fusion') {
                    if (state.flags.fusionDone) {
                        showFlash("Sự dung hợp đã hoàn tất.");
                        return;
                    }
                    const hasWhite = invRef.current.some(i => i.id === 'orb_white');
                    const hasBlack = invRef.current.some(i => i.id === 'orb_black');
                    
                    if (hasWhite && hasBlack) {
                        state.flags.fusionDone = true;
                        playGameSfx('craft');
                        const newInv = invRef.current.filter(i => i.id !== 'orb_white' && i.id !== 'orb_black');
                        
                        const ped = document.getElementById('l2-fusion-pedestal');
                        if (ped) ped.innerHTML += `<div class="l2-key-obj"></div>`;
                        
                        showFlash("Ánh sáng và Bóng tối thống nhất và đấu tranh...");
                        setTimeout(() => {
                            showFlash("Vụ nổ biện chứng tạo ra CHÌA KHÓA BIỆN CHỨNG!");
                            newInv.push({ id: 'key_dialect', name: 'Chìa khóa Biện chứng', icon: '🗝️', type: 'equip', desc: 'Thành quả của việc giải quyết mâu thuẫn.' });
                            setInventory([...newInv]);
                            if (ped) ped.innerHTML = `<div class="l2-pedestal-ring"></div>`; 
                        }, 2500);
                    } else {
                        showFlash("Bệ dung hợp yêu cầu hai mặt đối lập: Ánh sáng và Bóng tối.");
                    }
                }
                else if (obj.type === 'door') {
                    if (state.flags.doorUnlocked) {
                        showFlash("Cửa đã mở! Chân lý đang chờ phía trước.");
                        finishGame();
                    } else {
                        const keyIndex = invRef.current.findIndex(i => i.id === 'key_dialect');
                        if (keyIndex !== -1) {
                            state.flags.doorUnlocked = true;
                            playGameSfx('unlock');
                            document.getElementById('l2-door-lock-ui').textContent = "🔓";
                            document.getElementById('l2-exit-door').classList.add('unlocked');
                            showFlash("Cửa đã được mở khóa bằng Chìa khóa Biện chứng!");
                            const newInv = [...invRef.current];
                            newInv.splice(keyIndex, 1);
                            setInventory(newInv);
                        } else {
                            showFlash("Cửa đang khóa. Yêu cầu sự thống nhất của các mặt đối lập (Cần Chìa khóa).");
                        }
                    }
                }
            }
        }
    };

    const handleKeyDown = (e) => {
        if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
        keys.current[e.code] = true;

        if (gameStateRef.current === 'GAMEOVER') {
            if (e.code === 'KeyF') handleExit();
            return;
        }

        if (gameStateRef.current === 'SAFE_CODE') return; // Ignore keys when typing in input
        
        if (e.code === 'KeyF') {
            if (gameStateRef.current === 'PLAYING') handleInteractCore();
            else if (gameStateRef.current === 'DIALOG') {
                setDialogIndex(prev => {
                    if (prev + 1 >= dialoguesHegel.length) { setGameState('PLAYING'); return 0; }
                    return prev + 1;
                });
            }
            else if (gameStateRef.current === 'QUIZ') {
                if (quizRef.current === 2) {
                    showFlash("Hegel: Suy luận xuất sắc. Phủ định của phủ định tạo nên bước tiến mới.");
                    stateRef.current.flags.hegelQuizDone = true;
                } else {
                    showFlash("Hegel: Sai rồi. Hãy suy nghĩ lại về tính Kế thừa qua các vòng lặp.");
                }
                setGameState('PLAYING');
            }
        }
        
        if (gameStateRef.current === 'QUIZ') {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') setQuizSelectedIndex(prev => Math.max(0, prev - 1));
            if (e.code === 'KeyS' || e.code === 'ArrowDown') setQuizSelectedIndex(prev => Math.min(2, prev + 1));
        }

        if (e.code === 'KeyI' && gameStateRef.current !== 'DIALOG' && gameStateRef.current !== 'QUIZ') {
            if (gameStateRef.current === 'PLAYING') {
                setGameState('INVENTORY');
                if (previewInvRef.current === -1 && invRef.current.length > 0) setPreviewItemIndex(0);
            }
            else setGameState('PLAYING');
        }
        
        if (gameStateRef.current === 'INVENTORY') {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') setPreviewItemIndex(prev => Math.max(0, prev - 1));
            if (e.code === 'KeyS' || e.code === 'ArrowDown') setPreviewItemIndex(prev => Math.min(invRef.current.length - 1, prev + 1));
        }
        
        if (e.code === 'Escape') {
            if (gameStateRef.current === 'INVENTORY' || gameStateRef.current === 'QUIZ') setGameState('PLAYING');
        }
    };

    const handleKeyUp = (e) => { keys.current[e.code] = false; };

    const gameLoop = () => {
        if (gameStateRef.current === 'PLAYING') {
            let dx = 0, dy = 0;
            if (keys.current['KeyW'] || keys.current['ArrowUp']) dy -= CONFIG.speed; 
            if (keys.current['KeyS'] || keys.current['ArrowDown']) dy += CONFIG.speed;
            if (keys.current['KeyA'] || keys.current['ArrowLeft']) { dx -= CONFIG.speed; if (spriteRef.current) spriteRef.current.style.transform = 'scaleX(-1)'; }
            if (keys.current['KeyD'] || keys.current['ArrowRight']) { dx += CONFIG.speed; if (spriteRef.current) spriteRef.current.style.transform = 'scaleX(1)'; }
            
            if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

            const state = stateRef.current;
            const nX = state.player.x + dx; const nY = state.player.y + dy;
            if (!isColliding(nX, nY)) { 
                state.player.x = nX; 
                state.player.y = nY; 
            }
            
            if (spriteRef.current) {
                if (dx !== 0 || dy !== 0) spriteRef.current.classList.add('l2-walking'); 
                else spriteRef.current.classList.remove('l2-walking');
            }

            if (playerRef.current) {
                playerRef.current.style.left = state.player.x + 'px';
                playerRef.current.style.top = state.player.y + 'px';
            }

            // Interact prompt
            let showPrompt = false; let pX = 0, pY = 0;
            for (let obj of state.interactables) {
                if (['energy', 'dark_orb'].includes(obj.type)) {
                    const el = document.getElementById(`l2-${obj.id}`);
                    if (el && el.style.display === 'none') continue;
                }
                let checkDist = obj.type === 'door' ? 80 : CONFIG.interactDist;
                if (dist(state.player.x, state.player.y, obj.x, obj.y) < checkDist) {
                    showPrompt = true; pX = obj.x; pY = obj.y - obj.h/2 - 10;
                    if (obj.type === 'fusion') pY += 90; // Đẩy nút F của bệ dung hợp xuống 10px
                    break;
                }
            }
            if (promptRef.current) {
                if (showPrompt) {
                    promptRef.current.style.display = 'block';
                    promptRef.current.style.left = pX + 'px';
                    promptRef.current.style.top = pY + 'px';
                } else {
                    promptRef.current.style.display = 'none';
                }
            }
        }
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    // Auto-hide hint after 10 seconds
    useEffect(() => {
        const timer = setTimeout(() => setHintVisible(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (wrapperRef.current) {
                const scale = Math.min(window.innerWidth / 850, window.innerHeight / 650);
                wrapperRef.current.style.transform = `scale(${scale})`;
            }
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        handleResize();
        
        requestRef.current = requestAnimationFrame(gameLoop);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(requestRef.current);
            if (flashTimeout.current) clearTimeout(flashTimeout.current);
        };
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div id="game-wrapper" className="level2-wrapper" ref={wrapperRef}>
                <div className="level2-world">
                    <div id="l2-exit-door" className="l2-entity" style={{ left: 400, top: 30, width: 140, height: 60 }}>LỐI THOÁT<div className="l2-door-lock-container" id="l2-door-lock-ui">🔒</div></div>

                    <div id="l2-hegel" className="l2-entity" style={{ left: 400, top: 250 }}>
                        <div className="l2-char-name-tag">Hegel</div>
                        <div className="l2-char-container">
                            <div className="l2-hair-hegel"></div><div className="l2-char-head"></div>
                            <div className="l2-char-body"><div className="l2-char-arm l2-arm-left"></div><div className="l2-char-arm l2-arm-right"></div></div>
                            <div className="l2-char-leg l2-leg-left"></div><div className="l2-char-leg l2-leg-right"></div>
                        </div>
                    </div>

                    <div id="l2-machine" className="l2-entity l2-machine" style={{ left: 150, top: 400 }}>
                        <div className="l2-machine-screen" id="l2-machine-screen">0%</div>
                        <div className="l2-machine-bar-container"><div className="l2-machine-bar" id="l2-machine-bar"></div></div>
                    </div>

                    {/* Safe covers energy-1 but spawns it far */}
                    <div id="l2-safe" className="l2-entity l2-safe" style={{ left: 100, top: 150 }}></div>
                    <div id="l2-energy-1" className="l2-entity l2-energy-block" style={{ left: 160, top: 150, display: 'none' }}></div>

                    {/* Rock covers energy-2 but spawns it far */}
                    <div id="l2-rock" className="l2-entity l2-rock" style={{ left: 650, top: 100 }}></div>
                    <div id="l2-energy-2" className="l2-entity l2-energy-block" style={{ left: 570, top: 100, display: 'none' }}></div>
                    
                    <div id="l2-energy-3" className="l2-entity l2-energy-block" style={{ left: 700, top: 500 }}></div>

                    <div id="l2-orb-black-pickup" className="l2-entity" style={{ left: 100, top: 500, display: 'none' }}>
                        <div className="l2-orb l2-black-orb" style={{ top: 0, left: 0, position: 'relative' }}></div>
                    </div>

                    <div id="l2-fusion-pedestal" className="l2-entity l2-pedestal" style={{ left: 650, top: 300 }}>
                        <div className="l2-pedestal-ring"></div>
                    </div>

                    <div id="l2-player" className="l2-entity" style={{ left: 400, top: 450, zIndex: 90 }} ref={playerRef}>
                        <div className="l2-char-name-tag">Lữ Khách</div>
                        <div id="l2-player-sprite" className="l2-char-container" ref={spriteRef}>
                            <div className="l2-char-head"></div>
                            <div className="l2-char-body"><div className="l2-char-arm l2-arm-left"></div><div className="l2-char-arm l2-arm-right"></div></div>
                            <div className="l2-char-leg l2-leg-left"></div><div className="l2-char-leg l2-leg-right"></div>
                        </div>
                    </div>
                </div>

                <div id="l2-interact-prompt" ref={promptRef}>F</div>

                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2000 }}>
                    <div id="l2-flash-msg" ref={flashRef}>THÔNG BÁO</div>

                    {/* 10s hint overlay */}
                    {hintVisible && (
                        <div className="l2-hint-overlay" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(12, 15, 30, 0.92)', border: '1px solid rgba(255,255,255,0.12)', padding: '24px 40px', borderRadius: 16, backdropFilter: 'blur(8px)', pointerEvents: 'none', textAlign: 'center', zIndex: 2200 }}>
                            <div style={{ color: '#f1d07a', fontSize: 18, fontWeight: 'bold', fontFamily: 'Unbounded, sans-serif', marginBottom: 8 }}>📜 HƯỚNG DẪN</div>
                            <div style={{ color: '#e5e7eb', fontSize: 16, lineHeight: 1.6 }}>
                                Thao tác bằng <strong style={{ color: '#fb923c' }}>WASD</strong> để tìm đến <strong style={{ color: '#fb923c' }}>Hegel</strong>
                            </div>
                        </div>
                    )}
                    
                    <button 
                        type="button" 
                        style={{ pointerEvents: 'auto', position: 'absolute', top: 16, right: 16, background: 'rgba(12,14,22,0.9)', color: '#f1d07a', border: '1px solid rgba(214,178,94,0.35)', padding: '8px 14px', borderRadius: 12, fontFamily: 'Unbounded, sans-serif', fontSize: 12, textTransform: 'uppercase', cursor: 'pointer', zIndex: 2100 }}
                        onClick={() => setGameState(s => s === 'INVENTORY' ? 'PLAYING' : 'INVENTORY')}
                    >
                        Hành Trang [I]
                    </button>
                    
                    {gameState === 'DIALOG' && (
                        <div className="ui-panel" style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', width: '90%', background: 'rgba(12, 15, 30, 0.95)', border: '1px solid rgba(255,255,255,0.12)', padding: 24, borderRadius: 16, backdropFilter: 'blur(8px)', pointerEvents: 'auto' }}>
                            <div style={{ fontWeight: 'bold', color: '#fb923c', marginBottom: 8, fontSize: 24, textTransform: 'uppercase', fontFamily: 'Unbounded' }}>Hegel</div>
                            <div style={{ color: '#e5e7eb', fontStyle: 'italic', fontSize: 20, lineHeight: 1.6 }}>
                                {dialoguesHegel[dialogIndex]}
                            </div>
                            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 24, textTransform: 'uppercase', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.1em' }}>Nhấn [F] để tiếp tục</div>
                        </div>
                    )}

                    {gameState === 'SAFE_CODE' && (
                        <div className="ui-panel" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 350, background: 'rgba(20, 20, 20, 0.98)', border: '2px solid #555', padding: 32, borderRadius: 12, pointerEvents: 'auto', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' }}>
                            <h3 style={{ color: '#fff', marginBottom: 20, fontFamily: 'Unbounded' }}>Mật Mã Két Sắt</h3>
                            <input 
                                autoFocus
                                type="text"
                                maxLength={4}
                                value={safeCodeInput}
                                onChange={(e) => setSafeCodeInput(e.target.value.replace(/\D/g, ''))}
                                style={{ width: '100%', padding: '15px', fontSize: 24, textAlign: 'center', letterSpacing: '8px', background: '#111', color: '#33ff33', border: '1px solid #333', borderRadius: 8, outline: 'none', fontFamily: 'monospace' }}
                            />
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button style={{ flex: 1, padding: 12, background: '#444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setGameState('PLAYING')}>ĐÓNG</button>
                                <button style={{ flex: 1, padding: 12, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => {
                                    if (safeCodeInput === '1831') {
                                        stateRef.current.flags.safeUnlocked = true;
                                        document.getElementById('l2-safe').classList.add('unlocked');
                                        document.getElementById('l2-energy-1').style.display = 'block';
                                        showFlash("Mật mã chính xác! Két Sắt đã mở.");
                                        setGameState('PLAYING');
                                    } else {
                                        showFlash("Mật mã không hợp lệ.");
                                    }
                                }}>MỞ KÉT</button>
                            </div>
                        </div>
                    )}

                    {gameState === 'QUIZ' && (
                        <div className="ui-panel" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, background: 'rgba(12, 15, 30, 0.98)', border: '1px solid #fb923c', padding: 32, borderRadius: 16, backdropFilter: 'blur(8px)', pointerEvents: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                            <div style={{ fontWeight: 'bold', color: '#fb923c', marginBottom: 16, fontSize: 24, textTransform: 'uppercase', fontFamily: 'Unbounded', textAlign: 'center' }}>Hegel đặt câu hỏi</div>
                            <div style={{ color: '#e5e7eb', fontSize: 18, lineHeight: 1.6, marginBottom: 24, textAlign: 'center', fontStyle: 'italic' }}>"Mọi sự vật trên thế giới này vận động và phát triển theo con đường nào?"</div>
                            
                            {["Đường thẳng tắp, không bao giờ lặp lại.", "Vòng tròn khép kín, trở về điểm xuất phát.", "Đường xoáy ốc, dường như quay lại nhưng cao hơn."].map((opt, i) => (
                                <div key={i} className={`l2-dialog-option ${quizSelectedIndex === i ? 'active' : ''}`}>
                                    {String.fromCharCode(65 + i)}. {opt}
                                </div>
                            ))}
                            <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em', textAlign: 'center', marginTop: 16 }}>W/S: Chọn | F: Trả lời</div>
                        </div>
                    )}
                    
                    {gameState === 'INVENTORY' && (
                        <div className="ui-panel" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 480, background: 'rgba(12, 15, 30, 0.95)', border: '1px solid rgba(255,255,255,0.12)', padding: 24, borderRadius: 16, backdropFilter: 'blur(8px)', pointerEvents: 'auto' }}>
                            <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, borderBottom: '1px solid #374151', paddingBottom: 12, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'Unbounded', color: '#f1d07a' }}>Túi Đồ</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
                                {inventory.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#6b7280', padding: '24px 0', fontStyle: 'italic' }}>Hành trang trống</p>
                                ) : (
                                    inventory.map((it, i) => {
                                        const isPrev = i === previewItemIndex;
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 4, background: isPrev ? 'rgba(214, 178, 94, 0.15)' : 'transparent', borderLeft: isPrev ? '4px solid #d6b25e' : 'none' }}>
                                                <div style={{ fontSize: 28, width: 44, textAlign: 'center', marginRight: 12 }}>{it.icon}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: 16, color: '#f1d07a' }}>{it.name}</div>
                                                    <div style={{ fontSize: 13, color: '#9aa3b2', fontStyle: 'italic', marginTop: 4 }}>{it.desc}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em', textAlign: 'center', marginTop: 8 }}>W/S: Cuộn | I: Đóng | Các đồ vật tự kích hoạt khi cần</div>
                        </div>
                    )}

                    {gameState === 'GAMEOVER' && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,6,12,0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'auto' }}>
                            <div style={{ width: 'min(700px, 90%)', padding: 40, borderRadius: 24, background: 'rgba(8,10,16,0.92)', border: '1px solid rgba(214,178,94,0.25)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', textAlign: 'center' }}>
                                <h1 style={{ fontSize: 42, fontFamily: 'Unbounded, sans-serif', fontWeight: 800, color: '#f1d07a', marginBottom: 20 }}>BIỆN CHỨNG</h1>
                                <p style={{ fontSize: 18, color: '#9aa3b2', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 30 }}>Mâu thuẫn không phải là sự bế tắc, mà là động lực của sự phát triển. Thông qua việc tích lũy về lượng và dung hợp hai mặt đối lập, bạn đã tìm ra chìa khóa của sự thật.</p>
                                <div style={{ fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b7280', animation: 'pulse 2s infinite' }}>Ấn phím [F] để trở về Trạm Giao Thức</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Level2Minigame;
