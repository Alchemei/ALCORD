// DOM Elements
const workspaceBtn = document.getElementById('workspaceBtn');
const currentServerIcon = document.getElementById('currentServerIcon');
const currentServerName = document.getElementById('currentServerName');
const workspaceDropdown = document.getElementById('workspaceDropdown');
const serverList = document.getElementById('serverList');
const addServerBtn = document.getElementById('addServerBtn');
const goHomeBtn = document.getElementById('goHomeBtn');

const homePanel = document.getElementById('homePanel');
const homeServerListContainer = document.getElementById('homeServerListContainer');
const homeServerList = document.getElementById('homeServerList');
const channelPanel = document.getElementById('channelPanel');
const textChannelsList = document.getElementById('textChannelsList');
const voiceChannelsList = document.getElementById('voiceChannelsList');

const mainChatArea = document.getElementById('mainChatArea');
const currentChannelName = document.getElementById('currentChannelName');
const chatMessages = document.getElementById('chatMessages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const toggleMembersBtn = document.getElementById('toggleMembersBtn');

const membersPanel = document.getElementById('membersPanel');
const membersList = document.getElementById('membersList');
const onlineCount = document.getElementById('onlineCount');

const btnCreateServer = document.getElementById('btnCreateServer');
const joinServerIdInput = document.getElementById('joinServerIdInput');
const btnJoinServer = document.getElementById('btnJoinServer');
const closeServerModalBtn = document.getElementById('closeServerModalBtn');

const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const settingsUsernameInput = document.getElementById('settingsUsernameInput');
const settingsNoiseToggle = document.getElementById('settingsNoiseToggle');
const settingsGainSlider = document.getElementById('settingsGainSlider');
const settingsGainValue = document.getElementById('settingsGainValue');
const settingsMyId = document.getElementById('settingsMyId');
const myUsernameDisplay = document.getElementById('myUsernameDisplay');
const activeVoicePanel = document.getElementById('activeVoicePanel');
const disconnectVoiceBtn = document.getElementById('disconnectVoiceBtn');
const activeVoiceChannelName = document.getElementById('activeVoiceChannelName');
const remoteAudiosContainer = document.getElementById('remoteAudiosContainer');

const micToggleBtn = document.getElementById('micToggleBtn');
const deafenToggleBtn = document.getElementById('deafenToggleBtn');

// Screen Sharing DOM Bindings
const shareScreenBtn = document.getElementById('shareScreenBtn');
const screenShareContainer = document.getElementById('screenShareContainer');
const screenShareUser = document.getElementById('screenShareUser');
const fullscreenScreenShareBtn = document.getElementById('fullscreenScreenShareBtn');
const closeScreenShareBtn = document.getElementById('closeScreenShareBtn');
const screenShareVideo = document.getElementById('screenShareVideo');

// State
let myId = '';
let myUsername = 'Kullanıcı';
let peer = null;

// Screen Sharing State
let localScreenStream = null;
let screenCalls = new Map(); // peerId -> call
let activeIncomingScreenCall = null; // call


// Multi-server state
let joinedServers = []; // Array of { id: String, name: String }

// Voice Toggles
let isMuted = false;
let isDeafened = false;

// Customizable Hotkeys
let hotkeyMic = { key: 'm', altKey: true, ctrlKey: false, shiftKey: false };
let hotkeyDeafen = { key: 'd', altKey: true, ctrlKey: false, shiftKey: false };
let tempHotkeyMic = null;
let tempHotkeyDeafen = null;

// Per-User Volumes
let localUserVolumes = new Map(); // peerId -> volume (float)

// Server State
let currentServerId = null; 
let isHost = false;
let connections = new Map(); 
let hostConnection = null; 

let activeServer = {
    id: '',
    name: '',
    channels: [],
    members: new Map() 
};

let activeTextChannelId = 'genel';
let activeVoiceChannelId = null;
let messages = []; 

// Voice State
let localStream = null;
let mediaConnections = new Map(); 

// Remote Web Audio State for high quality gain and volume boosting up to 500%
let remoteGainNodes = new Map(); // peerId -> GainNode
let remoteSources = new Map(); // peerId -> MediaStreamAudioSourceNode
let remoteRnnoiseNodes = new Map(); // peerId -> AudioWorkletNode

// RNNoise
let rnnoiseWasmBinary = null;
let rnnoiseReady = false;
let micGainNode = null;
let activeRnnoiseNode = null;
let activeAudioCtx = null;
let localAudioSource = null;
let localAudioDestination = null;

async function preloadRNNoise() {
    try {
        if (window.process && window.process.type) {
            // Electron environment - use safe direct filesystem loading
            const fs = window.require('fs');
            const path = window.require('path');
            const wasmPath = path.join(__dirname, 'rnnoise.wasm');
            const buffer = fs.readFileSync(wasmPath);
            
            // Explicitly copy bytes into a clean, unpooled, un-shared ArrayBuffer to prevent AudioWorklet cloning bugs
            const cleanArrayBuffer = new ArrayBuffer(buffer.length);
            const view = new Uint8Array(cleanArrayBuffer);
            for (let i = 0; i < buffer.length; i++) {
                view[i] = buffer[i];
            }
            
            rnnoiseWasmBinary = cleanArrayBuffer;
            rnnoiseReady = true;
            console.log('[RNNoise] WASM loaded successfully via Node FS.');
            return;
        }
        
        const wasmResponse = await fetch('rnnoise.wasm');
        rnnoiseWasmBinary = await wasmResponse.arrayBuffer();
        rnnoiseReady = true;
        console.log('[RNNoise] WASM loaded successfully via Fetch API.');
    } catch(e) {
        console.error('[RNNoise] Yüklenemedi:', e);
        rnnoiseReady = false;
    }
}
preloadRNNoise();

// Toast
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-lg shadow-2xl text-white font-medium text-[13px] transform transition-all duration-300 translate-y-10 opacity-0 flex items-center gap-3 backdrop-blur-md border`;
    
    if(type === 'success') { toast.classList.add('bg-[#111]', 'border-emerald-500/30', 'text-emerald-400'); }
    else if(type === 'error') { toast.classList.add('bg-[#111]', 'border-red-500/30', 'text-red-400'); }
    else if(type === 'warning') { toast.classList.add('bg-[#111]', 'border-yellow-500/30', 'text-yellow-400'); }
    else { toast.classList.add('bg-[#111]', 'border-[#333]', 'text-[#ededed]'); }
    
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function formatHotkey(hotkey) {
    if (!hotkey) return 'Atanmadı';
    const parts = [];
    if (hotkey.ctrlKey) parts.push('Ctrl');
    if (hotkey.altKey) parts.push('Alt');
    if (hotkey.shiftKey) parts.push('Shift');
    
    let keyName = hotkey.key;
    if (keyName === ' ') keyName = 'Space';
    else if (keyName.length === 1) keyName = keyName.toUpperCase();
    
    parts.push(keyName);
    return parts.join(' + ');
}

// Initialization
function initApp() {
    const savedId = localStorage.getItem('os_peer_id');
    if (savedId) {
        myId = savedId;
    } else {
        const randomString = Math.random().toString(36).substring(2, 8);
        myId = 'os_' + randomString;
        localStorage.setItem('os_peer_id', myId);
    }
    
    const savedName = localStorage.getItem('os_username');
    if(savedName) myUsername = savedName;
    myUsernameDisplay.textContent = myUsername;
    settingsMyId.textContent = myId;
    settingsUsernameInput.value = myUsername;

    // Load Joined Servers
    const rawServers = localStorage.getItem('os_joined_servers');
    if(rawServers) {
        try { joinedServers = JSON.parse(rawServers); } catch(e) { joinedServers = []; }
    } else { joinedServers = []; }

    // Load Volume Settings
    const rawVolumes = localStorage.getItem('os_volumes');
    if(rawVolumes) {
        try { localUserVolumes = new Map(JSON.parse(rawVolumes)); } catch(e) { localUserVolumes = new Map(); }
    } else { localUserVolumes = new Map(); }

    // Load RNNoise setting
    const savedNoise = localStorage.getItem('os_rnnoise_enabled');
    if (savedNoise !== null) {
        settingsNoiseToggle.checked = savedNoise === 'true';
    } else {
        settingsNoiseToggle.checked = true; // default enabled
    }

    // Load Hotkey Settings
    const rawMic = localStorage.getItem('os_hotkey_mic_obj');
    const rawDeafen = localStorage.getItem('os_hotkey_deafen_obj');
    if (rawMic) { try { hotkeyMic = JSON.parse(rawMic); } catch(e){} }
    if (rawDeafen) { try { hotkeyDeafen = JSON.parse(rawDeafen); } catch(e){} }
    
    // Update tooltip titles dynamically
    micToggleBtn.title = `Sustur (${formatHotkey(hotkeyMic)})`;
    deafenToggleBtn.title = `Sağırlaştır (${formatHotkey(hotkeyDeafen)})`;
    syncGlobalShortcuts();

    // Mute/Deafen buttons click handlers
    micToggleBtn.addEventListener('click', toggleMute);
    deafenToggleBtn.addEventListener('click', toggleDeafen);

    peer = new Peer(myId, {
        config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
    });

    peer.on('open', (id) => {
        const lastServer = localStorage.getItem('os_last_server');
        if(lastServer) joinServer(lastServer);
        else renderHome();
    });

    peer.on('connection', (conn) => {
        if(isHost) handleClientConnection(conn);
        else {
            conn.on('open', () => {
                conn.send({ type: 'error', message: 'Kullanıcı bir ağ hostlamıyor.' });
                setTimeout(() => conn.close(), 1000);
            });
        }
    });

    peer.on('call', (call) => {
        if(!activeVoiceChannelId) {
            call.close();
            return;
        }
        if (call.metadata && call.metadata.type === 'screen-share') {
            call.answer(); // Ekran paylaşımı için karşıya kendi sesimizi göndermiyoruz (çift ses olmasın)
        } else {
            call.answer(localStream);
        }
        setupRemoteMedia(call);
    });

    peer.on('disconnected', () => {
        showToast('Bağlantı koptu, tekrar deneniyor...', 'warning');
        peer.reconnect();
    });

    peer.on('error', (err) => {
        console.error('PeerJS Hatası:', err);
        if (err.type === 'peer-not-found' || err.type === 'unavailable-id') {
            showToast('Bağlantı başarısız: Hedef ağ bulunamadı veya çevrimdışı.', 'error');
            renderHome();
        } else {
            showToast('Ağ hatası: ' + err.message, 'error');
        }
    });
}

function saveJoinedServers() {
    localStorage.setItem('os_joined_servers', JSON.stringify(joinedServers));
}

function addJoinedServer(id, name) {
    if (!joinedServers.find(s => s.id === id)) {
        joinedServers.push({ id, name });
    } else {
        const s = joinedServers.find(s => s.id === id);
        if (s.name !== name) {
            s.name = name;
        }
    }
    saveJoinedServers();
}

function createServer() {
    isHost = true;
    currentServerId = myId;
    activeServer = {
        id: myId,
        name: `${myUsername}'in Ağı`,
        channels: [
            { id: 'genel', name: 'genel', type: 'text' },
            { id: 'tasarim', name: 'tasarım', type: 'text' },
            { id: 'genel_ses', name: 'Genel Toplantı', type: 'voice' }
        ],
        members: new Map()
    };
    activeServer.members.set(myId, { username: myUsername, voiceChannelId: null });
    connections.clear();
    messages = [];
    
    localStorage.setItem('os_last_server', myId);
    addJoinedServer(myId, activeServer.name);
    
    closeModal('serverModal');
    showToast('Ağ oluşturuldu.', 'success');
    renderServerView();
    broadcastServerState();
}

