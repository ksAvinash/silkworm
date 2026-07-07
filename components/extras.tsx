'use client';

import { useEffect } from 'react';

/** Registers the PWA service worker (production builds only). */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
    navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {});
  }, []);
  return null;
}

/**
 * Stops the scroll wheel from silently changing a focused number input —
 * an accidental scroll on the booking form must not turn 500 into 5,000.
 */
export function NumberInputWheelGuard() {
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement &&
        target.type === 'number' &&
        document.activeElement === target
      ) {
        event.preventDefault();
        target.blur();
      }
    };
    document.addEventListener('wheel', onWheel, { passive: false });
    return () => document.removeEventListener('wheel', onWheel);
  }, []);
  return null;
}
