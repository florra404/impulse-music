import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'node:path';
import url from 'node:url';

// --- Конфигурация для ES Modules, чтобы __dirname работал корректно ---
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Устанавливаем пути для режима разработки и собранного приложения
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon.ico'),
    // --- ГЛАВНЫЕ ИЗМЕНЕНИЯ: Создаем окно без стандартной рамки ---
    frame: false,
    titleBarStyle: 'hidden', // Для лучшей совместимости, особенно на macOS

    webPreferences: {
      // Подключаем preload-скрипт для безопасного моста между Electron и React
      preload: path.join(__dirname, 'preload.js'),
    },
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
  });

  // Загружаем URL Vite в режиме разработки или index.html в режиме продакшена
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // Открываем инструменты разработчика только в режиме разработки
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  // --- ЛОГИКА АВТО-ОБНОВЛЕНИЙ ---
  // Запускаем проверку обновлений, как только окно будет готово к показу
  win.once('ready-to-show', () => {
    // Проверяем обновления только в собранном приложении, а не в режиме разработки
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    } else {
        console.log('Проверка обновлений отключена в режиме разработки.');
    }
  });
}

// Выход из приложения, когда все окна закрыты (кроме macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

// Создаем окно, когда приложение готово
app.whenReady().then(createWindow);

// --- ОБРАБОТЧИКИ ДЛЯ НОВЫХ КНОПОК УПРАВЛЕНИЯ ОКНОМ ---
// Эти обработчики "слушают" команды, отправленные из React через preload.ts

// Свернуть окно
ipcMain.on('minimize-window', () => {
  win?.minimize();
});

// Развернуть/Восстановить окно
ipcMain.on('maximize-window', () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

// Закрыть окно
ipcMain.on('close-window', () => {
  win?.close();
});


// --- Обработчики событий от autoUpdater ---

// Когда обновление найдено и начинается загрузка
autoUpdater.on('update-available', () => {
  win?.webContents.send('update_available');
});

// Когда обновление успешно скачано
autoUpdater.on('update-downloaded', () => {
  win?.webContents.send('update_downloaded');
});

// Получаем команду от React (из окна уведомления), чтобы перезапустить приложение
ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

