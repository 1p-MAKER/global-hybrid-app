'use client';

import { useRef, useEffect } from 'react';

/**
 * useSound Hook
 * Currently uses Web Audio API to generate synthetic sounds (placeholders).
 * REPLACE implementation inside playFunction with real audio file playback later.
 */
export function useSound() {
    const audioContextRef = useRef(null);

    useEffect(() => {
        // Initialize AudioContext on first user interaction is best practice,
        // but here we init lazily in functions.
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const getContext = () => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioContextRef.current = new AudioContext();
            }
        }
        return audioContextRef.current;
    };

    const playTap = () => {
        const ctx = getContext();
        if (!ctx) return;

        // Placeholder: Simple "Tick" sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    };

    const playSuccess = () => {
        const ctx = getContext();
        if (!ctx) return;

        // Placeholder: "Tada" like ascending sound
        const now = ctx.currentTime;
        [440, 554, 659].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);

            gain.gain.setValueAtTime(0.2, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    };

    const playScrub = () => {
        const ctx = getContext();
        if (!ctx) return;

        // Create white noise buffer
        const bufferSize = ctx.sampleRate * 0.1; // 0.1 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter to make it sound more like scrubbing (lowpass)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
    };

    return { playTap, playSuccess, playScrub };
}
