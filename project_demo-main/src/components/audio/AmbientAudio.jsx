import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

const PROFILES = {
  silent: { master: 0, drone: 0, overtone: 0, room: 0, pulse: 0, filter: 260, lfoRate: 0.04, lfoDepth: 20 },
  start: { master: 0.12, base: 55, overtoneHz: 82.5, drone: 0.22, overtone: 0.07, room: 0.035, pulseHz: 0.35, pulse: 0.025, filter: 320, lfoRate: 0.05, lfoDepth: 80, chimeHz: 523.25 },
  hub: { master: 0.14, base: 65.41, overtoneHz: 98, drone: 0.2, overtone: 0.1, room: 0.025, pulseHz: 0.22, pulse: 0.02, filter: 520, lfoRate: 0.07, lfoDepth: 160, chimeHz: 659.25 },
  warp: { master: 0.14, base: 82.41, overtoneHz: 164.81, drone: 0.22, overtone: 0.13, room: 0.055, pulseHz: 1.5, pulse: 0.045, filter: 900, lfoRate: 0.2, lfoDepth: 260 },
  branch1: { master: 0.13, base: 58.27, overtoneHz: 87.31, drone: 0.22, overtone: 0.08, room: 0.045, pulseHz: 0.42, pulse: 0.025, filter: 420, lfoRate: 0.06, lfoDepth: 110, chimeHz: 440 },
  branch2: { master: 0.12, base: 49, overtoneHz: 73.42, drone: 0.24, overtone: 0.075, room: 0.035, pulseHz: 1.1, pulse: 0.06, filter: 300, lfoRate: 0.09, lfoDepth: 70, chimeHz: 293.66 },
  branch3: { master: 0.12, base: 43.65, overtoneHz: 65.41, drone: 0.25, overtone: 0.06, room: 0.085, pulseHz: 0.28, pulse: 0.018, filter: 240, lfoRate: 0.035, lfoDepth: 50, chimeHz: 220 },
  boss: { master: 0.13, base: 41.2, overtoneHz: 61.74, drone: 0.25, overtone: 0.12, room: 0.065, pulseHz: 0.65, pulse: 0.04, filter: 380, lfoRate: 0.08, lfoDepth: 130, chimeHz: 329.63 },
};

let sharedEngine;

function getProfile(viewState, currentBranch) {
  if (viewState === 'ENDING') return PROFILES.silent;
  if (viewState === 'START') return PROFILES.start;
  if (viewState === 'HUB') return PROFILES.hub;
  if (viewState === 'WARPING') return PROFILES.warp;
  if (currentBranch === 1) return PROFILES.branch1;
  if (currentBranch === 2) return PROFILES.branch2;
  if (currentBranch === 3) return PROFILES.branch3;
  if (currentBranch === 'BOSS') return PROFILES.boss;
  return PROFILES.hub;
}

function createNoiseBuffer(context) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }
  return buffer;
}

function ramp(parameter, value, context, duration = 1.8) {
  parameter.cancelScheduledValues(context.currentTime);
  parameter.setValueAtTime(parameter.value, context.currentTime);
  parameter.linearRampToValueAtTime(value, context.currentTime + duration);
}

