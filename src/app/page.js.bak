'use client';

import { useState, useEffect } from 'react';
import { Device } from '@capacitor/device';

export default function Home() {
  const [lang, setLang] = useState(null);

  useEffect(() => {
    async function checkLanguage() {
      try {
        // Attempt to get language from Capacitor (Native)
        const info = await Device.getLanguageCode();
        console.log('Capacitor Language:', info.value);
        setLang(info.value);
      } catch (e) {
        // Fallback to Web API if Capacitor plugin fails or is not available (e.g. in browser dev)
        console.log('Capacitor detection failed, using navigator:', e);
        setLang(navigator.language);
      }
    }
    checkLanguage();
  }, []);

  // Simple logic: if strictly 'ja' or starts with 'ja-'
  const isJapanese = lang && (lang.toLowerCase() === 'ja' || lang.toLowerCase().startsWith('ja-'));

  if (!lang) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>{isJapanese ? 'こんにちは！' : 'Hello World!'}</h1>
        <p>
          {isJapanese
            ? 'あなたの端末の言語設定を検出しました。'
            : 'Detected your device language setting.'}
        </p>
        <div className="status-badge">
          <span>Code: {lang}</span>
        </div>
      </div>
    </div>
  );
}
