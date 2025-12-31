'use client';

import { useState, useEffect } from 'react';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import Image from 'next/image';
import { useSound } from './hooks/useSound';

export default function Home() {
  const [lang, setLang] = useState(null);
  const [gameState, setGameState] = useState('welcome'); // welcome, cleaning, fixing, done, deco
  const [progress, setProgress] = useState(0);
  const { playTap, playSuccess } = useSound();

  // Deco State
  const [bodyColor, setBodyColor] = useState('transparent');
  const [stickers, setStickers] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null); // 'color', 'sticker'

  const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b'];

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

  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      // Ignore
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: isJapanese ? '最高のデコスマホ完成！' : 'Custom Phone Repaired!',
        text: isJapanese
          ? '「AI Phone Repair & Deco Master」で自分だけのスマホを作ったよ！'
          : 'I just repaired and decorated my own phone in AI Phone Repair & Deco Master!',
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

  const handlePhoneInteraction = (e) => {
    if (gameState === 'cleaning') {
      triggerHaptic();
      playTap();
      const newProgress = progress + 10;
      if (newProgress >= 100) {
        setProgress(0);
        setGameState('fixing');
      } else {
        setProgress(newProgress);
      }
    } else if (gameState === 'fixing') {
      triggerHaptic();
      playTap();
      const newProgress = progress + 10;
      if (newProgress >= 100) {
        setProgress(0);
        setGameState('deco');
        playSuccess();
      } else {
        setProgress(newProgress);
      }
    } else if (gameState === 'deco' && selectedTool === 'sticker') {
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
    }
  };

  if (!lang) return <div className="spinner"></div>;

  return (
    <div className="game-container">
      {/* PHONE ASSET LAYER */}
      <div className="phone-wrapper" onClick={handlePhoneInteraction}>
        {/* Damaged Phone */}
        <Image
          src="/phone_damaged.png"
          alt="Damaged Phone"
          fill
          className="phone-image"
          style={{
            opacity: gameState === 'cleaning' || (gameState === 'fixing' && progress <= 50) || gameState === 'welcome' ? 1 : 0,
            transition: 'opacity 0.5s ease',
            transform: gameState === 'cleaning' ? `scale(${1 + progress / 500})` : 'scale(1)',
            zIndex: 1
          }}
        />

        {/* Clean Phone base */}
        <Image
          src="/phone_clean.png"
          alt="Clean Phone"
          fill
          className="phone-image"
          style={{
            opacity: gameState === 'fixing' && progress > 50 || gameState === 'deco' || gameState === 'done' ? 1 : 0,
            transition: 'opacity 0.5s ease',
            zIndex: 2,
            filter: bodyColor !== 'transparent' ? `drop-shadow(0 20px 50px rgba(0,0,0,0.5)) opacity(0.8) drop-shadow(0 0 0 ${bodyColor})` : undefined
          }}
        />

        {/* Color Overlay for Deco */}
        {(gameState === 'deco' || gameState === 'done') && bodyColor !== 'transparent' && (
          <div style={{
            position: 'absolute', top: 18, left: 16, right: 16, bottom: 18,
            borderRadius: 36,
            backgroundColor: bodyColor,
            mixBlendMode: 'overlay',
            opacity: 0.6,
            zIndex: 3,
            pointerEvents: 'none'
          }}></div>
        )}

        {/* Stickers Layer */}
        {(gameState === 'deco' || gameState === 'done') && stickers.map(s => (
          <div key={s.id} className={`sticker sticker-${s.type}`} style={{ left: s.x, top: s.y }}></div>
        ))}

        {/* Interaction hint overlay */}
        {(gameState === 'cleaning' || gameState === 'fixing') && (
          <div className="interaction-layer"></div>
        )}
      </div>

      {/* UI OVERLAY LAYER */}
      <div className="ui-overlay">

        {/* WELCOME SCREEN */}
        {gameState === 'welcome' && (
          <div className="status-panel">
            <h2>{isJapanese ? '修理の依頼が届いています' : 'Repair Request Received'}</h2>
            <p>{isJapanese ? '画面がバキバキのスマホ...' : 'Effectively smashed screen...'}</p>
            <button className="action-btn" onClick={handleStart}>
              {isJapanese ? '修理を開始する' : 'Start Repair'}
            </button>
          </div>
        )}

        {/* CLEANING PHASE */}
        {gameState === 'cleaning' && (
          <div className="status-panel">
            <h2>{isJapanese ? 'クリーニング中...' : 'Cleaning...'}</h2>
            <p>{isJapanese ? 'タップして汚れを落としましょう' : 'Tap to remove dirt'}</p>
            <div className="repair-progress">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {/* FIXING PHASE */}
        {gameState === 'fixing' && (
          <div className="status-panel">
            <h2>{isJapanese ? '修理中...' : 'Repairing...'}</h2>
            <p>{isJapanese ? '新しいパネルを装着します' : 'Installing new panel'}</p>
            <div className="repair-progress">
              <div className="progress-bar" style={{ width: `${progress}%`, background: '#4ADE80' }}></div>
            </div>
          </div>
        )}

        {/* DECO PHASE */}
        {gameState === 'deco' && (
          <div className="status-panel">
            <h2>{isJapanese ? 'デコレーション' : 'Decoration Time!'}</h2>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
              <button
                onClick={() => setSelectedTool('color')}
                className="action-btn"
                style={{ background: selectedTool === 'color' ? '#fff' : 'rgba(255,255,255,0.1)', color: selectedTool === 'color' ? '#000' : '#fff', padding: '0.5rem 1rem' }}
              >
                🎨 Color
              </button>
              <button
                onClick={() => setSelectedTool('sticker')}
                className="action-btn"
                style={{ background: selectedTool === 'sticker' ? '#fff' : 'rgba(255,255,255,0.1)', color: selectedTool === 'sticker' ? '#000' : '#fff', padding: '0.5rem 1rem' }}
              >
                ✨ Sticker
              </button>
            </div>

            {selectedTool === 'color' && (
              <div className="palette">
                {COLORS.map(c => (
                  <div
                    key={c}
                    className={`color-swatch ${bodyColor === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => { setBodyColor(c); playTap(); }}
                  />
                ))}
              </div>
            )}

            {selectedTool === 'sticker' && (
              <p style={{ fontSize: '0.8rem' }}>
                {isJapanese ? '画面をタップしてスタンプ！' : 'Tap screen to stamp!'}
              </p>
            )}

            <button className="action-btn" style={{ marginTop: '1rem', background: '#4ADE80' }} onClick={() => { setGameState('done'); playSuccess(); }}>
              {isJapanese ? '完成！' : 'Finish!'}
            </button>
          </div>
        )}

        {/* DONE PHASE */}
        {gameState === 'done' && (
          <div className="status-panel">
            <h2>{isJapanese ? '修理完了！' : 'Repair Complete!'}</h2>

            <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
              <button className="action-btn" style={{ background: '#38BDF8', color: '#fff' }} onClick={handleShare}>
                {isJapanese ? 'シェアする' : 'Share'}
              </button>
              <button className="action-btn" onClick={() => {
                setGameState('welcome');
                setProgress(0);
                setStickers([]);
                setBodyColor('transparent');
              }}>
                {isJapanese ? '次へ' : 'Next'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
