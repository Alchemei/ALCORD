const { app, BrowserWindow, ipcMain, session, desktopCapturer } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, 'icon.png'), // Özel pencere ve görev çubuğu logosu
    frame: false, // İşletim sisteminin varsayılan pencere çerçevesini kapatır
    webPreferences: {
      nodeIntegration: true, // HTML içinden require('electron') kullanımına izin verir
      contextIsolation: false
    }
  });

  // Ekran Paylaşım İsteklerini Yakalayıp Ana Ekranı Otomatik Seçelim
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      if (sources.length > 0) {
        callback({ video: sources[0] });
      } else {
        callback(new Error('Ekran kaynağı bulunamadı.'));
      }
    }).catch((err) => {
      console.error(err);
      callback(err);
    });
  });

  mainWindow.loadFile('index.html');

  // Özel başlık çubuğu (titlebar) için IPC dinleyicileri
  ipcMain.on('window-min', () => mainWindow.minimize());
  ipcMain.on('window-max', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow.close());
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
