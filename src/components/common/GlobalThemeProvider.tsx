import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { AppTheme, DensityMode, DisplayScaleMode, SystemPreferences, DEFAULT_SYSTEM_PREFERENCES } from '../../types/systemPreferences';
import { PreviewScaleOverlayGuide } from './PreviewScaleOverlayGuide';

export interface SmartFitResult {
  scalePercentage: number;
  scaleMode: DisplayScaleMode;
  targetResolution: string;
  currentResolution: string;
  comparisonRatio: number;
  detectedScreenType: string;
  description: string;
}

export const calculateSmartFit = (
  width: number = typeof window !== 'undefined' ? window.innerWidth : 1440,
  height: number = typeof window !== 'undefined' ? window.innerHeight : 900
): SmartFitResult => {
  const standardWidth = 1920;
  const standardHeight = 1080;
  const rawRatio = width / standardWidth;

  let scalePercentage: number;
  let scaleMode: DisplayScaleMode;
  let detectedScreenType: string;
  let description: string;

  if (width >= 2560) {
    scalePercentage = 110;
    scaleMode = '110';
    detectedScreenType = 'Màn hình 2K (1440p) / 4K UHD';
    description = 'Phóng lớn 110% để tối ưu kích thước chữ và độ dễ đọc trên màn hình độ phân giải siêu cao.';
  } else if (width >= 1800) {
    scalePercentage = 100;
    scaleMode = '100';
    detectedScreenType = 'Full HD 1080p Chuẩn (1920×1080)';
    description = 'Tỷ lệ 100% gốc chuẩn doanh nghiệp, hiển thị nguyên bản toàn bộ thanh công cụ và bảng dữ liệu.';
  } else if (width >= 1500) {
    scalePercentage = 95;
    scaleMode = '95';
    detectedScreenType = 'Laptop 15.6" / Màn hình 1600×900';
    description = 'Thu gọn nhẹ 95% (tỷ lệ 0.95x so với 1080p) giúp bảng dữ liệu hiển thị gọn gàng, tránh cuộn ngang.';
  } else if (width >= 1300) {
    scalePercentage = 85;
    scaleMode = '85';
    detectedScreenType = 'Laptop 13" - 14" (1366×768 / 1440×900)';
    description = 'Tối ưu 85% so với chuẩn Full HD 1920×1080, giữ các nút thao tác và bộ lọc trên cùng một hàng.';
  } else if (width >= 1050) {
    scalePercentage = 80;
    scaleMode = '80';
    detectedScreenType = 'Tablet ngang / Màn hình phụ HD (1280×720)';
    description = 'Thu gọn 80% (tỷ lệ 0.8x so với 1080p) để hiển thị đầy đủ bảng phân hệ mà không bị cắt góc.';
  } else {
    scalePercentage = 75;
    scaleMode = '75';
    detectedScreenType = 'Cửa sổ chia đôi / Thiết bị màn hình hẹp';
    description = 'Thu gọn tối đa 75% để ngăn chặn tràn viền và bảo đảm tính năng tương tác không bị che khuất.';
  }

  return {
    scalePercentage,
    scaleMode,
    targetResolution: `${standardWidth} × ${standardHeight} (Full HD Benchmark)`,
    currentResolution: `${width} × ${height} px`,
    comparisonRatio: Math.round(rawRatio * 100) / 100,
    detectedScreenType,
    description,
  };
};

interface ThemeContextType {
  theme: AppTheme;
  effectiveTheme: 'light-theme' | 'cool-dark' | 'warm-sepia';
  density: DensityMode;
  displayScaleMode: DisplayScaleMode;
  previewScaleMode: DisplayScaleMode | null;
  isPreviewingScale: boolean;
  effectiveScalePercentage: number;
  deviceResolution: { width: number; height: number; dpr: number };
  preferences: SystemPreferences;
  setTheme: (theme: AppTheme) => void;
  setDensity: (density: DensityMode) => void;
  setDisplayScaleMode: (scale: DisplayScaleMode) => void;
  setPreviewScaleMode: (scale: DisplayScaleMode | null) => void;
  commitPreviewScale: () => void;
  cancelPreviewScale: () => void;
  applySmartFit: () => SmartFitResult;
  updatePreferences: (updater: (prev: SystemPreferences) => SystemPreferences) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useGlobalTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useGlobalTheme must be used within a GlobalThemeProvider');
  }
  return context;
};

interface GlobalThemeProviderProps {
  children: React.ReactNode;
  initialPreferences?: SystemPreferences;
  onPreferencesChange?: (prefs: SystemPreferences) => void;
}

