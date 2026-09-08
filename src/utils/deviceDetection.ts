export type UserPlatform = 'android' | 'ios' | 'desktop';

/**
 * Detect client device operating system for native wallet pass routing
 */
export function detectUserPlatform(): UserPlatform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';

  // Android detection (e.g. Xiaomi, Samsung, Motorola, Pixel)
  if (/android/i.test(ua)) {
    return 'android';
  }

  // iOS detection (iPhone, iPad, iPod, or iPadOS on modern Safari)
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }

  return 'desktop';
}
