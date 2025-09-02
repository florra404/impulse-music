import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'node:path';
import url from 'node:url';

// --- Конфигурация для ES Modules ---
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon.ico'), // Убедитесь, что иконка существует
    webPreferences: {
      // Подключаем preload-скрипт для безопасного моста между Electron и React
      preload: path.join(__dirname, 'preload.js'),
    },
    width: 1280,
    height: 720,
  });

  // Загружаем URL Vite в режиме разработки или index.html в режиме продакшена
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // Открываем DevTools в режиме разработки
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  // --- ЛОГИКА АВТО-ОБНОВЛЕНИЙ ---
  // Запускаем проверку обновлений, как только окно будет готово к показу
  win.once('ready-to-show', () => {
    if (!app.isPackaged) {
        console.log('Проверка обновлений отключена в режиме разработки.');
    } else {
        autoUpdater.checkForUpdatesAndNotify();
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.whenReady().then(createWindow);

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
