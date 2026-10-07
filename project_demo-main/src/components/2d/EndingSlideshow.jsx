import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import endingSoundtrack from '../../assets/age-of-war-soundtrack-1-made-with-Voicemod.mp3';
import './EndingSlideshow.css';

const SLIDE_TIMES = [11000, 11000, 12000];

const team = [
  'Phạm Thị Duyên',
  'Đào Thanh Thùy',
  'Phạm Yến Nhi',
  'Quản Lan Anh',
  'Nguyễn Việt Hùng',
  'Phạm Đức Trọng',
  'Trần Quang Đức',
  'Vũ Minh Tân',
  'Kiều Đức Lâm',
  'Trịnh Quốc Khánh',
];

let stopAudio;
let soundtrack;
let soundtrackFadeInFrame;
let soundtrackStarted = false;

export function startEndingAudio() {
  if (stopAudio) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = AudioContext ? new AudioContext() : null;
  prepareEndingSoundtrack();

  if (context) {
    const master = context.createGain();
    master.gain.value = 0.08;
    master.connect(context.destination);

    const playTone = (frequency, start, duration, volume, type = 'sine') => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + duration);
    };

    // A dry projector-switch click before the soundtrack fades in.
    playTone(1500, context.currentTime, 0.035, 0.9, 'square');
    playTone(170, context.currentTime + 0.04, 0.08, 0.35, 'triangle');
  }

  stopAudio = () => {
    stopEndingSoundtrack();
    context?.close();
    stopAudio = undefined;
  };
}

function prepareEndingSoundtrack() {
  if (soundtrack) return;

  soundtrack = new Audio(endingSoundtrack);
  soundtrack.loop = true;
  soundtrack.volume = 0;
  soundtrack.play().catch(() => {});
}

function startEndingSoundtrack() {
  if (soundtrackStarted) return;

  prepareEndingSoundtrack();
  soundtrackStarted = true;

  const fadeStartedAt = performance.now();
  const fadeIn = (now) => {
    soundtrack.volume = Math.min(0.42, ((now - fadeStartedAt) / 2800) * 0.42);
    if (soundtrack.volume < 0.42) soundtrackFadeInFrame = requestAnimationFrame(fadeIn);
  };
  soundtrackFadeInFrame = requestAnimationFrame(fadeIn);
}

function stopEndingSoundtrack() {
  if (!soundtrack) return;

  cancelAnimationFrame(soundtrackFadeInFrame);
  const audio = soundtrack;
  soundtrack = undefined;
  soundtrackStarted = false;
  const fadeOutTimer = window.setInterval(() => {
    audio.volume = Math.max(0, audio.volume - 0.04);
    if (audio.volume === 0) {
      window.clearInterval(fadeOutTimer);
      audio.pause();
      audio.currentTime = 0;
    }
  }, 60);
}

function useEndingAudio(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    startEndingAudio();
    return () => {
      stopAudio?.();
    };
  }, [enabled]);
}

function Spiral() {
  return (
    <div className="ending-spiral" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((ring) => <span key={ring} style={{ '--ring': ring }} />)}
    </div>
  );
}

function SproutBook() {
  return (
    <div className="sprout-book" aria-hidden="true">
      <div className="sprout-stem" />
      <div className="sprout-leaf sprout-leaf-left" />
      <div className="sprout-leaf sprout-leaf-right" />
      <div className="book-page book-page-left" />
      <div className="book-page book-page-right" />
    </div>
  );
}