function createAmbientEngine() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext();
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const droneGain = context.createGain();
  const overtoneGain = context.createGain();
  const roomGain = context.createGain();
  const pulseGain = context.createGain();
  const lfoDepth = context.createGain();
  const effectsGain = context.createGain();
  const drone = context.createOscillator();
  const overtone = context.createOscillator();
  const pulse = context.createOscillator();
  const lfo = context.createOscillator();
  const room = context.createBufferSource();

  master.gain.value = 0;
  effectsGain.gain.value = 0.65;
  filter.type = 'lowpass';
  filter.Q.value = 0.8;
  drone.type = 'sine';
  overtone.type = 'triangle';
  pulse.type = 'sine';
  lfo.type = 'sine';
  room.buffer = createNoiseBuffer(context);
  room.loop = true;

  drone.connect(droneGain);
  overtone.connect(overtoneGain);
  pulse.connect(pulseGain);
  room.connect(roomGain);
  droneGain.connect(filter);
  overtoneGain.connect(filter);
  pulseGain.connect(filter);
  roomGain.connect(filter);
  lfo.connect(lfoDepth);
  lfoDepth.connect(filter.frequency);
  filter.connect(master);
  effectsGain.connect(context.destination);
  master.connect(context.destination);

  [drone, overtone, pulse, lfo, room].forEach((node) => node.start());

  let muted = false;
  let profile = PROFILES.silent;

  const playTone = ({ frequency, endFrequency = frequency, duration = 0.12, volume = 0.22, type = 'sine', delay = 0 }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(effectsGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  };

  const playNoise = ({ duration = 0.16, volume = 0.12, filterHz = 1200, delay = 0 }) => {
    const source = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    source.buffer = createNoiseBuffer(context);
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = filterHz;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(noiseFilter);
    noiseFilter.connect(gain);
    gain.connect(effectsGain);
    source.start(start);
    source.stop(start + duration);
  };

  const playSfx = (name) => {
    if (muted) return;
    context.resume();
    if (name === 'click') {
      playTone({ frequency: 560, endFrequency: 360, duration: 0.07, volume: 0.16, type: 'triangle' });
    } else if (name === 'navigate') {
      playTone({ frequency: 240, endFrequency: 360, duration: 0.12, volume: 0.16, type: 'triangle' });
    } else if (name === 'pickup') {
      playTone({ frequency: 520, endFrequency: 780, duration: 0.13, volume: 0.22 });
      playTone({ frequency: 780, endFrequency: 1040, duration: 0.16, volume: 0.18, delay: 0.1 });
    } else if (name === 'portal') {
      playNoise({ duration: 0.42, volume: 0.12, filterHz: 900 });
      playTone({ frequency: 110, endFrequency: 330, duration: 0.7, volume: 0.3, type: 'sawtooth' });
      playTone({ frequency: 220, endFrequency: 660, duration: 0.65, volume: 0.16, delay: 0.1 });
    } else if (name === 'locked') {
      playTone({ frequency: 150, endFrequency: 72, duration: 0.28, volume: 0.28, type: 'square' });
      playNoise({ duration: 0.12, volume: 0.11, filterHz: 480 });
    } else if (name === 'unlock') {
      [293.66, 440, 659.25].forEach((frequency, index) => playTone({ frequency, duration: 0.32, volume: 0.2, delay: index * 0.12 }));
      playNoise({ duration: 0.3, volume: 0.08, filterHz: 1800, delay: 0.12 });
    } else if (name === 'correct') {
      [440, 554.37, 659.25].forEach((frequency, index) => playTone({ frequency, duration: 0.28, volume: 0.2, delay: index * 0.1 }));
    } else if (name === 'wrong') {
      playTone({ frequency: 190, endFrequency: 82, duration: 0.42, volume: 0.3, type: 'sawtooth' });
    } else if (name === 'craft') {
      playTone({ frequency: 130, endFrequency: 520, duration: 0.65, volume: 0.24, type: 'sawtooth' });
      playNoise({ duration: 0.4, volume: 0.08, filterHz: 1400 });
    } else if (name === 'liquid') {
      playTone({ frequency: 900, endFrequency: 420, duration: 0.22, volume: 0.17 });
    } else if (name === 'fire') {
      playNoise({ duration: 0.32, volume: 0.14, filterHz: 2200 });
      playTone({ frequency: 180, endFrequency: 260, duration: 0.25, volume: 0.12, type: 'triangle' });
    } else if (name === 'purify') {
      playTone({ frequency: 110, endFrequency: 880, duration: 1.3, volume: 0.27, type: 'sawtooth' });
      playTone({ frequency: 220, endFrequency: 1320, duration: 1.5, volume: 0.18, delay: 0.15 });
      playNoise({ duration: 0.8, volume: 0.1, filterHz: 2400, delay: 0.2 });
    }
  };
  const chimeTimer = window.setInterval(() => {
    if (muted || !profile.chimeHz || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.value = profile.chimeHz;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.022, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 2.5);
  }, 9000);

  const setProfile = (nextProfile) => {
    profile = nextProfile;
    const volume = muted ? 0 : nextProfile.master;
    ramp(master.gain, volume, context);
    ramp(drone.frequency, nextProfile.base || 55, context);
    ramp(overtone.frequency, nextProfile.overtoneHz || 82.5, context);
    ramp(pulse.frequency, nextProfile.pulseHz || 0.3, context);
    ramp(droneGain.gain, nextProfile.drone, context);
    ramp(overtoneGain.gain, nextProfile.overtone, context);
    ramp(roomGain.gain, nextProfile.room, context);
    ramp(pulseGain.gain, nextProfile.pulse, context);
    ramp(filter.frequency, nextProfile.filter, context);
    ramp(lfo.frequency, nextProfile.lfoRate, context);
    ramp(lfoDepth.gain, nextProfile.lfoDepth, context);
  };

  return {
    resume: () => context.resume(),
    setMuted: (nextMuted) => {
      muted = nextMuted;
      ramp(master.gain, muted ? 0 : profile.master, context, 0.35);
      ramp(effectsGain.gain, muted ? 0 : 0.65, context, 0.18);
    },
    setProfile,
    playSfx,
    destroy: () => {
      window.clearInterval(chimeTimer);
      context.close();
    },
  };
}

