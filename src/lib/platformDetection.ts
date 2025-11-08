export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
export const isAndroid = () => /Android/.test(navigator.userAgent);
export const isMobile = () => /iPhone|iPad|iPod|Android/.test(navigator.userAgent);

// Platform-specific styles
export const getPlatformStyles = () => ({
  borderRadius: isIOS() ? '12px' : '8px',
  shadow: isIOS() ? 'shadow-lg' : 'shadow-md',
  haptic: (isIOS() ? 'ios' : 'android') as 'ios' | 'android'
});

// Trigger haptic feedback (if available)
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30;
    navigator.vibrate(duration);
  }
};
