/// <reference types="vite/client" />

// Расширяем глобальный интерфейс Window, чтобы TypeScript "видел" наш API
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, data: any) => void;
        on: (channel: string, func: (...args: any[]) => void) => (() => void) | undefined;
      };
      windowControls: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
    };
  }
}

// Пустой экспорт, чтобы файл считался модулем
export {};