function handleClientConnection(conn) {
    conn.on('open', () => connections.set(conn.peer, conn));
    conn.on('data', (data) => {
        if (data.type === 'intro') {
            activeServer.members.set(conn.peer, { username: data.username, voiceChannelId: null });
            broadcastServerState();
            addSystemMessage(`${data.username} ağa katıldı.`, 'genel');
        } 
        else if (data.type === 'chat') {
            const msg = {
                channelId: data.channelId,
                senderId: conn.peer,
                senderName: activeServer.members.get(conn.peer)?.username || 'İsimsiz',
                text: data.text,
                time: data.time
            };
            messages.push(msg);
            broadcastMessageToAll(msg);
            if(activeTextChannelId === data.channelId) renderMessages();
        }
        else if (data.type === 'voice-state') {
            const member = activeServer.members.get(conn.peer);
            if(member) {
                member.voiceChannelId = data.channelId;
                broadcastServerState();
            }
        }
    });
    conn.on('close', () => {
        const member = activeServer.members.get(conn.peer);
        if(member) {
            addSystemMessage(`${member.username} ayrıldı.`, 'genel');
            activeServer.members.delete(conn.peer);
            connections.delete(conn.peer);
            broadcastServerState();
        }
    });
}

function broadcastServerState() {
    if(!isHost) return;
    const state = {
        type: 'server-state',
        name: activeServer.name,
        channels: activeServer.channels,
        members: Array.from(activeServer.members.entries()).map(([id, data]) => ({id, ...data}))
    };
    connections.forEach(conn => { if(conn.open) conn.send(state); });
    renderChannelPanel();
    renderMembers();
}

function broadcastMessageToAll(msg) {
    if(!isHost) return;
    connections.forEach(conn => { if(conn.open) conn.send({ type: 'message', ...msg }); });
}

function addSystemMessage(text, channelId) {
    const msg = {
        channelId: channelId,
        senderId: 'system',
        senderName: 'Sistem',
        text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    messages.push(msg);
    broadcastMessageToAll(msg);
    if(activeTextChannelId === channelId) renderMessages();
}

function joinServer(hostId) {
    if(hostId === myId) return createServer();
    if(hostConnection) hostConnection.close();
    
    isHost = false;
    currentServerId = hostId;
    messages = [];
    
    showToast('Ağa bağlanılıyor...', 'info');
    hostConnection = peer.connect(hostId, { reliable: true });

    hostConnection.on('open', () => {
        localStorage.setItem('os_last_server', hostId);
        closeModal('serverModal');
        hostConnection.send({ type: 'intro', username: myUsername });
        showToast('Bağlantı sağlandı.', 'success');
    });

    hostConnection.on('data', (data) => {
        if(data.type === 'server-state') {
            activeServer.name = data.name;
            activeServer.channels = data.channels;
            activeServer.members = new Map(data.members.map(m => [m.id, {username: m.username, voiceChannelId: m.voiceChannelId}]));
            
            addJoinedServer(currentServerId, data.name);

            if(!activeTextChannelId || !activeServer.channels.find(c => c.id === activeTextChannelId)) {
                const firstText = activeServer.channels.find(c => c.type === 'text');
                if(firstText) activeTextChannelId = firstText.id;
            }
            renderServerView();
        }
        else if (data.type === 'message') {
            messages.push(data);
            if(activeTextChannelId === data.channelId) renderMessages();
        }
        else if (data.type === 'error') {
            showToast(data.message, 'error');
            renderHome();
        }
    });

    hostConnection.on('error', (err) => {
        console.error('Ağ bağlantı hatası:', err);
        showToast('Ağ bağlantısı kurulamadı veya koptu.', 'error');
        renderHome();
    });

    hostConnection.on('close', () => {
        showToast('Ağ bağlantısı koptu.', 'error');
        renderHome();
    });
}

function sendChatMessage(text) {
    if(!activeTextChannelId || !currentServerId) return;
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    if(isHost) {
        const msg = { channelId: activeTextChannelId, senderId: myId, senderName: myUsername, text, time };
        messages.push(msg);
        broadcastMessageToAll(msg);
        renderMessages();
    } else if(hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'chat', channelId: activeTextChannelId, text, time });
    }
}

function updateVoiceState(channelId) {
    activeVoiceChannelId = channelId;
    if(isHost) {
        const member = activeServer.members.get(myId);
        if(member) member.voiceChannelId = channelId;
        broadcastServerState();
    } else if(hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'voice-state', channelId: channelId });
    }
}

