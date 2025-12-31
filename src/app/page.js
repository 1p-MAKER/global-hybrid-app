'use client';

import { useState, useEffect } from 'react';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import Image from 'next/image';
import { useSound } from './hooks/useSound';

export default function Home() {
  const [lang, setLang] = useState(null);
  const [gameState, setGameState] = useState('welcome'); // welcome, cleaning, fixing, done
  const [progress, setProgress] = useState(0);
  const { playTap, playSuccess } = useSound();

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
      // Ignore if haptics not available
    }
  };

  const handleStart = () => {
    setGameState('cleaning');
    setProgress(0);
  };

  const handlePhoneInteraction = () => {
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
        setProgress(100);
        setGameState('done');
        playSuccess();
      } else {
        setProgress(newProgress);
      }
    }
  };

  if (!lang) return <div className="spinner"></div>;

  return (
    <div className="game-container">
      {/* PHONE ASSET LAYER */}
      <div className="phone-wrapper" onClick={handlePhoneInteraction}>
        {/* Damaged Phone - Visible primarily during welcome & cleaning */}
        <Image
          src="/phone_damaged.png"
          alt="Damaged Phone"
          fill
          className="phone-image"
          style={{
            opacity: gameState === 'done' || (gameState === 'fixing' && progress > 50) ? 0 : 1,
            transition: 'opacity 0.5s ease',
            transform: gameState === 'cleaning' ? `scale(${1 + progress / 500})` : 'scale(1)',
            zIndex: 1
          }}
        />

        {/* Clean Phone - Fades in during fixing/done */}
        <Image
          src="/phone_clean.png"
          alt="Clean Phone"
          fill
          className="phone-image"
          style={{
            opacity: gameState === 'done' || (gameState === 'fixing' && progress > 50) ? 1 : 0,
            transition: 'opacity 0.5s ease',
            zIndex: 2
          }}
        />

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

        {/* DONE PHASE */}
        {gameState === 'done' && (
          <div className="status-panel">
            <h2>{isJapanese ? '修理完了！' : 'Repair Complete!'}</h2>
            <p className="status-badge" style={{ display: 'inline-flex', marginTop: '0.5rem' }}>
              ✨ Perfect!
            </p>
            <div style={{ marginTop: '1rem' }}>
              <button className="action-btn" onClick={() => {
                setGameState('welcome');
                setProgress(0);
              }}>
                {isJapanese ? '次の依頼へ' : 'Next Request'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
