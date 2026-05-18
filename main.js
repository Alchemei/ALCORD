const { app, BrowserWindow, ipcMain, session, desktopCapturer, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let isQuitting = false;

function createWindow () {
  mainWindow = new BrowserWindow({
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

  // Kapatma butonuna basıldığında uygulamayı kapatmak yerine tepsiye gizleyelim
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Görev çubuğundan gizleme ayarları
  mainWindow.on('show', () => {
    mainWindow.setSkipTaskbar(false);
  });
  mainWindow.on('hide', () => {
    mainWindow.setSkipTaskbar(true);
  });

  // Özel başlık çubuğu (titlebar) için IPC dinleyicileri
  ipcMain.on('window-min', () => mainWindow.minimize());
  ipcMain.on('window-max', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => {
    mainWindow.hide(); // Tepsiye küçült
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'ALCORD\'u Aç', 
      click: () => {
        mainWindow.show();
      } 
    },
    { type: 'separator' },
    { 
      label: 'Çıkış', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('ALCORD P2P');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// Global Kısayol IPC Kayıt Dinleyicisi
ipcMain.on('register-hotkeys', (event, { micShortcut, deafenShortcut }) => {
  globalShortcut.unregisterAll();
  
  if (micShortcut) {
    try {
      globalShortcut.register(micShortcut, () => {
        if (mainWindow) mainWindow.webContents.send('toggle-mute-global');
      });
      console.log('Registered global mic shortcut:', micShortcut);
    } catch (e) {
      console.error('Failed to register global mic shortcut:', e);
    }
  }
  
  if (deafenShortcut) {
    try {
      globalShortcut.register(deafenShortcut, () => {
        if (mainWindow) mainWindow.webContents.send('toggle-deafen-global');
      });
      console.log('Registered global deafen shortcut:', deafenShortcut);
    } catch (e) {
      console.error('Failed to register global deafen shortcut:', e);
    }
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