async function applyRNNoiseProcessing(stream) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext({ sampleRate: 48000 });
    const source = audioCtx.createMediaStreamSource(stream);
    
    micGainNode = audioCtx.createGain();
    micGainNode.gain.value = parseFloat(settingsGainSlider.value);
    const destination = audioCtx.createMediaStreamDestination();
    
    if (rnnoiseReady && settingsNoiseToggle.checked) {
        try {
            let workletUrl = 'rnnoise-processor.js';
            if (window.process && window.process.type) {
                // Electron environment: Use Node FS to read processor code, convert to a Blob URL
                // to bypass Chromium's strict local file:// AudioWorklet loading restriction
                const fs = window.require('fs');
                const path = window.require('path');
                const workletPath = path.join(__dirname, 'rnnoise-processor.js');
                const code = fs.readFileSync(workletPath, 'utf8');
                const blob = new Blob([code], { type: 'application/javascript' });
                workletUrl = URL.createObjectURL(blob);
                console.log('[RNNoise] Worklet loaded via Blob URL successfully.');
            }
            
            await audioCtx.audioWorklet.addModule(workletUrl);
            activeRnnoiseNode = new AudioWorkletNode(
                audioCtx, 
                '@sapphi-red/web-noise-suppressor/rnnoise',
                { processorOptions: { maxChannels: 1, wasmBinary: rnnoiseWasmBinary } }
            );
            source.connect(micGainNode);
            micGainNode.connect(activeRnnoiseNode);
            activeRnnoiseNode.connect(destination);
            console.log('[RNNoise] Noise suppression activated successfully!');
        } catch(e) {
            console.error('[RNNoise] Worklet or Node failed to activate, falling back to clean mic:', e);
            source.connect(micGainNode);
            micGainNode.connect(destination);
        }
    } else {
        source.connect(micGainNode);
        micGainNode.connect(destination);
    }
    
    localAudioSource = source;
    localAudioDestination = destination;
    
    return { processedStream: destination.stream, audioCtx: audioCtx };
}

async function updateLocalAudioGraph() {
    if (!activeAudioCtx) return;
    
    // 1. Update local microphone audio graph
    if (localAudioSource && localAudioDestination) {
        try {
            try { localAudioSource.disconnect(); } catch(e){}
            if (micGainNode) { try { micGainNode.disconnect(); } catch(e){} }
            if (activeRnnoiseNode) {
                try {
                    activeRnnoiseNode.port.postMessage('destroy');
                    activeRnnoiseNode.disconnect();
                } catch(e) {}
                activeRnnoiseNode = null;
            }
            
            if (rnnoiseReady && settingsNoiseToggle.checked) {
                let workletUrl = 'rnnoise-processor.js';
                if (window.process && window.process.type) {
                    const fs = window.require('fs');
                    const path = window.require('path');
                    const workletPath = path.join(__dirname, 'rnnoise-processor.js');
                    const code = fs.readFileSync(workletPath, 'utf8');
                    const blob = new Blob([code], { type: 'application/javascript' });
                    workletUrl = URL.createObjectURL(blob);
                }
                
                await activeAudioCtx.audioWorklet.addModule(workletUrl);
                activeRnnoiseNode = new AudioWorkletNode(
                    activeAudioCtx, 
                    '@sapphi-red/web-noise-suppressor/rnnoise',
                    { processorOptions: { maxChannels: 1, wasmBinary: rnnoiseWasmBinary } }
                );
                
                localAudioSource.connect(micGainNode);
                micGainNode.connect(activeRnnoiseNode);
                activeRnnoiseNode.connect(localAudioDestination);
                console.log('[RNNoise] Local outgoing stream graph updated: Noise suppression ENABLED.');
            } else {
                localAudioSource.connect(micGainNode);
                micGainNode.connect(localAudioDestination);
                console.log('[RNNoise] Local outgoing stream graph updated: Noise suppression DISABLED.');
            }
        } catch (err) {
            console.error('[RNNoise] Dynamic local outgoing graph update failed:', err);
            try { localAudioSource.connect(micGainNode); } catch(e){}
            try { micGainNode.connect(localAudioDestination); } catch(e){}
        }
    }
    
    // 2. Dynamically update ALL active incoming remote peer stream graphs!
    mediaConnections.forEach(async (call, peerId) => {
        try {
            const source = remoteSources.get(peerId);
            const gainNode = remoteGainNodes.get(peerId);
            if (!source || !gainNode) return;
            
            // Disconnect old connections first
            try { source.disconnect(); } catch(e){}
            try { gainNode.disconnect(); } catch(e){}
            if (remoteRnnoiseNodes.has(peerId)) {
                const oldRnnoiseNode = remoteRnnoiseNodes.get(peerId);
                try {
                    oldRnnoiseNode.port.postMessage('destroy');
                    oldRnnoiseNode.disconnect();
                } catch(e){}
                remoteRnnoiseNodes.delete(peerId);
            }
            
            if (rnnoiseReady && settingsNoiseToggle.checked) {
                let workletUrl = 'rnnoise-processor.js';
                if (window.process && window.process.type) {
                    const fs = window.require('fs');
                    const path = window.require('path');
                    const workletPath = path.join(__dirname, 'rnnoise-processor.js');
                    const code = fs.readFileSync(workletPath, 'utf8');
                    const blob = new Blob([code], { type: 'application/javascript' });
                    workletUrl = URL.createObjectURL(blob);
                }
                
                await activeAudioCtx.audioWorklet.addModule(workletUrl);
                const remoteRnnoiseNode = new AudioWorkletNode(
                    activeAudioCtx, 
                    '@sapphi-red/web-noise-suppressor/rnnoise',
                    { processorOptions: { maxChannels: 1, wasmBinary: rnnoiseWasmBinary } }
                );
                
                source.connect(remoteRnnoiseNode);
                remoteRnnoiseNode.connect(gainNode);
                remoteRnnoiseNodes.set(peerId, remoteRnnoiseNode);
                console.log(`[RNNoise] Remote incoming peer ${peerId} stream graph updated: Noise suppression ENABLED.`);
            } else {
                source.connect(gainNode);
                console.log(`[RNNoise] Remote incoming peer ${peerId} stream graph updated: Noise suppression DISABLED.`);
            }
            
            gainNode.connect(activeAudioCtx.destination);
        } catch (err) {
            console.error(`[RNNoise] Dynamic remote incoming graph update failed for peer ${peerId}:`, err);
            // Fallback safety route
            try { source.connect(gainNode); } catch(e){}
            try { gainNode.connect(activeAudioCtx.destination); } catch(e){}
        }
    });
}

async function joinVoiceChannel(channelId) {
    leaveVoiceChannel();
    const channelInfo = activeServer.channels.find(c => c.id === channelId);
    if(!channelInfo) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false }
        });
        
        const { processedStream, audioCtx } = await applyRNNoiseProcessing(stream);
        localStream = processedStream;
        activeAudioCtx = audioCtx;
        
        updateVoiceState(channelId);
        activeVoicePanel.classList.remove('hidden');
        activeVoicePanel.classList.add('flex');
        activeVoiceChannelName.textContent = channelInfo.name;
        
        activeServer.members.forEach((member, peerId) => {
            if(peerId !== myId && member.voiceChannelId === channelId) {
                const call = peer.call(peerId, localStream);
                setupRemoteMedia(call);
            }
        });
        playTone('join');
    } catch(err) {
        showToast('Mikrofon erişimi reddedildi.', 'error');
    }
}

