const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

console.log(`
=====================================================
🌌 ALCORD - 24/7 Headless Host Controller Starting
=====================================================
`);

// 1. Start the local Express web server (server.js)
console.log('📡 Launching Express Web Server...');
const webServer = spawn('node', ['server.js']);

webServer.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) console.log(`[Web Server] ${text}`);
});

webServer.stderr.on('data', (data) => {
    console.error(`[Web Server Error] ${data.toString().trim()}`);
});

// 2. Start Puppeteer in headless mode to open ALCORD and act as the permanent Host
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
