import { contextBridge, ipcRenderer } from 'electron';

// contextBridge — это безопасный способ "пробросить" функции из мира Node.js (Electron)
// в мир браузера (ваше React-приложение). Мы создаем глобальный объект `window.electron`.
contextBridge.exposeInMainWorld('electron', {
  // Функции для межпроцессного взаимодействия, используются для авто-обновлений
  ipcRenderer: {
    // Отправка сообщения из React в Electron (например, 'restart_app')
    send: (channel: string, data: any) => {
      // Список разрешенных каналов для отправки для безопасности
      const validChannels = ['restart_app'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    // Получение сообщения в React из Electron (например, 'update_downloaded')
    on: (channel: string, func: (...args: any[]) => void) => {
      // Список разрешенных каналов для получения для безопасности
      const validChannels = ['update_available', 'update_downloaded'];
      if (validChannels.includes(channel)) {
        // Создаем обертку для функции, чтобы безопасно передать аргументы
        const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => func(...args);
        ipcRenderer.on(channel, subscription);
        
        // Возвращаем функцию для отписки, чтобы избежать утечек памяти в React
        return () => ipcRenderer.removeListener(channel, subscription);
      }
    },
  },
  
  // Новый, специальный API для управления окном без рамки
  windowControls: {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
  }
});

