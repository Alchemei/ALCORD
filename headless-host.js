const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
=====================================================
🌌 ALCORD - 24/7 Headless Host Controller Starting
=====================================================
`);

// 1. Storage Configuration for Host Archiving
const ARCHIVE_FILE = path.join(__dirname, 'room-archive.json');

/**
 * Loads the chat history archive from disk.
 * Returns empty array if file does not exist or is corrupted.
 */
function loadArchive() {
    try {
        if (!fs.existsSync(ARCHIVE_FILE)) {
            fs.writeFileSync(ARCHIVE_FILE, '[]', 'utf8');
            return [];
        }
        const data = fs.readFileSync(ARCHIVE_FILE, 'utf8').trim();
        if (!data) return [];
        return JSON.parse(data);
    } catch (e) {
        console.error('[Archive Error] JSON file is corrupted or failed to read, recovering with empty array:', e);
        return [];
    }
}

/**
 * Saves the archive array atomically to disk using a temp file.
 */
function saveArchive(archive) {
    const tmpFile = ARCHIVE_FILE + '.tmp';
    try {
        const json = JSON.stringify(archive, null, 2);
        // Atomic write: write to temp file then rename/replace
        fs.writeFileSync(tmpFile, json, 'utf8');
        fs.renameSync(tmpFile, ARCHIVE_FILE);
        return true;
    } catch (e) {
        console.error('[Archive Error] Atomic write failed:', e);
        if (fs.existsSync(tmpFile)) {
            try { fs.unlinkSync(tmpFile); } catch(err){}
        }
        return false;
    }
}

/**
 * Appends a single message to the archive. Prevents duplicate storage.
 */
function appendMessageToArchive(msg) {
    if (!msg || (!msg.id && !msg.messageId)) return false;
    const msgId = msg.id || msg.messageId;
    const archive = loadArchive();
    
    // Check for duplicate messages
    const exists = archive.some(m => (m.id || m.messageId) === msgId);
    if (exists) {
        return false;
    }
    
    archive.push(msg);
    const success = saveArchive(archive);
    if (success) {
        console.log(`[Archive] Successfully archived message ${msgId} from ${msg.senderName || 'Anonymous'}.`);
    }
    return success;
}

/**
 * Retrieves the last N messages from the archive.
 */
function getRecentMessages(limit) {
    const archive = loadArchive();
    if (!limit || limit <= 0) return archive;
    return archive.slice(-limit);
}

// 2. Start the local Express web server (server.js)
console.log('📡 Launching Express Web Server...');
const webServer = spawn('node', ['server.js']);

webServer.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) console.log(`[Web Server] ${text}`);
});

webServer.stderr.on('data', (data) => {
    console.error(`[Web Server Error] ${data.toString().trim()}`);
});

// 3. Start Puppeteer in headless mode to open ALCORD and act as the permanent Host
setTimeout(async () => {
    console.log('\n🚀 Starting headless browser engine (Chromium)...');
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-fake-ui-for-media-stream',      // Automatically grant mic/camera permissions
                '--use-fake-device-for-media-stream',  // Use fake audio/video streams for WebRTC
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Expose Node archiving functions to browser context prior to navigation
        await page.exposeFunction('loadArchiveNode', () => {
            return loadArchive();
        });
        await page.exposeFunction('saveArchiveNode', (archive) => {
            return saveArchive(archive);
        });
        await page.exposeFunction('appendMessageToArchiveNode', (msg) => {
            return appendMessageToArchive(msg);
        });
        await page.exposeFunction('getRecentMessagesNode', (limit) => {
            return getRecentMessages(limit);
        });

        console.log('[Headless Host] Exposed Node FS archive functions to page context.');

        // Redirect browser console logs to the Node.js terminal for easy debugging
        page.on('console', msg => {
            console.log(`[Browser Console] ${msg.text()}`);
        });

        console.log('🌐 Navigating to ALCORD Web App...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        console.log('💾 Initializing Server Configuration in LocalStorage...');
        await page.evaluate(() => {
            // Configure the headless bot's profile
            localStorage.setItem('os_username', 'ALCORD_SERVER_BOT');
            localStorage.setItem('os_peer_id', 'alcord_srv_yr0p1m1'); // Use the fixed Server Peer ID
            
            // Set the bot's server name and icon if desired
            localStorage.setItem('os_my_server_name', 'ALCORD Topluluk Ağı');
            localStorage.setItem('os_my_server_virtual_id', 'alcord_srv_yr0p1m1');
            
            console.log('[Headless Host] LocalStorage state initialized.');
        });

        // Reload the page to apply the newly configured LocalStorage Peer ID
        console.log('🔄 Reloading page to register fixed Server Peer ID...');
        await page.reload({ waitUntil: 'networkidle2' });

        // Trigger the Server Creation to put the bot in Hosting Mode
        console.log('👑 Launching ALCORD Server Engine...');
        await page.evaluate(() => {
            if (typeof createServer === 'function') {
                createServer();
                console.log('[Headless Host] createServer() triggered successfully.');
            } else {
                console.error('[Headless Host] Error: createServer function not found.');
            }
        });

        console.log('\n=====================================================');
        console.log('💚 ALCORD Sunucusu 24/7 ONLINE ve Host Ediliyor!');
        console.log('👉 Sunucu ID / Davet Kodu: alcord_srv_yr0p1m1');
        console.log('=====================================================\n');

    } catch (e) {
        console.error('❌ Error starting headless host browser:', e);
    }
}, 3000);
