const { app, BrowserWindow, ipcMain, session, desktopCapturer, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Profile isolation support for running multiple instances on the same machine
const profileArg = process.argv.find(arg => arg.startsWith('--profile='));
if (profileArg) {
  const profileName = profileArg.split('=')[1];
  try {
    const customUserDataPath = path.join(app.getPath('appData'), `ALCORD-${profileName}`);
    app.setPath('userData', customUserDataPath);
    console.log(`[ALCORD] Setting custom userData path to: ${customUserDataPath}`);
  } catch (err) {
    console.error('[ALCORD] Failed to set custom userData path:', err);
  }
}

let mainWindow;
let tray;
let isQuitting = false;
let keyListenerProcess = null;

let currentMicHotkey = null;
let currentDeafenHotkey = null;

function normalizeKeyName(csharpKey) {
  let k = csharpKey.toLowerCase();
  if (k === 'space') return ' ';
  if (k === 'scroll') return 'scrolllock';
  if (k === 'capital') return 'capslock';
  if (k === 'prior') return 'pageup';
  if (k === 'next') return 'pagedown';
  if (k === 'up') return 'arrowup';
  if (k === 'down') return 'arrowdown';
  if (k === 'left') return 'arrowleft';
  if (k === 'right') return 'arrowright';
  return k;
}

function matchesHotkey(pressed, hotkey) {
  if (!hotkey || !hotkey.key) return false;
  
  const pressedKey = normalizeKeyName(pressed.key);
  const hotkeyKey = hotkey.key.toLowerCase();
  
  const keyMatch = pressedKey === hotkeyKey;
  const ctrlMatch = pressed.ctrl === !!hotkey.ctrlKey;
  const altMatch = pressed.alt === !!hotkey.altKey;
  const shiftMatch = pressed.shift === !!hotkey.shiftKey;
  
  return keyMatch && ctrlMatch && altMatch && shiftMatch;
}

function startKeyListener() {
  const exePath = path.join(__dirname, 'keylistener.exe');
  keyListenerProcess = spawn(exePath);

  keyListenerProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Format: Key:M|Ctrl:False|Alt:True|Shift:False
      const match = line.match(/^Key:([^|]+)\|Ctrl:([^|]+)\|Alt:([^|]+)\|Shift:(.+)$/);
      if (match) {
        const pressed = {
          key: match[1],
          ctrl: match[2].toLowerCase() === 'true',
          alt: match[3].toLowerCase() === 'true',
          shift: match[4].toLowerCase() === 'true'
        };

        if (matchesHotkey(pressed, currentMicHotkey)) {
          if (mainWindow) mainWindow.webContents.send('toggle-mute-global');
        }
        if (matchesHotkey(pressed, currentDeafenHotkey)) {
          if (mainWindow) mainWindow.webContents.send('toggle-deafen-global');
        }
      }
    }
  });

  keyListenerProcess.stderr.on('data', (data) => {
    console.error('KeyListener error:', data.toString());
  });

  keyListenerProcess.on('close', (code) => {
    console.log(`KeyListener exited with code ${code}`);
    if (!isQuitting) {
      setTimeout(startKeyListener, 1000);
    }
  });
}

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
  // mainWindow.webContents.openDevTools();

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
ipcMain.on('register-hotkeys', (event, { hotkeyMic, hotkeyDeafen }) => {
  currentMicHotkey = hotkeyMic;
  currentDeafenHotkey = hotkeyDeafen;
  console.log('Registered global hotkeys via C# Hook:', { currentMicHotkey, currentDeafenHotkey });
  
  event.reply('hotkey-register-status', {
    mic: { shortcut: hotkeyMic ? hotkeyMic.key : null, success: true },
    deafen: { shortcut: hotkeyDeafen ? hotkeyDeafen.key : null, success: true }
  });
});

// Screen share capture sources handler
ipcMain.handle('get-screen-sources', async () => {
  const sources = await desktopCapturer.getSources({ 
    types: ['window', 'screen'], 
    thumbnailSize: { width: 300, height: 200 } 
  });
  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL()
  }));
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  startKeyListener();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  isQuitting = true;
  if (keyListenerProcess) {
    keyListenerProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