function leaveVoiceChannel() {
    if(!activeVoiceChannelId) return;
    if(localScreenStream) stopScreenShare();
    if(localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    if(activeRnnoiseNode) { activeRnnoiseNode.port.postMessage('destroy'); activeRnnoiseNode.disconnect(); activeRnnoiseNode = null; }
    
    // Clean up Web Audio peer nodes
    remoteGainNodes.forEach((node) => {
        try { node.disconnect(); } catch(e){}
    });
    remoteGainNodes.clear();
    remoteSources.forEach((node) => {
        try { node.disconnect(); } catch(e){}
    });
    remoteSources.clear();
    
    remoteRnnoiseNodes.forEach((node) => {
        try {
            node.port.postMessage('destroy');
            node.disconnect();
        } catch(e){}
    });
    remoteRnnoiseNodes.clear();

    if(activeAudioCtx) { activeAudioCtx.close(); activeAudioCtx = null; }
    micGainNode = null;
    localAudioSource = null;
    localAudioDestination = null;
    mediaConnections.forEach(call => call.close());
    mediaConnections.clear();
    remoteAudiosContainer.innerHTML = '';

    updateVoiceState(null);
    activeVoicePanel.classList.add('hidden');
    activeVoicePanel.classList.remove('flex');
    playTone('leave');
}

async function startScreenShare(sourceId = null) {
    if (!activeVoiceChannelId) return;
    if (localScreenStream) {
        stopScreenShare();
        return;
    }
    
    try {
        if (sourceId) {
            localScreenStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                        minWidth: 1280,
                        maxWidth: 1920,
                        minHeight: 720,
                        maxHeight: 1080
                    }
                }
            });
        } else {
            localScreenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false
            });
        }
        
        localScreenStream.getVideoTracks()[0].onended = () => {
            stopScreenShare();
        };

        screenShareVideo.srcObject = localScreenStream;
        screenShareUser.textContent = 'Ekranınızı Paylaşıyorsunuz';
        fullscreenScreenShareBtn.classList.add('hidden');
        screenShareContainer.classList.remove('hidden');
        screenShareContainer.classList.add('flex');
        
        shareScreenBtn.classList.remove('text-[#666]');
        shareScreenBtn.classList.add('text-blue-500', 'bg-white/[0.04]');

        activeServer.members.forEach((member, peerId) => {
            if (peerId !== myId && member.voiceChannelId === activeVoiceChannelId) {
                const call = peer.call(peerId, localScreenStream, { 
                    metadata: { type: 'screen-share', username: myUsername } 
                });
                screenCalls.set(peerId, call);
            }
        });
        
        showToast('Ekran paylaşımı başlatıldı.', 'success');
    } catch(err) {
        console.error("Ekran paylaşma hatası:", err);
        showToast('Ekran paylaşımı başlatılamadı.', 'error');
        localScreenStream = null;
    }
}

function stopScreenShare() {
    if (localScreenStream) {
        localScreenStream.getTracks().forEach(t => t.stop());
        localScreenStream = null;
    }
    
    screenCalls.forEach(call => call.close());
    screenCalls.clear();

    screenShareVideo.srcObject = null;
    screenShareContainer.classList.add('hidden');
    screenShareContainer.classList.remove('flex');
    
    shareScreenBtn.classList.add('text-[#666]');
    shareScreenBtn.classList.remove('text-blue-500', 'bg-white/[0.04]');
    
    showToast('Ekran paylaşımı sonlandırıldı.', 'info');
}

function setupRemoteMedia(call) {
    if (call.metadata && call.metadata.type === 'screen-share') {
        activeIncomingScreenCall = call;
        call.on('stream', (remoteStream) => {
            screenShareVideo.srcObject = remoteStream;
            screenShareUser.textContent = `${call.metadata.username || 'Birisi'} Ekranını Paylaşıyor`;
            fullscreenScreenShareBtn.classList.remove('hidden');
            screenShareContainer.classList.remove('hidden');
            screenShareContainer.classList.add('flex');
        });
        call.on('close', () => {
            if (activeIncomingScreenCall === call) {
                screenShareVideo.srcObject = null;
                screenShareContainer.classList.add('hidden');
                screenShareContainer.classList.remove('flex');
                activeIncomingScreenCall = null;
            }
        });
        return;
    }

    mediaConnections.set(call.peer, call);
    call.on('stream', (remoteStream) => {
        let audio = document.getElementById(`audio-${call.peer}`);
        if(!audio) {
            audio = document.createElement('audio');
            audio.id = `audio-${call.peer}`;
            audio.autoplay = true;
            audio.muted = true; // Mute the tag so Web Audio handles output without double audio!
            remoteAudiosContainer.appendChild(audio);
        }
        audio.srcObject = remoteStream;
        
        // Route remote stream through Web Audio GainNode for clean volume boosting (up to 500%)
        try {
            const ctx = activeAudioCtx;
            if (!ctx) {
                throw new Error('activeAudioCtx is not initialized yet');
            }
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            
            // Clean up existing nodes for this peer if any (e.g. on stream update/re-connection)
            if (remoteGainNodes.has(call.peer)) {
                try { remoteGainNodes.get(call.peer).disconnect(); } catch(e){}
                remoteGainNodes.delete(call.peer);
            }
            if (remoteSources.has(call.peer)) {
                try { remoteSources.get(call.peer).disconnect(); } catch(e){}
                remoteSources.delete(call.peer);
            }
            if (remoteRnnoiseNodes.has(call.peer)) {
                try { remoteRnnoiseNodes.get(call.peer).disconnect(); } catch(e){}
                remoteRnnoiseNodes.delete(call.peer);
            }
            
            const source = ctx.createMediaStreamSource(remoteStream);
            const gainNode = ctx.createGain();
            
            const userVol = localUserVolumes.get(call.peer) ?? 1.0;
            gainNode.gain.value = isDeafened ? 0 : userVol;
            
            if (rnnoiseReady && settingsNoiseToggle.checked) {
                try {
                    let workletUrl = 'rnnoise-processor.js';
                    if (window.process && window.process.type) {
                        const fs = window.require('fs');
                        const path = window.require('path');
                        const workletPath = path.join(__dirname, 'rnnoise-processor.js');
                        const code = fs.readFileSync(workletPath, 'utf8');
                        const blob = new Blob([code], { type: 'application/javascript' });
                        workletUrl = URL.createObjectURL(blob);
                    }
                    
                    await ctx.audioWorklet.addModule(workletUrl);
                    const remoteRnnoiseNode = new AudioWorkletNode(
                        ctx, 
                        '@sapphi-red/web-noise-suppressor/rnnoise',
                        { processorOptions: { maxChannels: 1, wasmBinary: rnnoiseWasmBinary } }
                    );
                    
                    source.connect(remoteRnnoiseNode);
                    remoteRnnoiseNode.connect(gainNode);
                    remoteRnnoiseNodes.set(call.peer, remoteRnnoiseNode);
                    console.log(`[RNNoise] Remote peer ${call.peer} stream routed through RNNoise!`);
                } catch(e) {
                    console.error(`[RNNoise] Remote peer ${call.peer} RNNoise setup failed, bypassing:`, e);
                    source.connect(gainNode);
                }
            } else {
                source.connect(gainNode);
            }
            
            gainNode.connect(ctx.destination);
            
            remoteSources.set(call.peer, source);
            remoteGainNodes.set(call.peer, gainNode);
        } catch (err) {
            console.error('[Web Audio] Uzak ses yönlendirilemedi, normale dönülüyor:', err);
            audio.muted = false; // Fallback: play directly through audio element
            const userVol = localUserVolumes.get(call.peer) ?? 1.0;
            audio.volume = isDeafened ? 0 : Math.min(1.0, userVol);
        }
    });
    
    call.on('close', () => {
        mediaConnections.delete(call.peer);
        const audio = document.getElementById(`audio-${call.peer}`);
        if(audio) audio.remove();
        
        // Clean up Web Audio peer nodes
        if (remoteGainNodes.has(call.peer)) {
            try { remoteGainNodes.get(call.peer).disconnect(); } catch(e){}
            remoteGainNodes.delete(call.peer);
        }
        if (remoteSources.has(call.peer)) {
            try { remoteSources.get(call.peer).disconnect(); } catch(e){}
            remoteSources.delete(call.peer);
        }
    });
}

function playTone(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if(type === 'join') {
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        } else {
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        }
        osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch(e){}
}

function switchServer(id) {
    if (id === currentServerId) return;
    
    if(hostConnection) {
        hostConnection.close();
        hostConnection = null;
    }
    leaveVoiceChannel();
    
    localStorage.setItem('os_last_server', id);
    joinServer(id);
}

