import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || dismissed) return null;

  // Desktop / Android install button
  if (deferredPrompt) {
    return (
      <div
        id="pwa-install-banner"
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-900/40 border border-blue-700/60 text-blue-200 text-xs shadow-xs transition hover:bg-blue-800/50"
      >
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 font-medium cursor-pointer"
          title="Cài đặt NexusSync ERP dưới dạng ứng dụng độc lập trên thiết bị"
        >
          <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Cài ứng dụng ERP</span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-0.5 text-blue-400 hover:text-white rounded transition"
          title="Đóng thông báo"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // iOS Safari Guide trigger
  if (isIOS) {
    return (
      <>
        <div
          id="pwa-install-banner-ios"
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs shadow-xs"
        >
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 font-medium cursor-pointer"
            title="Hướng dẫn cài đặt ứng dụng trên iPhone/iPad"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Cài đặt iOS</span>
          </button>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-slate-800 border border-slate-700 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <h3 className="text-sm font-semibold text-white">Cài đặt NexusSync ERP trên iOS</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 space-y-2.5 text-xs text-slate-300">
                <p>1. Nhấn vào biểu tượng <strong>Chia sẻ (Share)</strong> trên thanh công cụ Safari.</p>
                <p>2. Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.</p>
                <p>3. Xác nhận tên ứng dụng và nhấn <strong>Thêm (Add)</strong> để dùng ngoại tuyến.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