function SlideOne() {
  const lines = [
    'Bạn đã đi qua một hành trình dài của Nhận thức:',
    'Nhận diện Mâu thuẫn để tìm ra lối đi (Cửa 1).',
    'Vượt qua Phủ định để nhìn thấu Ảo ảnh (Cửa 2).',
    'Tổng hòa Biện chứng để chữa lành những sai lầm (Cửa 3).',
  ];

  return (
    <div className="ending-centered synthesis-slide">
      <Spiral />
      <p className="ending-kicker">KHO TÀNG TỐI THƯỢNG</p>
      {lines.map((line, index) => (
        <motion.p
          className={index === 0 ? 'synthesis-lead' : 'synthesis-line'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 + index * 1.15, duration: 1.25 }}
          key={line}
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
}

function SlideTwo() {
  return (
    <div className="ending-centered quote-slide">
      <p className="ending-kicker">LUẬN ĐỀ VỀ FEUERBACH</p>
      <motion.blockquote
        initial={{ opacity: 0, color: '#fff' }}
        animate={{ opacity: 1, color: '#d7b566' }}
        transition={{ delay: 1, duration: 4 }}
      >
        “Các nhà triết học trước kia chỉ giải thích thế giới bằng nhiều cách khác nhau,
        song vấn đề là <strong>CẢI TẠO</strong> thế giới.”
      </motion.blockquote>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4, duration: 1.5 }} className="quote-author">
        — C. Mác —
      </motion.p>
    </div>
  );
}

function SlideThree() {
  return (
    <div className="ending-centered action-slide">
      <SproutBook />
      <p className="ending-kicker">TỪ NHẬN THỨC ĐẾN THỰC TIỄN</p>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1.5 }}>
        <p>Triết học không nằm trên những trang sách bám bụi.</p>
        <p>Bản chất của Biện chứng là sự vận động không ngừng.</p>
        <p>Hãy mang Chân lý bạn đã học được hôm nay vào Thực tiễn cuộc sống,<br />bởi đó là nơi duy nhất kiểm chứng sức mạnh của Triết học.</p>
      </motion.div>
    </div>
  );
}

function SlideFour({ onReplay }) {
  const [showFinalCard, setShowFinalCard] = useState(false);

  return (
    <div className="credits-viewport">
      <div className="credits-roll" onAnimationEnd={() => setShowFinalCard(true)}>
        <p className="ending-kicker">DIALECTICAL FLOW</p>
        <h1>CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH<br />HÀNH TRÌNH NHẬN THỨC</h1>
        <p className="good-ending">(Game Over - Good Ending)</p>
        <div className="credits-divider" />
        <p>Môn học: <strong>Triết học Mác - Lênin (Triết 111)</strong></p>
        <h2>ĐỘI NGŨ PHÁT TRIỂN</h2>
        {team.map((name) => <p className="credit-person" key={name}><strong>{name}</strong></p>)}
      </div>
      <AnimatePresence>
        {showFinalCard && (
          <motion.div className="credits-final-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4 }}>
            <p className="credits-thanks">Cảm ơn bạn đã bước tới tận cùng của hành trình.</p>
            <button className="replay-button" onClick={onReplay}>CHƠI LẠI</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EndingSlideshow() {
  const resetGame = useGameStore((state) => state.resetGame);
  const isPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('ending-preview');
  const [isReady, setIsReady] = useState(!isPreview);
  const [slide, setSlide] = useState(0);
  useEndingAudio(isReady);

  useEffect(() => {
    if (slide >= SLIDE_TIMES.length) return undefined;
    const timeout = window.setTimeout(() => setSlide((current) => current + 1), SLIDE_TIMES[slide]);
    return () => window.clearTimeout(timeout);
  }, [slide]);

  useEffect(() => {
    if (slide === 3) startEndingSoundtrack();
  }, [slide]);

  const slides = [<SlideOne />, <SlideTwo />, <SlideThree />, <SlideFour onReplay={resetGame} />];

  if (!isReady) {
    return (
      <div className="ending-overlay ending-preview">
        <p className="ending-kicker">DIALECTICAL FLOW</p>
        <h1>KHO TÀNG TỐI THƯỢNG</h1>
        <button className="replay-button" onClick={() => { startEndingAudio(); setIsReady(true); }}>MỞ KHO TÀNG</button>
      </div>
    );
  }

  return (
    <div className="ending-overlay">
      <AnimatePresence mode="wait">
        <motion.section
          className="ending-slide"
          key={slide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          {slides[slide]}
        </motion.section>
      </AnimatePresence>
      <div className="ending-controls">
        {slides.map((_, index) => (
          <button className={index === slide ? 'active' : ''} onClick={() => setSlide(index)} aria-label={`Xem slide ${index + 1}`} key={index} />
        ))}
      </div>
      {slide < slides.length - 1 && <button className="ending-next" onClick={() => setSlide((current) => current + 1)}>TIẾP TỤC <span>→</span></button>}
    </div>
  );
}
