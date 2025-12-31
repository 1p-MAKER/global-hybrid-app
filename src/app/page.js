'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import Image from 'next/image';
import { useSound } from './hooks/useSound';

export default function Home() {
  const [lang, setLang] = useState(null);
  const [gameState, setGameState] = useState('welcome'); // welcome, cleaning, fixing, deco, done
  const [progress, setProgress] = useState(0);
  const [money, setMoney] = useState(0);
  const [level, setLevel] = useState(0);
  const { playTap, playSuccess } = useSound();

  const STAGES = [
    { id: 0, title: 'Old Classic', desc_en: 'Heavily dusted screen', desc_ja: 'ホコリまみれの旧式スマホ', color: '#1a1a1a', tilt: 0 },
    { id: 1, title: 'Extreme Crack', desc_en: 'Shattered glass everywhere', desc_ja: 'バキバキの画面', color: '#2c3e50', tilt: 10 },
    { id: 2, title: 'Neon Edition', desc_en: 'High-end stylish phone', desc_ja: '最新のネオンスマホ', color: '#8e44ad', tilt: -5 },
    { id: 3, title: 'Future Pad', desc_en: 'Large experimental tablet', desc_ja: '大型の試作タブレット', color: '#27ae60', tilt: 5 },
  ];

  const currentStage = STAGES[level % STAGES.length];

  // Deco State
  const [bodyColor, setBodyColor] = useState('transparent');
  const [stickers, setStickers] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null); // 'color', 'sticker'

  // Input State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPointerDown, setIsPointerDown] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const particles = useRef([]);

  const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b'];

  // --- ASMR Particle System ---
  const spawnParticles = useCallback((x, y, type) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const count = type === 'cleaning' ? 3 : 8;
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x: canvasX,
        y: canvasY,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 2,
        life: 1.0,
        size: Math.random() * 5 + 2,
        color: type === 'cleaning' ? '#8B4513' : 'rgba(200, 230, 255, 0.8)',
        shape: type === 'cleaning' ? 'circle' : 'poly'
      });
    }
  }, []);

  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.current = particles.current.filter(p => p.life > 0);

    particles.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5; // Gravity
      p.life -= 0.02;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 10);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    requestAnimationFrame(updateParticles);
  }, []);

  useEffect(() => {
    if (gameState !== 'welcome' && canvasRef.current) {
      updateParticles();
    }
  }, [gameState, updateParticles]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  useEffect(() => {
    async function checkLanguage() {
      try {
        const info = await Device.getLanguageCode();
        setLang(info.value);
      } catch (e) {
        setLang(navigator.language);
      }
    }
    checkLanguage();
  }, []);

  const isJapanese = lang && (lang.toLowerCase() === 'ja' || lang.toLowerCase().startsWith('ja-'));

  const triggerHaptic = async (style = ImpactStyle.Heavy) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Ignore
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: isJapanese ? '最高のデコスマホ完成！' : 'Custom Phone Repaired!',
        text: isJapanese
          ? `「AI Phone Repair」でステージ ${level + 1} をクリア！`
          : `Just cleared Stage ${level + 1} in AI Phone Repair!`,
        url: 'https://github.com/1p-MAKER/global-hybrid-app',
        dialogTitle: isJapanese ? 'シェアする' : 'Share with friends',
      });
    } catch (e) {
      console.log('Share failed:', e);
    }
  };

  const handleStart = () => {
    setGameState('cleaning');
    setProgress(0);
    setStickers([]);
    setBodyColor('transparent');
  };

  const handlePointerDown = (e) => {
    setIsPointerDown(true);
    lastPos.current = { x: e.clientX, y: e.clientY };

    if (gameState === 'cleaning' || gameState === 'fixing') {
      updateProgress(0.5);
      spawnParticles(e.clientX, e.clientY, gameState);
    } else if (gameState === 'deco' && selectedTool === 'sticker') {
      placeSticker(e);
    }
  };

  const handlePointerUp = () => {
    setIsPointerDown(false);
  };

  const handlePointerMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isPointerDown) {
      const dist = Math.sqrt(
        Math.pow(e.clientX - lastPos.current.x, 2) +
        Math.pow(e.clientY - lastPos.current.y, 2)
      );

      if (dist > 10) {
        lastPos.current = { x: e.clientX, y: e.clientY };
        if (gameState === 'cleaning' || gameState === 'fixing') {
          updateProgress(dist / (15 + level)); // Gradually get harder
          triggerHaptic(ImpactStyle.Light);
          spawnParticles(e.clientX, e.clientY, gameState);
        }
      }
    }
  };

  const updateProgress = (amount) => {
    const newProgress = Math.min(100, progress + amount);
    setProgress(newProgress);

    if (newProgress >= 100) {
      if (gameState === 'cleaning') {
        setGameState('fixing');
        setProgress(0);
        setMoney(m => m + 50);
        playSuccess();
      } else if (gameState === 'fixing') {
        setGameState('deco');
        setProgress(0);
        setMoney(m => m + 100);
        playSuccess();
      }
    }
  };

  const placeSticker = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSticker = {
      id: Date.now(),
      x,
      y,
      type: Math.floor(Math.random() * 4)
    };
    setStickers([...stickers, newSticker]);
    triggerHaptic();
    playTap();
    setMoney(m => m + 10);
  };

  const getToolIcon = () => {
    if (gameState === 'cleaning') return '🧹';
    if (gameState === 'fixing') return '✨';
    if (gameState === 'deco') {
      if (selectedTool === 'color') return '🎨';
      if (selectedTool === 'sticker') return '⭐';
      return '🖌️';
    }
    return '👆';
  };

  if (!lang) return <div className="spinner"></div>;

  return (
    <div
      className="game-container"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '0.9rem', opacity: 0.6, fontWeight: 'bold' }}>
        STAGE {level + 1}
      </div>

      <div className="money-display">
        🪙 ${money}
      </div>

      <div
        className="tool-cursor"
        style={{ left: mousePos.x, top: mousePos.y }}
      >
        {getToolIcon()}
      </div>

      <div className="phone-wrapper" style={{ transform: `rotate(${currentStage.tilt}deg)` }}>
        <Image
          src="/phone_damaged.png"
          alt="Damaged Phone"
          fill
          className="phone-image"
          style={{
            opacity: gameState === 'cleaning' || (gameState === 'fixing' && progress <= 50) || gameState === 'welcome' ? 1 : 0,
            transition: 'opacity 0.5s ease',
            transform: gameState === 'cleaning' ? `scale(${1 + progress / 800})` : 'scale(1)',
            zIndex: 1,
            filter: `drop-shadow(0 20px 50px rgba(0,0,0,0.5)) drop-shadow(0 0 0 ${currentStage.color})` // Vary phone body color
          }}
        />

        <Image
          src="/phone_clean.png"
          alt="Clean Phone"
          fill
          className="phone-image"
          style={{
            opacity: (gameState === 'fixing' && progress > 50) || gameState === 'deco' || gameState === 'done' ? 1 : 0,
            transition: 'opacity 0.5s ease',
            zIndex: 2,
            filter: bodyColor !== 'transparent'
              ? `drop-shadow(0 20px 50px rgba(0,0,0,0.5)) opacity(0.8) drop-shadow(0 0 0 ${bodyColor})`
              : `drop-shadow(0 20px 50px rgba(0,0,0,0.5)) drop-shadow(0 0 0 ${currentStage.color})`
          }}
        />

        <canvas ref={canvasRef} className="asmr-canvas"></canvas>

        {(gameState === 'deco' || gameState === 'done') && bodyColor !== 'transparent' && (
          <div style={{
            position: 'absolute', top: 18, left: 16, right: 16, bottom: 18,
            borderRadius: 36,
            backgroundColor: bodyColor,
            mixBlendMode: 'overlay',
            opacity: 0.6,
            zIndex: 16,
            pointerEvents: 'none'
          }}></div>
        )}

        {(gameState === 'deco' || gameState === 'done') && stickers.map(s => (
          <div key={s.id} className={`sticker sticker-${s.type}`} style={{ left: s.x, top: s.y, zIndex: 17 }}></div>
        ))}

        <div className="interaction-layer"></div>
      </div>

      <div className="ui-overlay">
        {gameState === 'welcome' && (
          <div className="status-panel">
            <h2>{isJapanese ? currentStage.desc_ja : currentStage.desc_en}</h2>
            <p>{currentStage.title}</p>
            <button className="action-btn" style={{ marginTop: '1rem' }} onClick={handleStart}>
              {isJapanese ? '修理を開始する' : 'Start Repair'}
            </button>
          </div>
        )}

        {gameState === 'cleaning' && (
          <div className="status-panel">
            <h2>{isJapanese ? 'クリーニング中...' : 'Cleaning...'}</h2>
            <p>{isJapanese ? 'スクラブして汚れを落としましょう' : 'Scrub to remove dirt'}</p>
            <div className="repair-progress">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {gameState === 'fixing' && (
          <div className="status-panel">
            <h2>{isJapanese ? '修理中...' : 'Repairing...'}</h2>
            <p>{isJapanese ? 'ひび割れを磨いて直しましょう' : 'Polish away the cracks'}</p>
            <div className="repair-progress">
              <div className="progress-bar" style={{ width: `${progress}%`, background: '#4ADE80' }}></div>
            </div>
          </div>
        )}

        {gameState === 'deco' && (
          <div className="status-panel">
            <h2>{isJapanese ? 'デコレーション' : 'Decoration Time!'}</h2>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
              <button onClick={() => setSelectedTool('color')} className="action-btn" style={{ background: selectedTool === 'color' ? '#fff' : 'rgba(255,255,255,0.1)', color: selectedTool === 'color' ? '#000' : '#fff', padding: '0.5rem 1rem' }}>🎨 Color</button>
              <button onClick={() => setSelectedTool('sticker')} className="action-btn" style={{ background: selectedTool === 'sticker' ? '#fff' : 'rgba(255,255,255,0.1)', color: selectedTool === 'sticker' ? '#000' : '#fff', padding: '0.5rem 1rem' }}>✨ Sticker</button>
            </div>
            {selectedTool === 'color' && <div className="palette">{COLORS.map(c => <div key={c} className={`color-swatch ${bodyColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => { setBodyColor(c); playTap(); }} />)}</div>}
            {selectedTool === 'sticker' && <p style={{ fontSize: '0.8rem' }}>{isJapanese ? '画面をタップしてスタンプ！' : 'Tap screen to stamp!'}</p>}
            <button className="action-btn" style={{ marginTop: '1rem', background: '#4ADE80' }} onClick={() => { setGameState('done'); playSuccess(); setLevel(l => l + 1); }}>{isJapanese ? '完成！' : 'Finish!'}</button>
          </div>
        )}

        {gameState === 'done' && (
          <div className="status-panel">
            <h2>{isJapanese ? '修理完了！' : 'Repair Complete!'}</h2>
            <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
              <button className="action-btn" style={{ background: '#38BDF8', color: '#fff' }} onClick={handleShare}>{isJapanese ? 'シェアする' : 'Share'}</button>
              <button className="action-btn" onClick={() => { setGameState('welcome'); setProgress(0); setStickers([]); setBodyColor('transparent'); }}>{isJapanese ? '次の依頼へ' : 'Next Request'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