export const GlobalThemeProvider: React.FC<GlobalThemeProviderProps> = ({
  children,
  initialPreferences,
  onPreferencesChange,
}) => {
  const [preferences, setPreferences] = useState<SystemPreferences>(() => {
    try {
      const explicitScale = localStorage.getItem('nexussync_display_scale');
      const savedNexus = localStorage.getItem('nexus_system_preferences');
      const savedNexusSync = localStorage.getItem('nexussync_system_preferences');
      const raw = savedNexusSync || savedNexus;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (explicitScale) {
          parsed.displayScaleMode = explicitScale;
        }
        return { ...DEFAULT_SYSTEM_PREFERENCES, ...parsed };
      }
      if (explicitScale) {
        return { ...DEFAULT_SYSTEM_PREFERENCES, displayScaleMode: explicitScale as DisplayScaleMode };
      }
    } catch {}
    return initialPreferences || DEFAULT_SYSTEM_PREFERENCES;
  });

  const [previewScaleMode, setPreviewScaleMode] = useState<DisplayScaleMode | null>(null);

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [windowDimensions, setWindowDimensions] = useState<{ width: number; height: number; dpr: number }>(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      };
    }
    return { width: 1440, height: 900, dpr: 1 };
  });

  // Track window resize with debounced state to adapt scale dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timeoutId: any = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
          dpr: window.devicePixelRatio || 1,
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const effectiveTheme = useMemo((): 'light-theme' | 'cool-dark' | 'warm-sepia' => {
    if (preferences.autoThemeMode === 'system') {
      return systemIsDark ? 'cool-dark' : 'light-theme';
    }
    if (preferences.theme === 'light') {
      return 'light-theme';
    }
    return preferences.theme;
  }, [preferences.autoThemeMode, preferences.theme, systemIsDark]);

  // Compute effective scale percentage based on preview or active setting or auto resolution
  const effectiveScalePercentage = useMemo(() => {
    const activeMode = previewScaleMode || preferences.displayScaleMode || 'auto';
    if (activeMode === 'auto') {
      const { width } = windowDimensions;
      // High-resolution / wide screen
      if (width >= 1920) return 100;
      // Standard 1080p full width
      if (width >= 1600) return 95;
      // Laptop standard / medium screen (e.g. 1440px / 1366px with scaling)
      if (width >= 1380) return 90;
      // Narrow laptop / tablet landscape (1200px - 1380px)
      if (width >= 1180) return 85;
      // Netbook / split window (< 1180px)
      if (width >= 960) return 80;
      return 75;
    }
    const parsed = parseInt(activeMode, 10);
    return isNaN(parsed) ? 100 : parsed;
  }, [previewScaleMode, preferences.displayScaleMode, windowDimensions]);

  const updatePreferences = useCallback((updater: (prev: SystemPreferences) => SystemPreferences) => {
    setPreferences((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('nexus_system_preferences', JSON.stringify(next));
        localStorage.setItem('nexussync_system_preferences', JSON.stringify(next));
        if (next.displayScaleMode) {
          localStorage.setItem('nexussync_display_scale', next.displayScaleMode);
        }
      } catch {}
      if (onPreferencesChange) {
        onPreferencesChange(next);
      }
      return next;
    });
  }, [onPreferencesChange]);

  const setTheme = useCallback((theme: AppTheme) => {
    updatePreferences((prev) => ({ ...prev, theme }));
  }, [updatePreferences]);

  const setDensity = useCallback((density: DensityMode) => {
    updatePreferences((prev) => ({ ...prev, density }));
  }, [updatePreferences]);

  const setDisplayScaleMode = useCallback((displayScaleMode: DisplayScaleMode) => {
    updatePreferences((prev) => ({ ...prev, displayScaleMode }));
  }, [updatePreferences]);

  const commitPreviewScale = useCallback(() => {
    if (previewScaleMode) {
      setDisplayScaleMode(previewScaleMode);
      setPreviewScaleMode(null);
    }
  }, [previewScaleMode, setDisplayScaleMode]);

  const cancelPreviewScale = useCallback(() => {
    setPreviewScaleMode(null);
  }, []);

  const applySmartFit = useCallback((): SmartFitResult => {
    const result = calculateSmartFit(windowDimensions.width, windowDimensions.height);
    updatePreferences((prev) => ({ ...prev, displayScaleMode: result.scaleMode }));
    return result;
  }, [windowDimensions.width, windowDimensions.height, updatePreferences]);

  // Synchronize CSS class, zoom, and theme on document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light-theme', 'cool-dark', 'warm-sepia', 'dark');
    if (effectiveTheme === 'cool-dark') {
      root.classList.add('cool-dark', 'dark');
    } else if (effectiveTheme === 'warm-sepia') {
      root.classList.add('warm-sepia');
    } else {
      root.classList.add('light-theme');
    }

    root.classList.remove('density-compact', 'density-cozy', 'density-spaced');
    root.classList.add(`density-${preferences.density}`);

    // Apply CSS Scale / Zoom for multi-device resolution scaling
    const scaleRatio = effectiveScalePercentage / 100;
    const activeMode = previewScaleMode || preferences.displayScaleMode || 'auto';
    root.style.setProperty('--app-scale', scaleRatio.toString());
    root.style.setProperty('--app-scale-pct', `${effectiveScalePercentage}%`);
    root.setAttribute('data-scale-pct', effectiveScalePercentage.toString());
    root.setAttribute('data-scale-mode', activeMode);
    root.setAttribute('data-scale-previewing', previewScaleMode ? 'true' : 'false');
  }, [effectiveTheme, preferences.density, preferences.displayScaleMode, previewScaleMode, effectiveScalePercentage]);

  const value = useMemo(
    () => ({
      theme: preferences.theme,
      effectiveTheme,
      density: preferences.density,
      displayScaleMode: preferences.displayScaleMode || 'auto',
      previewScaleMode,
      isPreviewingScale: previewScaleMode !== null,
      effectiveScalePercentage,
      deviceResolution: windowDimensions,
      preferences,
      setTheme,
      setDensity,
      setDisplayScaleMode,
      setPreviewScaleMode,
      commitPreviewScale,
      cancelPreviewScale,
      applySmartFit,
      updatePreferences,
    }),
    [
      preferences,
      effectiveTheme,
      previewScaleMode,
      effectiveScalePercentage,
      windowDimensions,
      setTheme,
      setDensity,
      setDisplayScaleMode,
      setPreviewScaleMode,
      commitPreviewScale,
      cancelPreviewScale,
      applySmartFit,
      updatePreferences,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <PreviewScaleOverlayGuide />
    </ThemeContext.Provider>
  );
};