function renderJoinedServersList() {
    serverList.innerHTML = '';
    homeServerList.innerHTML = '';
    
    if (joinedServers.length === 0) {
        serverList.innerHTML = `
            <div class="px-3 py-4 text-[11px] text-[#555] italic text-center">
                Henüz bir ağa katılmadınız.
            </div>
        `;
        homeServerListContainer.classList.add('hidden');
        homeServerListContainer.classList.remove('flex');
        return;
    }
    
    homeServerListContainer.classList.remove('hidden');
    homeServerListContainer.classList.add('flex');
    
    joinedServers.forEach(srv => {
        const isActive = currentServerId === srv.id;
        
        // 1. Dropdown Menü Listesi
        const btn = document.createElement('button');
        btn.className = `w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors text-[13px] group/srv ${
            isActive 
            ? 'bg-[#111] border border-[#1A1A1A] text-[#fff] font-medium' 
            : 'hover:bg-[#111]/50 text-[#888] hover:text-[#ededed]'
        }`;
        
        btn.innerHTML = `
            <div class="w-4 h-4 rounded bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-[9px] font-bold mr-3 shadow-[0_0_12px_rgba(147,51,234,0.4)] shrink-0">${srv.name.substring(0,1).toUpperCase()}</div>
            <span class="truncate flex-1 font-medium">${srv.name}</span>
            ${isActive ? '<i class="fa-solid fa-check text-blue-500 text-[10px] shrink-0 ml-2"></i>' : ''}
        `;
        
        if (!isActive) {
            btn.onclick = () => {
                workspaceDropdown.classList.add('opacity-0', '-translate-y-2');
                setTimeout(() => workspaceDropdown.classList.add('hidden'), 200);
                switchServer(srv.id);
            };
        }
        
        serverList.appendChild(btn);

        // 2. Ana Sayfa Hızlı Erişim Kartları
        const card = document.createElement('div');
        card.className = `glass-modal border border-white/[0.04] rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.015] hover:scale-[1.01] transition-all cursor-pointer group`;
        
        card.innerHTML = `
            <div class="flex items-center min-w-0 mr-4">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-[13px] font-bold mr-4 shadow-[0_0_15px_rgba(147,51,234,0.3)] shrink-0">${srv.name.substring(0,1).toUpperCase()}</div>
                <div class="min-w-0 flex flex-col text-left">
                    <span class="text-white text-[13px] font-semibold truncate">${srv.name}</span>
                    <span class="text-[#555] text-[10px] font-mono mt-0.5 truncate select-all">${srv.id}</span>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${isActive 
                    ? '<span class="text-[11px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Bağlı</span>'
                    : '<button class="text-[11px] text-blue-400 group-hover:text-blue-300 font-semibold bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/10 px-3 py-1 rounded-lg transition-colors">Bağlan</button>'
                }
            </div>
        `;
        
        if (!isActive) {
            card.onclick = () => switchServer(srv.id);
        }
        
        homeServerList.appendChild(card);
    });
}

function renderHome() {
    homePanel.classList.remove('hidden');
    channelPanel.classList.add('hidden');
    mainChatArea.classList.add('hidden');
    membersPanel.classList.add('hidden');
    currentServerId = null;
    isHost = false;
    
    currentServerIcon.innerHTML = `<i class="fa-solid fa-house"></i>`;
    currentServerIcon.className = "w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold mr-3 shadow-[0_0_12px_rgba(37,99,235,0.5)]";
    currentServerName.textContent = "Ana Sayfa";
    renderJoinedServersList();
}

function renderServerView() {
    homePanel.classList.add('hidden');
    channelPanel.classList.remove('hidden');
    mainChatArea.classList.remove('hidden');
    
    currentServerIcon.innerHTML = activeServer.name.substring(0, 1).toUpperCase();
    currentServerIcon.className = "w-5 h-5 rounded bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-[12px] font-bold mr-3 shadow-[0_0_12px_rgba(147,51,234,0.4)]";
    currentServerName.textContent = activeServer.name;
    
    // Set invite code and wire up copy button
    const sidebarInviteCode = document.getElementById('sidebarInviteCode');
    const sidebarCopyInviteBtn = document.getElementById('sidebarCopyInviteBtn');
    if (sidebarInviteCode) sidebarInviteCode.textContent = currentServerId;
    if (sidebarCopyInviteBtn) {
        sidebarCopyInviteBtn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(currentServerId);
            showToast('Ağ davet kodu kopyalandı.', 'success');
        };
    }
    
    renderJoinedServersList();
    renderChannelPanel();
    renderMembers();
    
    if(activeTextChannelId) {
        const ch = activeServer.channels.find(c => c.id === activeTextChannelId);
        if(ch) {
            currentChannelName.textContent = ch.name;
        }
        renderMessages();
    }
}

window.adjustUserVolume = function(peerId, value) {
    const volume = parseFloat(value);
    localUserVolumes.set(peerId, volume);
    localStorage.setItem('os_volumes', JSON.stringify(Array.from(localUserVolumes.entries())));
    
    // Set volume on remote Web Audio GainNode
    const gainNode = remoteGainNodes.get(peerId);
    if (gainNode) {
        gainNode.gain.value = isDeafened ? 0 : volume;
    }
    
    // Fallback for standard audio element volume (clamp between 0 and 1)
    const audio = document.getElementById(`audio-${peerId}`);
    if (audio) {
        audio.volume = isDeafened ? 0 : Math.min(1.0, volume);
    }
    
    // Update dynamic UI slider percentage text and icon
    const volText = document.getElementById(`vol-text-${peerId}`);
    if (volText) {
        volText.textContent = Math.round(volume * 100) + '%';
    }
    
    const volIcon = document.getElementById(`vol-icon-${peerId}`);
    if (volIcon) {
        volIcon.className = '';
        if (volume === 0 || isDeafened) {
            volIcon.className = 'fa-solid fa-volume-xmark text-[10px] text-red-500/80';
        } else if (volume < 0.5) {
            volIcon.className = 'fa-solid fa-volume-off text-[10px] text-[#555]';
        } else if (volume < 1.5) {
            volIcon.className = 'fa-solid fa-volume-low text-[10px] text-[#555]';
        } else {
            volIcon.className = 'fa-solid fa-volume-high text-[10px] text-blue-500';
        }
    }
};

function renderChannelPanel() {
    textChannelsList.innerHTML = '';
    voiceChannelsList.innerHTML = '';
    
    activeServer.channels.forEach(ch => {
        const div = document.createElement('div');
        if(ch.type === 'text') {
            div.className = `channel-item group flex items-center px-2 py-1.5 cursor-pointer ${activeTextChannelId === ch.id ? 'active' : 'text-[#888]'}`;
            div.innerHTML = `<span class="text-[#555] group-hover:text-[#888] font-mono mr-2 text-[13px] ${activeTextChannelId === ch.id ? 'text-[#888]' : ''}">#</span><span class="truncate font-medium text-[13px] tracking-wide">${ch.name}</span>`;
            div.onclick = () => { activeTextChannelId = ch.id; renderServerView(); };
            textChannelsList.appendChild(div);
        } else {
            div.className = `channel-item group flex flex-col px-2 py-1.5 cursor-pointer ${activeVoiceChannelId === ch.id ? 'active' : 'text-[#888]'}`;
            const header = document.createElement('div');
            header.className = 'flex items-center';
            header.innerHTML = `<i class="fa-solid fa-volume-low mr-2 text-[11px] text-[#555] group-hover:text-[#888] ${activeVoiceChannelId === ch.id ? 'text-[#888]' : ''}"></i><span class="truncate font-medium text-[13px] tracking-wide">${ch.name}</span>`;
            header.onclick = () => joinVoiceChannel(ch.id);
            div.appendChild(header);
            
            const usersInChannel = Array.from(activeServer.members.entries())
                .map(([id, m]) => ({ id, ...m }))
                .filter(u => u.voiceChannelId === ch.id);
            
            if(usersInChannel.length > 0) {
                const usersDiv = document.createElement('div');
                usersDiv.className = 'ml-5 mt-1.5 flex flex-col gap-1';
                usersInChannel.forEach(u => {
                    const isMe = u.id === myId;
                    const volume = localUserVolumes.get(u.id) ?? 1.0;
                    
                    let initialIcon = 'fa-solid fa-volume-low text-[10px] text-[#555]';
                    if (volume === 0 || isDeafened) {
                        initialIcon = 'fa-solid fa-volume-xmark text-[10px] text-red-500/80';
                    } else if (volume < 0.5) {
                        initialIcon = 'fa-solid fa-volume-off text-[10px] text-[#555]';
                    } else if (volume >= 1.5) {
                        initialIcon = 'fa-solid fa-volume-high text-[10px] text-blue-500';
                    }

                    usersDiv.innerHTML += `
                        <div class="flex items-center justify-between text-[12px] text-[#888] group/voice-user py-0.5 select-none">
                            <div class="flex items-center min-w-0 flex-1">
                                <div class="w-4 h-4 rounded-full bg-[#222] border border-[#333] flex items-center justify-center mr-2 text-[8px] text-[#aaa] font-bold shrink-0">${u.username.substring(0,1).toUpperCase()}</div>
                                <span class="truncate text-[#aaa] group-hover/voice-user:text-white transition-colors">${u.username}</span>
                            </div>
                            ${!isMe ? `
                            <div class="flex items-center gap-1.5 opacity-0 group-hover/voice-user:opacity-100 transition-all ml-2 shrink-0 pr-1">
                                <i class="${initialIcon}" id="vol-icon-${u.id}"></i>
                                <input type="range" min="0" max="5" step="0.1" value="${volume}" 
                                       class="w-14 h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400" 
                                       oninput="adjustUserVolume('${u.id}', this.value)" title="Ses Seviyesi">
                                <span class="text-[9px] font-mono text-slate-500 min-w-[28px] text-right" id="vol-text-${u.id}">${Math.round(volume * 100)}%</span>
                            </div>
                            ` : ''}
                        </div>
                    `;
                });
                div.appendChild(usersDiv);
            }
            voiceChannelsList.appendChild(div);
        }
    });
}