function getEngine() {
  if (!sharedEngine) sharedEngine = createAmbientEngine();
  sharedEngine?.resume();
  return sharedEngine;
}

export function playGameSfx(name) {
  getEngine()?.playSfx(name);
}

function readInitialMute() {
  try {
    return window.localStorage.getItem('dialectical-flow-muted') === 'true';
  } catch {
    return false;
  }
}

export default function AmbientAudio() {
  const viewState = useGameStore((state) => state.viewState);
  const currentBranch = useGameStore((state) => state.currentBranch);
  const engineRef = useRef(null);
  const [isMuted, setIsMuted] = useState(readInitialMute);
  const [isStarted, setIsStarted] = useState(false);

  const startAudio = useCallback(() => {
    if (viewState === 'ENDING') return;
    if (!engineRef.current) engineRef.current = getEngine();
    engineRef.current?.resume();
    engineRef.current?.setMuted(isMuted);
    engineRef.current?.setProfile(getProfile(viewState, currentBranch));
    setIsStarted(Boolean(engineRef.current));
  }, [currentBranch, isMuted, viewState]);

  useEffect(() => {
    if (isStarted || viewState === 'ENDING') return undefined;
    const activate = () => startAudio();
    window.addEventListener('pointerdown', activate, { once: true });
    window.addEventListener('keydown', activate, { once: true });
    return () => {
      window.removeEventListener('pointerdown', activate);
      window.removeEventListener('keydown', activate);
    };
  }, [isStarted, startAudio, viewState]);

  useEffect(() => {
    const playClick = (event) => {
      if (event.target.closest?.('button, .l3-interactable, .l3-nav-arrow, .item-slot, .crafting-slot')) {
        playGameSfx('click');
      }
    };
    window.addEventListener('pointerdown', playClick);
    return () => window.removeEventListener('pointerdown', playClick);
  }, []);

  useEffect(() => {
    engineRef.current?.setProfile(getProfile(viewState, currentBranch));
  }, [currentBranch, viewState]);

  useEffect(() => {
    engineRef.current?.setMuted(isMuted);
    try {
      window.localStorage.setItem('dialectical-flow-muted', String(isMuted));
    } catch {
      // Audio preference persistence is optional.
    }
  }, [isMuted]);

  if (viewState === 'ENDING') return null;

  return (
    <button
      aria-label={isMuted ? 'Bật âm thanh nền' : 'Tắt âm thanh nền'}
      className="ambient-audio-toggle"
      onClick={() => {
        if (!isStarted) startAudio();
        setIsMuted((current) => !current);
      }}
      title={isMuted ? 'Bật âm thanh nền' : 'Tắt âm thanh nền'}
      type="button"
    >
      {isMuted ? (
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4m12.5 3c0-1.2-.7-2.3-1.7-2.8v2.2l1.6 1.6c.1-.3.1-.7.1-1m2.5 0c0 .9-.2 1.7-.5 2.5l1.5 1.5c.6-1.2 1-2.6 1-4 0-3.4-2.4-6.3-5.7-7v2.1C17.5 7.8 19 9.7 19 12M4.3 3 3 4.3 8.7 10H4v4h4l5 4v-3.7l4.7 4.7c-.7.5-1.5.9-2.4 1.1v2.1c1.4-.3 2.7-.9 3.8-1.7l1.6 1.6 1.3-1.3L4.3 3Z" /></svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4m11.5 3c0-1.8-1-3.3-2.5-4v8c1.5-.7 2.5-2.2 2.5-4M15 3.2v2.1c2.9.9 5 3.5 5 6.7s-2.1 5.8-5 6.7v2.1c4-.9 7-4.5 7-8.8s-3-7.9-7-8.8Z" /></svg>
      )}
    </button>
  );
}
