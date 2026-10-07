import React, { useEffect } from 'react';
import HUD from './components/ui/hud/HUD';
import MainCanvas from './components/3d/MainCanvas';
import QuestionOverlay from './components/ui/QuestionOverlay';
import RewardOverlay from './components/ui/RewardOverlay';
import GateGuardianModal from './components/ui/GateGuardianModal';
import Level2Minigame from './components/2d/Level2Minigame';
import Level3Minigame from './components/2d/Level3Minigame';
import EndingSlideshow from './components/2d/EndingSlideshow';
import AmbientAudio from './components/audio/AmbientAudio';
import { useGameStore } from './store/useGameStore';
import { Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error(error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', zIndex: 9999, position: 'absolute', top: 0, left: 0, background: 'black', padding: '20px', width: '100vw', height: '100vh', pointerEvents: 'auto' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const addItem = useGameStore((state) => state.addItem);
  const viewState = useGameStore((state) => state.viewState);
  const currentBranch = useGameStore((state) => state.currentBranch);
  const setViewState = useGameStore((state) => state.setViewState);

  useEffect(() => {
    // All dev shortcuts removed - must progress through game normally
  }, [setViewState]);

  const giveTestItems = () => {
    addItem({ id: 'stone', name: 'Khối đá nguyên thủy', icon: '🪨' });
    addItem({ id: 'mirror', name: 'Tấm gương sáng', icon: '🪞' });
    addItem({ id: 'water', name: 'Bình nước tinh khiết', icon: '💧' });
    addItem({ id: 'fire', name: 'Mồi lửa', icon: '🔥' });
    addItem({ id: 'rope', name: 'Dây thừng', icon: '🪢' });
    addItem({ id: 'gear', name: 'Bánh răng', icon: '⚙️' });
    addItem({ id: 'scroll', name: 'Cuộn giấy', icon: '📜' });
  };

  return (
    <>
      <ErrorBoundary>
        <MainCanvas />
      </ErrorBoundary>

      <AmbientAudio />
      {viewState === 'ENDING' && <EndingSlideshow />}
      
      {/* 2D UI Overlay Layer */}
      {viewState !== 'ENDING' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 10 }}>
        
        <QuestionOverlay />
        <RewardOverlay />
        <GateGuardianModal />

        {/* Top Right HUD */}
        <div style={{ pointerEvents: 'auto' }}>
          <HUD />
        </div>
        
        {/* Top Left Title */}
        <div style={{ position: 'absolute', top: '30px', left: '40px' }}>
          <h1 className="fw-bold gradient-text m-0" style={{ fontSize: '28px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}>
            DIALECTICAL FLOW
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 'bold', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>
            Khám phá Không gian Nơ-ron 3D
          </p>
        </div>
        
        {viewState === 'BRANCH' && currentBranch === 2 && (
          <Level2Minigame />
        )}
        
        {((viewState === 'BRANCH' && currentBranch === 3) || viewState === 'LEVEL_3') && (
          <Level3Minigame />
        )}

      </div>}
    </>
  );
}

export default App;