function renderMembers() {
    membersList.innerHTML = '';
    const membersArray = Array.from(activeServer.members.values());
    onlineCount.textContent = membersArray.length;
    
    membersArray.forEach(m => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2.5 px-2 py-1.5 hover:bg-[#111] rounded-lg cursor-pointer group';
        div.innerHTML = `
            <div class="w-6 h-6 rounded bg-[#222] border border-[#333] flex items-center justify-center text-[10px] text-[#aaa] font-bold shrink-0">
                ${m.username.substring(0,1).toUpperCase()}
            </div>
            <span class="font-medium text-[#aaa] group-hover:text-white truncate text-[13px]">${m.username}</span>
        `;
        membersList.appendChild(div);
    });
}

function renderMessages() {
    const channelMessages = messages.filter(m => m.channelId === activeTextChannelId);
    
    chatMessages.innerHTML = `
        <div class="mt-auto mb-6 px-2">
            <h1 class="text-2xl font-bold text-[#ededed] mb-1 tracking-tight">Kanal: ${activeTextChannelId}</h1>
            <p class="text-[13px] text-[#666]">Burası iletişimin başladığı nokta.</p>
        </div>
    `;

    channelMessages.forEach(msg => {
        const div = document.createElement('div');
        if(msg.senderId === 'system') {
            div.className = 'flex items-center gap-2 px-2 mt-2';
            div.innerHTML = `
                <div class="w-1 h-3 bg-emerald-500/50 rounded-full"></div>
                <span class="text-[#666] text-[12px]">${msg.text}</span>
            `;
        } else {
            div.className = 'flex gap-3 mt-4 hover:bg-[#111]/50 px-2 py-1 rounded-lg';
            
            let messageContentHtml = '';
            if (msg.file) {
                const f = msg.file;
                const sizeStr = f.size > 1024 * 1024 
                    ? (f.size / (1024 * 1024)).toFixed(1) + ' MB'
                    : (f.size / 1024).toFixed(1) + ' KB';
                    
                if (f.type.startsWith('image/')) {
                    messageContentHtml = `
                        <div class="mt-2 group relative max-w-[280px] rounded-xl overflow-hidden border border-white/[0.06] shadow-md bg-black/20 hover:border-white/[0.15] transition-all">
                            <img src="${f.data}" class="w-full h-auto max-h-[220px] object-cover cursor-zoom-in" onclick="openImageModal('${f.data}')">
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                                <span class="text-[11px] text-slate-300 truncate mr-2">${f.name}</span>
                                <a href="${f.data}" download="${f.name}" class="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors shadow">
                                    <i class="fa-solid fa-arrow-down text-[10px]"></i>
                                </a>
                            </div>
                        </div>
                    `;
                } else {
                    messageContentHtml = `
                        <div class="mt-2 flex items-center gap-3.5 p-3 rounded-xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03] transition-all max-w-[340px] shadow-sm">
                            <div class="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <i class="fa-regular fa-file-lines text-lg"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-[13px] font-medium text-[#ededed] truncate" title="${f.name}">${f.name}</div>
                                <div class="text-[11px] text-[#666] mt-0.5">${sizeStr}</div>
                            </div>
                            <a href="${f.data}" download="${f.name}" class="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-400 transition-all border border-white/[0.06] shrink-0 shadow-inner">
                                <i class="fa-solid fa-arrow-down text-[12px]"></i>
                            </a>
                        </div>
                    `;
                }
            } else {
                messageContentHtml = `<div class="text-[#aaa] break-words whitespace-pre-wrap text-[14px] leading-relaxed font-light">${msg.text}</div>`;
            }

            div.innerHTML = `
                <div class="w-8 h-8 rounded bg-[#1A1A1A] border border-[#222] flex items-center justify-center text-[12px] text-[#aaa] font-bold mt-0.5 shrink-0">
                    ${msg.senderName.substring(0,1).toUpperCase()}
                </div>
                <div class="flex flex-col min-w-0">
                    <div class="flex items-baseline gap-2 mb-0.5">
                        <span class="font-medium text-[#ededed] text-[13px] cursor-pointer">${msg.senderName}</span>
                        <span class="text-[11px] text-[#555]">${msg.time}</span>
                    </div>
                    ${messageContentHtml}
                </div>
            `;
        }
        chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ---------------- EVENT LISTENERS ----------------

goHomeBtn.addEventListener('click', () => {
    if(currentServerId) {
        joinedServers = joinedServers.filter(s => s.id !== currentServerId);
        saveJoinedServers();
    }
    localStorage.removeItem('os_last_server');
    if(hostConnection) hostConnection.close();
    leaveVoiceChannel();
    renderHome();
    
    workspaceDropdown.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => workspaceDropdown.classList.add('hidden'), 200);
});

addServerBtn.addEventListener('click', () => {
    document.getElementById('workspaceDropdown').classList.add('hidden');
    openModal('serverModal');
});
closeServerModalBtn.addEventListener('click', () => closeModal('serverModal'));
btnCreateServer.addEventListener('click', createServer);

btnJoinServer.addEventListener('click', () => {
    const id = joinServerIdInput.value.trim();
    if(id) joinServer(id);
});

toggleMembersBtn.addEventListener('click', () => membersPanel.classList.toggle('hidden'));

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if(text) { sendChatMessage(text); messageInput.value = ''; }
});

const btnShortcutMic = document.getElementById('btnShortcutMic');
const btnShortcutDeafen = document.getElementById('btnShortcutDeafen');

function setupHotkeyRecorder(btn, isMic) {
    btn.onclick = (e) => {
        e.preventDefault();
        
        btn.textContent = 'Tuşa basın...';
        btn.className = "min-w-[120px] bg-blue-600/10 text-blue-400 border border-blue-500 px-4 py-2 rounded-lg text-center font-mono text-[12px] transition-all focus:outline-none shadow-[0_0_12px_rgba(59,130,246,0.25)] select-none";
        
        const recordHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
                return;
            }
            
            const hotkeyObj = {
                key: event.key,
                code: event.code,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey
            };
            
            if (isMic) {
                tempHotkeyMic = hotkeyObj;
                btn.textContent = formatHotkey(tempHotkeyMic);
            } else {
                tempHotkeyDeafen = hotkeyObj;
                btn.textContent = formatHotkey(tempHotkeyDeafen);
            }
            
            btn.className = "min-w-[120px] bg-black text-[#ededed] border border-[#333] hover:border-[#444] px-4 py-2 rounded-lg text-center font-mono text-[12px] transition-all focus:outline-none focus:border-blue-500 shadow-inner select-none";
            
            window.removeEventListener('keydown', recordHandler, true);
        };
        
        window.addEventListener('keydown', recordHandler, true);
    };
}

setupHotkeyRecorder(btnShortcutMic, true);
setupHotkeyRecorder(btnShortcutDeafen, false);

