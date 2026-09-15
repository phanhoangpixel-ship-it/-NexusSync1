import React, { createContext, useContext, useState, useEffect } from 'react';

interface SystemClockContextType {
  systemTime: Date;
  formattedTime: string;
  isSynced: boolean;
  refreshTime: () => Promise<void>;
}

const SystemClockContext = createContext<SystemClockContextType>({
  systemTime: new Date(),
  formattedTime: '',
  isSynced: false,
  refreshTime: async () => {},
});

export const SystemClockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemTime, setSystemTime] = useState<Date>(new Date());
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const fetchServerTime = async () => {
    try {
      const res = await fetch('/api/system-time');
      if (res.ok) {
        const data = await res.json();
        if (data.iso) {
          const serverDate = new Date(data.iso);
          const delta = serverDate.getTime() - Date.now();
          setSystemTime(new Date(Date.now() + delta));
          setIsSynced(true);
          return;
        }
      }
    } catch (e) {
      // fallback
    }
    setSystemTime(new Date());
    setIsSynced(false);
  };

  useEffect(() => {
    fetchServerTime();
    const syncInterval = setInterval(fetchServerTime, 60000);
    const tickInterval = setInterval(() => {
      setSystemTime((prev) => new Date(prev.getTime() + 1000));
    }, 1000);

    return () => {
      clearInterval(syncInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const formattedTime = systemTime.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <SystemClockContext.Provider value={{ systemTime, formattedTime, isSynced, refreshTime: fetchServerTime }}>
      {children}
    </SystemClockContext.Provider>
  );
};

export const useSystemClock = () => useContext(SystemClockContext);
