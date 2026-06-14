const { app, BrowserWindow, ipcMain, session, desktopCapturer, Tray, Menu, globalShortcut } = require('electron');
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
  if (process.platform !== 'win32') {
    console.log('[ALCORD] Non-Windows platform detected. Skipping keylistener.exe spawn.');
    return;
  }
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

function convertToAccelerator(hotkey) {
  if (!hotkey || !hotkey.key) return null;
  let parts = [];
  if (hotkey.ctrlKey) parts.push('CommandOrControl');
  if (hotkey.altKey) parts.push('Alt');
  if (hotkey.shiftKey) parts.push('Shift');
  
  let keyName = hotkey.key;
  if (keyName === ' ') keyName = 'Space';
  else if (keyName === 'Control') return null;
  else if (keyName === 'Alt') return null;
  else if (keyName === 'Shift') return null;
  else if (keyName === 'Meta') return null;
  else if (keyName === 'Pause') keyName = 'Pause';
  else if (keyName === 'ScrollLock') keyName = 'ScrollLock';
  else if (keyName === 'PrintScreen') keyName = 'PrintScreen';
  else if (keyName === 'CapsLock') keyName = 'Capslock';
  else if (keyName === 'NumLock') keyName = 'Numlock';
  else if (keyName === 'Insert') keyName = 'Insert';
  else if (keyName === 'Delete') keyName = 'Delete';
  else if (keyName === 'Home') keyName = 'Home';
  else if (keyName === 'End') keyName = 'End';
  else if (keyName === 'PageUp') keyName = 'PageUp';
  else if (keyName === 'PageDown') keyName = 'PageDown';
  else if (keyName === 'ArrowUp') keyName = 'Up';
  else if (keyName === 'ArrowDown') keyName = 'Down';
  else if (keyName === 'ArrowLeft') keyName = 'Left';
  else if (keyName === 'ArrowRight') keyName = 'Right';
  else if (keyName.length === 1) keyName = keyName.toUpperCase();
  
  parts.push(keyName);
  return parts.join('+');
}

// Global Kısayol IPC Kayıt Dinleyicisi
ipcMain.on('register-hotkeys', (event, { hotkeyMic, hotkeyDeafen }) => {
  currentMicHotkey = hotkeyMic;
  currentDeafenHotkey = hotkeyDeafen;
  
  let micSuccess = true;
  let deafenSuccess = true;
  
  if (process.platform !== 'win32') {
    try {
      globalShortcut.unregisterAll();
    } catch (err) {
      console.error('[ALCORD] Error unregistering global shortcuts:', err);
    }
    
    const micAcc = convertToAccelerator(hotkeyMic);
    if (micAcc) {
      try {
        const registered = globalShortcut.register(micAcc, () => {
          if (mainWindow) mainWindow.webContents.send('toggle-mute-global');
        });
        micSuccess = registered;
        console.log(`[ALCORD] Global shortcut registered for Mic: ${micAcc} -> ${registered}`);
      } catch (err) {
        console.error('[ALCORD] Failed to register global shortcut for Mic:', err);
        micSuccess = false;
      }
    }
    
    const deafenAcc = convertToAccelerator(hotkeyDeafen);
    if (deafenAcc) {
      try {
        const registered = globalShortcut.register(deafenAcc, () => {
          if (mainWindow) mainWindow.webContents.send('toggle-deafen-global');
        });
        deafenSuccess = registered;
        console.log(`[ALCORD] Global shortcut registered for Deafen: ${deafenAcc} -> ${registered}`);
      } catch (err) {
        console.error('[ALCORD] Failed to register global shortcut for Deafen:', err);
        deafenSuccess = false;
      }
    }
  } else {
    console.log('Registered global hotkeys via C# Hook:', { currentMicHotkey, currentDeafenHotkey });
  }
  
  event.reply('hotkey-register-status', {
    mic: { shortcut: hotkeyMic ? hotkeyMic.key : null, success: micSuccess },
    deafen: { shortcut: hotkeyDeafen ? hotkeyDeafen.key : null, success: deafenSuccess }
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
  if (process.platform !== 'win32') {
    try {
      globalShortcut.unregisterAll();
    } catch (err) {
      console.error('[ALCORD] Error during unregisterAll on quit:', err);
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