settingsBtn.addEventListener('click', () => {
    settingsUsernameInput.value = myUsername;
    
    // Reset temp keys and set current display text
    tempHotkeyMic = null;
    tempHotkeyDeafen = null;
    btnShortcutMic.textContent = formatHotkey(hotkeyMic);
    btnShortcutDeafen.textContent = formatHotkey(hotkeyDeafen);
    
    openModal('settingsModal');
});

closeSettingsModalBtn.addEventListener('click', () => closeModal('settingsModal'));

saveSettingsBtn.addEventListener('click', () => {
    const newName = settingsUsernameInput.value.trim();
    if(newName && newName !== myUsername) {
        myUsername = newName;
        localStorage.setItem('os_username', myUsername);
        myUsernameDisplay.textContent = myUsername;
        if(isHost) {
            const member = activeServer.members.get(myId);
            if(member) member.username = myUsername;
            broadcastServerState();
        } else if(hostConnection && hostConnection.open) {
            hostConnection.send({ type: 'intro', username: myUsername });
        }
    }
    
    // Save Customizable Shortcuts
    if (tempHotkeyMic) {
        hotkeyMic = tempHotkeyMic;
        localStorage.setItem('os_hotkey_mic_obj', JSON.stringify(hotkeyMic));
        micToggleBtn.title = `Sustur (${formatHotkey(hotkeyMic)})`;
    }
    if (tempHotkeyDeafen) {
        hotkeyDeafen = tempHotkeyDeafen;
        localStorage.setItem('os_hotkey_deafen_obj', JSON.stringify(hotkeyDeafen));
        deafenToggleBtn.title = `Sağırlaştır (${formatHotkey(hotkeyDeafen)})`;
    }
    // Save RNNoise Toggle
    localStorage.setItem('os_rnnoise_enabled', settingsNoiseToggle.checked);
    updateLocalAudioGraph();

    syncGlobalShortcuts();

    if(micGainNode) micGainNode.gain.value = parseFloat(settingsGainSlider.value);
    closeModal('settingsModal');
    showToast('Ayarlar kaydedildi.', 'success');
});

settingsGainSlider.addEventListener('input', (e) => {
    settingsGainValue.textContent = parseFloat(e.target.value).toFixed(1) + 'x';
    if(micGainNode) micGainNode.gain.value = parseFloat(e.target.value);
});

disconnectVoiceBtn.addEventListener('click', leaveVoiceChannel);

shareScreenBtn.addEventListener('click', () => {
    openScreenPicker();
});

closeScreenShareBtn.addEventListener('click', () => {
    if (localScreenStream) {
        stopScreenShare();
    } else {
        screenShareContainer.classList.add('hidden');
        screenShareContainer.classList.remove('flex');
        if (activeIncomingScreenCall) {
            activeIncomingScreenCall.close();
            activeIncomingScreenCall = null;
        }
    }
});

fullscreenScreenShareBtn.addEventListener('click', () => {
    if (screenShareVideo) {
        if (screenShareVideo.requestFullscreen) {
            screenShareVideo.requestFullscreen();
        } else if (screenShareVideo.webkitRequestFullscreen) {
            screenShareVideo.webkitRequestFullscreen();
        } else if (screenShareVideo.msRequestFullscreen) {
            screenShareVideo.msRequestFullscreen();
        }
    }
});

// Modal Helpers
function openModal(id) {
    const modal = document.getElementById(id);
    const inner = document.getElementById(id + 'Inner');
    if (!modal || !inner) return;
    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    inner.classList.remove('scale-95');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    const inner = document.getElementById(id + 'Inner');
    if (!modal || !inner) return;
    modal.classList.add('opacity-0');
    inner.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

// Workspace Dropdown handlers
workspaceBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if(workspaceDropdown.classList.contains('hidden')) {
        workspaceDropdown.classList.remove('hidden');
        void workspaceDropdown.offsetWidth;
        workspaceDropdown.classList.remove('opacity-0', '-translate-y-2');
    } else {
        workspaceDropdown.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => workspaceDropdown.classList.add('hidden'), 200);
    }
});

document.addEventListener('click', () => {
    workspaceDropdown.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => workspaceDropdown.classList.add('hidden'), 200);
});

workspaceDropdown.addEventListener('click', (e) => e.stopPropagation());

function toggleMute() {
    isMuted = !isMuted;
    
    if (localStream) {
        localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    }
    
    if (isMuted) {
        micToggleBtn.innerHTML = `<i class="fa-solid fa-microphone-slash text-[12px] text-red-500"></i>`;
        micToggleBtn.classList.add('bg-red-500/10');
        showToast('Mikrofon susturuldu.', 'warning');
    } else {
        micToggleBtn.innerHTML = `<i class="fa-solid fa-microphone text-[12px]"></i>`;
        micToggleBtn.classList.remove('bg-red-500/10');
        showToast('Mikrofon açıldı.', 'success');
    }
}

function toggleDeafen() {
    isDeafened = !isDeafened;
    
    // Update remote Web Audio gains
    remoteGainNodes.forEach((gainNode, peerId) => {
        const targetVolume = localUserVolumes.get(peerId) ?? 1.0;
        gainNode.gain.value = isDeafened ? 0 : targetVolume;
        
        // Update icons dynamically
        const volIcon = document.getElementById(`vol-icon-${peerId}`);
        if (volIcon) {
            volIcon.className = '';
            if (isDeafened || targetVolume === 0) {
                volIcon.className = 'fa-solid fa-volume-xmark text-[10px] text-red-500/80';
            } else if (targetVolume < 0.5) {
                volIcon.className = 'fa-solid fa-volume-off text-[10px] text-[#555]';
            } else if (targetVolume < 1.5) {
                volIcon.className = 'fa-solid fa-volume-low text-[10px] text-[#555]';
            } else {
                volIcon.className = 'fa-solid fa-volume-high text-[10px] text-blue-500';
            }
        }
    });
    
    remoteAudiosContainer.querySelectorAll('audio').forEach(audio => {
        const peerId = audio.id.replace('audio-', '');
        const targetVolume = localUserVolumes.get(peerId) ?? 1.0;
        audio.volume = isDeafened ? 0 : Math.min(1.0, targetVolume);
    });
    
    if (isDeafened) {
        deafenToggleBtn.innerHTML = `<i class="fa-solid fa-volume-xmark text-[12px] text-red-500"></i>`;
        deafenToggleBtn.classList.add('bg-red-500/10');
        showToast('Gelen sesler kapatıldı.', 'warning');
    } else {
        deafenToggleBtn.innerHTML = `<i class="fa-solid fa-headphones text-[12px]"></i>`;
        deafenToggleBtn.classList.remove('bg-red-500/10');
        showToast('Sesler açıldı.', 'success');
    }
}

function matchesHotkey(e, hotkey) {
    if (!hotkey) return false;
    
    // Ignore bare modifier key releases/presses
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return false;
    }
    
    const eKey = e.key.toLowerCase();
    const hKey = hotkey.key.toLowerCase();
    
    const keyMatch = (eKey === hKey) || (e.code.toLowerCase() === hKey);
    const altMatch = !!e.altKey === !!hotkey.altKey;
    const ctrlMatch = !!e.ctrlKey === !!hotkey.ctrlKey;
    const shiftMatch = !!e.shiftKey === !!hotkey.shiftKey;
    
    return keyMatch && altMatch && ctrlMatch && shiftMatch;
}

// Global hotkeys are now fully handled by the C# native global hook to prevent duplicates.

function convertToAccelerator(hotkey) {
    if (!hotkey || !hotkey.key) return null;
    let parts = [];
    if (hotkey.ctrlKey) parts.push('Ctrl');
    if (hotkey.altKey) parts.push('Alt');
    if (hotkey.shiftKey) parts.push('Shift');
    
    let keyName = hotkey.key;
    // Map standard DOM keys to Electron accelerators
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

function syncGlobalShortcuts() {
    if (window.process && window.process.type) {
        try {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('register-hotkeys', { hotkeyMic, hotkeyDeafen });
        } catch (e) {
            console.error('Failed to sync global shortcuts:', e);
        }
    }
}

function initElectronTitleBar() {
    const customTitleBar = document.getElementById('customTitleBar');
    if (window.process && window.process.type) {
        customTitleBar.classList.remove('hidden');
        try {
            const { ipcRenderer } = window.require('electron');
            document.getElementById('minBtn').addEventListener('click', () => ipcRenderer.send('window-min'));
            document.getElementById('maxBtn').addEventListener('click', () => ipcRenderer.send('window-max'));
            document.getElementById('closeBtn').addEventListener('click', () => ipcRenderer.send('window-close'));

            // Global Hotkeys IPC Listeners
            ipcRenderer.on('toggle-mute-global', () => {
                // If user is actively typing in a text field inside ALCORD, ignore the global shortcut trigger
                if (document.hasFocus() && document.activeElement && (
                    document.activeElement.tagName === 'INPUT' || 
                    document.activeElement.tagName === 'TEXTAREA' || 
                    document.activeElement.isContentEditable
                )) {
                    return;
                }
                toggleMute();
            });
            ipcRenderer.on('toggle-deafen-global', () => {
                // If user is actively typing in a text field inside ALCORD, ignore the global shortcut trigger
                if (document.hasFocus() && document.activeElement && (
                    document.activeElement.tagName === 'INPUT' || 
                    document.activeElement.tagName === 'TEXTAREA' || 
                    document.activeElement.isContentEditable
                )) {
                    return;
                }
                toggleDeafen();
            });

            ipcRenderer.on('hotkey-register-status', (event, status) => {
                console.log('Hotkey register status report:', status);
            });
        } catch(e) {
            console.error('Electron IPC bind error:', e);
        }
    }
}

initApp();
initElectronTitleBar();

// ---------------- DIRECT P2P FILE SHARING & IMAGE VIEWING ----------------
const plusBtn = document.querySelector('#messageForm button[type="button"]');
const chatFileInput = document.createElement('input');
chatFileInput.type = 'file';
chatFileInput.id = 'chatFileInput';
chatFileInput.className = 'hidden';
document.body.appendChild(chatFileInput);

if (plusBtn) {
    plusBtn.addEventListener('click', () => {
        chatFileInput.click();
    });
}

chatFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Max file size limit: 15MB (since WebRTC connection data channels perform best under 20MB)
    if (file.size > 15 * 1024 * 1024) {
        showToast('Dosya boyutu 15MB\'dan büyük olamaz.', 'error');
        chatFileInput.value = '';
        return;
    }
    
    showToast('Dosya okunuyor ve gönderiliyor...', 'info');
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const base64Data = event.target.result;
        sendFileMessage(file.name, file.type, file.size, base64Data);
        chatFileInput.value = '';
    };
    reader.onerror = () => {
        showToast('Dosya okuma hatası.', 'error');
        chatFileInput.value = '';
    };
    reader.readAsDataURL(file);
});

function sendFileMessage(fileName, fileType, fileSize, fileData) {
    if(!activeTextChannelId || !currentServerId) return;
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const fileObj = {
        name: fileName,
        type: fileType,
        size: fileSize,
        data: fileData
    };

    if(isHost) {
        const msg = { channelId: activeTextChannelId, senderId: myId, senderName: myUsername, text: '', file: fileObj, time };
        messages.push(msg);
        broadcastMessageToAll(msg);
        renderMessages();
    } else if(hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'chat', channelId: activeTextChannelId, text: '', file: fileObj, time });
    }
}

function openImageModal(src) {
    const modal = document.getElementById('imageViewerModal');
    const img = document.getElementById('imageViewerImg');
    if (!modal || !img) return;
    img.src = src;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        img.classList.remove('scale-95');
    }, 10);
}

function closeImageViewerModal() {
    const modal = document.getElementById('imageViewerModal');
    const img = document.getElementById('imageViewerImg');
    if (!modal || !img) return;
    modal.classList.add('opacity-0');
    img.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        img.src = '';
    }, 200);
}

// Bind to window for dynamic HTML element onclick triggers
window.openImageModal = openImageModal;
window.closeImageViewerModal = closeImageViewerModal;

// ---------------- CUSTOM ELECTRON SCREEN & WINDOW PICKER ----------------
let screenPickerSources = [];
let selectedSourceId = null;
let currentPickerTab = 'screen'; // 'screen' or 'window'

async function openScreenPicker() {
    if (localScreenStream) {
        stopScreenShare();
        return;
    }
    
    if (!window.process || !window.process.type) {
        // Fallback for non-Electron environment
        startScreenShare();
        return;
    }

    const { ipcRenderer } = window.require('electron');
    showToast('Ekran kaynakları aranıyor...', 'info');
    
    try {
        screenPickerSources = await ipcRenderer.invoke('get-screen-sources');
        selectedSourceId = null;
        currentPickerTab = 'screen';
        
        // Update tab styles
        const tabScreens = document.getElementById('tabScreens');
        const tabWindows = document.getElementById('tabWindows');
        tabScreens.className = "py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-blue-500 border-b-2 border-blue-500 mr-4 focus:outline-none transition-all";
        tabWindows.className = "py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 focus:outline-none transition-all";
        
        document.getElementById('confirmScreenPickerBtn').setAttribute('disabled', 'true');
        
        openModal('screenPickerModal');
        renderPickerSources();
    } catch(e) {
        console.error('Failed to get screen sources:', e);
        showToast('Kaynaklar yüklenemedi, varsayılan paylaşım deneniyor...', 'error');
        startScreenShare();
    }
}

function renderPickerSources() {
    const listContainer = document.getElementById('pickerSourcesList');
    const confirmBtn = document.getElementById('confirmScreenPickerBtn');
    listContainer.innerHTML = '';
    
    const filtered = screenPickerSources.filter(s => {
        if (currentPickerTab === 'screen') {
            return s.id.startsWith('screen');
        } else {
            return s.id.startsWith('window');
        }
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="col-span-2 flex flex-col items-center justify-center py-12 text-slate-500">
                <i class="fa-solid fa-circle-info text-2xl mb-3"></i>
                <span class="text-xs">Aktif kaynak bulunamadı.</span>
            </div>
        `;
        return;
    }

    filtered.forEach(source => {
        const card = document.createElement('div');
        const isSelected = selectedSourceId === source.id;
        card.className = `group relative rounded-xl border overflow-hidden bg-black/40 cursor-pointer transition-all ${
            isSelected 
                ? 'border-blue-500 ring-2 ring-blue-500/25 bg-blue-950/20' 
                : 'border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.01]'
        }`;
        
        card.innerHTML = `
            <div class="aspect-video w-full overflow-hidden bg-slate-950/40 relative flex items-center justify-center">
                <img src="${source.thumbnail}" class="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300">
                ${isSelected ? `
                    <div class="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                        <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                            <i class="fa-solid fa-check text-xs"></i>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="p-3 border-t border-white/[0.03] flex items-center gap-2">
                <i class="${currentPickerTab === 'screen' ? 'fa-solid fa-desktop' : 'fa-regular fa-window-maximize'} text-[11px] text-slate-400"></i>
                <span class="text-xs text-slate-200 truncate font-medium flex-1">${source.name}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            selectedSourceId = source.id;
            confirmBtn.removeAttribute('disabled');
            renderPickerSources();
        });

        listContainer.appendChild(card);
    });
}

// Attach Screen Picker Listeners
document.getElementById('closeScreenPickerBtn').addEventListener('click', () => closeModal('screenPickerModal'));
document.getElementById('cancelScreenPickerBtn').addEventListener('click', () => closeModal('screenPickerModal'));

document.getElementById('tabScreens').addEventListener('click', () => {
    currentPickerTab = 'screen';
    document.getElementById('tabScreens').className = "py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-blue-500 border-b-2 border-blue-500 mr-4 focus:outline-none transition-all";
    document.getElementById('tabWindows').className = "py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 focus:outline-none transition-all";
    renderPickerSources();
});

document.getElementById('tabWindows').addEventListener('click', () => {
    currentPickerTab = 'window';
    document.getElementById('tabScreens').className = "py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 mr-4 focus:outline-none transition-all";
    document.getElementById('tabWindows').className = "py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-blue-500 border-b-2 border-blue-500 focus:outline-none transition-all";
    renderPickerSources();
});

document.getElementById('confirmScreenPickerBtn').addEventListener('click', () => {
    if (selectedSourceId) {
        closeModal('screenPickerModal');
        startScreenShare(selectedSourceId);
    }
});
