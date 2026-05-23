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
const settingsSoundEffectsToggle = document.getElementById('settingsSoundEffectsToggle');
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

const themeToggleBtn = document.getElementById('themeToggleBtn');
const settingsProfilePicPreview = document.getElementById('settingsProfilePicPreview');
const settingsProfilePicFallback = document.getElementById('settingsProfilePicFallback');
const settingsProfilePicImg = document.getElementById('settingsProfilePicImg');
const btnUploadProfilePic = document.getElementById('btnUploadProfilePic');
const btnRemoveProfilePic = document.getElementById('btnRemoveProfilePic');
const profilePicInput = document.getElementById('profilePicInput');

// Screen Sharing & Camera DOM Bindings
const shareScreenBtn = document.getElementById('shareScreenBtn');
const cameraToggleBtn = document.getElementById('cameraToggleBtn');
const screenShareContainer = document.getElementById('screenShareContainer');
const videoGalleryGrid = document.getElementById('videoGalleryGrid');
const screenShareUser = document.getElementById('screenShareUser');
const fullscreenScreenShareBtn = document.getElementById('fullscreenScreenShareBtn');
const closeScreenShareBtn = document.getElementById('closeScreenShareBtn');
const screenShareVideo = document.getElementById('screenShareVideo');

// State
let myId = '';
let myUsername = 'Kullanıcı';
let myProfilePic = '';
let peer = null;

// Screen Sharing & Camera State
let localScreenStream = null;
let screenCalls = new Map(); // peerId -> call
let activeIncomingScreenCall = null; // call
let localCameraStream = null;
const cameraCalls = new Map(); // peerId -> call
const activeIncomingVideoCalls = new Map(); // streamKey -> { call, stream, type, username }


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
let serverAdminIds = new Set();
let serverMemberRoles = new Map(); // peerId -> roleId
let activeRoleEditingId = null;
let currentView = 'home'; 
let connections = new Map(); 
let directConnections = new Map();
let hostConnection = null; 

let activeServer = {
    id: '',
    name: '',
    channels: [],
    members: new Map() 
};

let activeTextChannelId = 'genel';
let activeVoiceChannelId = null;
let activeDMUserId = null; // Target peerId of active DM chat (if not null, we are in a DM)
let joinedDMs = []; // Array of { id: string, username: string, profilePic: string, status: string }
let collapsedCategories = { dm: false, text: false, voice: false };
let myStatus = 'online'; // online, idle, dnd, invisible
let voiceTransmissionMode = 'activity'; // activity, ptt
let isPttActive = false;
let pttKey = 'Space'; // Default hotkey for Bas-Konuş
let messages = []; 
let activeReplyMessage = null; // Stores { id: string, senderName: string, text: string }
let gifPanelOpen = false;
let editingMessageId = null; // ID of message currently being edited
let activeEmojiPickerMsgId = null; // ID of message whose emoji picker is open

// Typing Indicator states
let localTypingState = false;
let localTypingTimeout = null;
let typingTimeouts = new Map(); // peerId -> setTimeout reference
let activeTypingUsers = new Set(); // peerIds of users currently typing in the active channel/DM

// Speaking Indicator states
let localVolumeAnalyser = null;
let remoteAnalysers = new Map(); // peerId -> AnalyserNode
let speakingUsers = new Set(); // peerIds of currently speaking users
let speakingStartTimes = new Map(); // peerId -> timestamp when loud voice activity started
let speakingIntervalId = null;

// Friends & P2P Direct Calling State
let friends = [];
let friendRequests = [];
let activeCall = null;
let incomingCall = null;
let callRingtoneInterval = null;
let friendsActiveTab = 'active';

// Voice State
let localStream = null;
let rawLocalStream = null;
let mediaConnections = new Map(); 

// Remote Web Audio State for high quality gain and volume boosting up to 2000x
let remoteGainNodes = new Map(); // peerId -> GainNode
let remoteSources = new Map(); // peerId -> MediaStreamAudioSourceNode

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

window.translations = {
    tr: {
        home: "Ana Sayfa",
        friends: "Arkadaşlar",
        friends_all: "Tüm Arkadaşlar",
        friends_online: "Çevrimiçi",
        friends_pending: "Bekleyen İstekler",
        friends_add: "Arkadaş Ekle",
        settings: "Ayarlar",
        settings_title: "Kullanıcı Ayarları",
        settings_save: "Kaydet",
        settings_close: "Kapat",
        settings_theme: "Görünüm Teması",
        settings_theme_dark: "Karanlık Tema",
        settings_theme_light: "Açık Tema",
        settings_lang: "Dil (Language)",
        settings_mic: "Mikrofon Girişi",
        settings_deafen: "Hoparlör Çıkışı",
        settings_noise: "Gürültü Engelleme (RNNoise)",
        settings_volumes: "Kullanıcı Ses Düzeyleri",
        settings_hotkeys: "Küresel Kısayol Tuşları (Sistem Genelinde)",
        settings_hotkey_mic: "Mik Sustur Tuşu",
        settings_hotkey_deafen: "Sağırlaştır Tuşu",
        active_voice: "Ses Aktif",
        active_voice_desc: "Güvenli bağlantı",
        channels_title: "Kanallar",
        text_channels: "Yazı Kanalları",
        voice_channels: "Ses Odaları",
        direct_messages: "Özel Mesajlar",
        no_chat: "Sohbet yok",
        invite_code: "Ağ Davet Kodu",
        manage_roles: "Ağ Rollerini Yönet",
        leave_server: "Ağdan Ayrıl",
        add_server: "Yeni Ağ Ekle",
        add_friend_placeholder: "Arkadaşının Peer ID'sini gir...",
        add_friend_btn: "Arkadaşlık İsteği Gönder",
        chat_placeholder: "Mesaj gönder...",
        replying_to: "kullanıcısına yanıt veriliyor",
        cancel: "İptal",
        gif_search_placeholder: "Tenor'da GIF ara...",
        friends_empty: "Burada henüz kimse yok.",
        friends_pending_empty: "Bekleyen arkadaşlık isteği yok.",
        toast_copied: "Kimlik kopyalandı.",
        toast_friend_req_sent: "Arkadaşlık isteği gönderildi.",
        toast_error_self_friend: "Kendinizi arkadaş olarak ekleyemezsiniz.",
        toast_error_empty_id: "Lütfen geçerli bir Peer ID girin.",
        toast_friend_accepted: "arkadaşlık isteğini kabul etti.",
        toast_friend_declined: "Arkadaşlık isteği reddedildi."
    },
    en: {
        home: "Home",
        friends: "Friends",
        friends_all: "All Friends",
        friends_online: "Online",
        friends_pending: "Pending Requests",
        friends_add: "Add Friend",
        settings: "Settings",
        settings_title: "User Settings",
        settings_save: "Save",
        settings_close: "Close",
        settings_theme: "Appearance Theme",
        settings_theme_dark: "Dark Theme",
        settings_theme_light: "Light Theme",
        settings_lang: "Language (Dil)",
        settings_mic: "Microphone Input",
        settings_deafen: "Audio Output",
        settings_noise: "Noise Suppression (RNNoise)",
        settings_volumes: "User Volume Levels",
        settings_hotkeys: "Global Hotkeys (System-Wide)",
        settings_hotkey_mic: "Mute Mic Hotkey",
        settings_hotkey_deafen: "Deafen Hotkey",
        active_voice: "Voice Active",
        active_voice_desc: "Secure connection",
        channels_title: "Channels",
        text_channels: "Text Channels",
        voice_channels: "Voice Channels",
        direct_messages: "Direct Messages",
        no_chat: "No chats",
        invite_code: "Network Invite Code",
        manage_roles: "Manage Network Roles",
        leave_server: "Leave Network",
        add_server: "Add New Network",
        add_friend_placeholder: "Enter friend's Peer ID...",
        add_friend_btn: "Send Friend Request",
        chat_placeholder: "Send a message...",
        replying_to: "replying to",
        cancel: "Cancel",
        gif_search_placeholder: "Search GIFs in Tenor...",
        friends_empty: "No friends here yet.",
        friends_pending_empty: "No pending friend requests.",
        toast_copied: "ID copied.",
        toast_friend_req_sent: "Friend request sent.",
        toast_error_self_friend: "You cannot add yourself as a friend.",
        toast_error_empty_id: "Please enter a valid Peer ID.",
        toast_friend_accepted: "accepted the friend request.",
        toast_friend_declined: "Friend request declined."
    }
};

window.t = function(key) {
    const lang = localStorage.getItem('os_language') || 'tr';
    return (window.translations[lang] && window.translations[lang][key]) ? window.translations[lang][key] : key;
};

window.updateAppLanguage = function(lang) {
    localStorage.setItem('os_language', lang);
    
    const langSelect = document.getElementById('settingsLanguageSelect');
    if (langSelect) langSelect.value = lang;
    
    // Select all elements with data-i18n attribute and update them
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = window.t(key);
        if (translated !== key) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translated;
            } else {
                el.innerText = translated;
            }
        }
    });
    
    // Update dynamic views
    if (typeof renderHome === 'function') renderHome();
    if (typeof renderChannelPanel === 'function') renderChannelPanel();
    if (typeof renderMessages === 'function') renderMessages();
    if (typeof renderMembers === 'function') renderMembers();
};

// Initialization
function initApp() {
    // Load Language
    const savedLang = localStorage.getItem('os_language') || 'tr';
    window.updateAppLanguage(savedLang);

    // Load Theme
    const savedTheme = localStorage.getItem('os_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeToggleBtn) themeToggleBtn.innerHTML = `<i class="fa-solid fa-sun text-[12px]"></i>`;
    }

    // Load Profile Picture
    const savedProfilePic = localStorage.getItem('os_profile_pic');
    if (savedProfilePic) {
        myProfilePic = savedProfilePic;
        const myAvatarContainer = document.getElementById('myAvatarContainer');
        if (myAvatarContainer) {
            myAvatarContainer.innerHTML = `<img src="${myProfilePic}" class="w-full h-full object-cover rounded-lg">`;
        }
    }

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

    // Load initial status
    const savedStatus = localStorage.getItem('os_my_status') || 'online';
    myStatus = savedStatus;
    changeMyStatus(myStatus);
    loadFriends();
    loadJoinedDMs();
    startFriendsPresenceCheck();

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

    // Load Sound Effects setting
    const savedSound = localStorage.getItem('os_sound_enabled');
    if (savedSound !== null) {
        if (settingsSoundEffectsToggle) settingsSoundEffectsToggle.checked = savedSound === 'true';
    } else {
        if (settingsSoundEffectsToggle) settingsSoundEffectsToggle.checked = true; // default enabled
    }

    // Load Hotkey Settings
    const rawMic = localStorage.getItem('os_hotkey_mic_obj');
    const rawDeafen = localStorage.getItem('os_hotkey_deafen_obj');
    if (rawMic) { try { hotkeyMic = JSON.parse(rawMic); } catch(e){} }
    if (rawDeafen) { try { hotkeyDeafen = JSON.parse(rawDeafen); } catch(e){} }
    // Load Voice transmission mode setting
    voiceMode = localStorage.getItem('os_voice_mode') || 'va';
    pttKey = localStorage.getItem('os_ptt_key') || 'KeyV';
    
    // Wire UI settings controls state
    const modeVaBtn = document.getElementById('btnVoiceActivity');
    const modePttBtn = document.getElementById('btnPushToTalk');
    const pttBindingRow = document.getElementById('settingsPttKeyContainer');
    const pttHotkeyBtn = document.getElementById('btnShortcutPtt');
    
    if (modeVaBtn && modePttBtn && pttBindingRow && pttHotkeyBtn) {
        if (voiceMode === 'ptt') {
            modePttBtn.className = "px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-md transition-all";
            modeVaBtn.className = "px-4 py-2.5 rounded-xl bg-[#222] border border-[#333] hover:border-[#444] text-[#888] font-medium text-xs transition-all";
            pttBindingRow.classList.remove('hidden');
            pttBindingRow.classList.add('flex');
        } else {
            modeVaBtn.className = "px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-md transition-all";
            modePttBtn.className = "px-4 py-2.5 rounded-xl bg-[#222] border border-[#333] hover:border-[#444] text-[#888] font-medium text-xs transition-all";
            pttBindingRow.classList.add('hidden');
            pttBindingRow.classList.remove('flex');
        }
        pttHotkeyBtn.textContent = pttKey.replace('Key', '');
    }

    // Update tooltip titles dynamically
    micToggleBtn.title = `Sustur (${formatHotkey(hotkeyMic)})`;
    deafenToggleBtn.title = `Sağırlaştır (${formatHotkey(hotkeyDeafen)})`;
    syncGlobalShortcuts();

    // Mute/Deafen buttons click handlers
    micToggleBtn.addEventListener('click', toggleMute);
    deafenToggleBtn.addEventListener('click', toggleDeafen);

    peer = new Peer(myId, {
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
    });

    peer.on('open', (id) => {
        const lastServer = localStorage.getItem('os_last_server');
        if(lastServer) joinServer(lastServer);
    });

    peer.on('connection', (conn) => {
        if (conn.metadata && conn.metadata.type === 'ping') {
            conn.on('open', () => {
                conn.close();
            });
            return;
        }
        
        // Handle friend request connections
        if (conn.metadata && conn.metadata.type === 'friend-request-connection') {
            conn.on('data', (data) => {
                if (data.type === 'friend-added') {
                    handleIncomingFriendRequest(data.senderId, data.senderName);
                } else if (data.type === 'friend-accept') {
                    handleIncomingFriendAccept(data.senderId, data.senderName);
                } else if (data.type === 'friend-decline') {
                    handleIncomingFriendDecline(data.senderId);
                }
            });
            return;
        }
        
        // Accept direct P2P DM connections
        if ((conn.metadata && conn.metadata.type === 'dm-connection') || !isHost) {
            directConnections.set(conn.peer, conn);
            setupDirectConnection(conn);
            return;
        }
        
        if(isHost) handleClientConnection(conn);
    });

    peer.on('call', (call) => {
        if (call.metadata && call.metadata.type === 'direct-call') {
            handleIncomingDirectCall(call);
            return;
        }
        
        if(!activeVoiceChannelId) {
            call.close();
            return;
        }
        if (call.metadata && (call.metadata.type === 'screen-share' || call.metadata.type === 'camera-share')) {
            call.answer(); // Ekran veya Kamera paylaşımı için karşıya ses akışı göndermiyoruz
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

    // Render Home page immediately on app startup so UI is fully responsive
    renderHome();
}

function setupDirectConnection(conn) {
    conn.on('open', () => {
        console.log("[ALCORD P2P] Direct connection opened with:", conn.peer);
    });
    conn.on('data', (data) => {
        handleDirectData(conn, data);
    });
    conn.on('close', () => {
        console.log("[ALCORD P2P] Direct connection closed with:", conn.peer);
        directConnections.delete(conn.peer);
    });
    conn.on('error', (err) => {
        console.error("[ALCORD P2P] Direct connection error:", err);
    });
}

function handleDirectData(conn, data) {
    console.log("[ALCORD P2P] Received direct data:", data);
    if (data.type === 'dm') {
        const senderId = data.senderId;
        const dmRoomId = senderId === myId ? data.targetId : senderId;
        
        const msg = {
            channelId: dmRoomId,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            file: data.file,
            time: data.time
        };
        if (data.replyTo) msg.replyTo = data.replyTo;
        
        addJoinedDM(dmRoomId, data.senderName);
        
        const toneType = checkIsMentioned(data.text) ? 'mention' : 'msg-receive';
        playTone(toneType);
        
        if (activeDMUserId === dmRoomId) {
            const msgToPush = { id: data.id, ...msg };
            messages.push(msgToPush);
            persistMessage(msgToPush);
            renderMessages();
        } else {
            const msgToSave = { id: data.id, ...msg };
            messages.push(msgToSave);
            persistMessage(msgToSave);
            incrementUnread(dmRoomId);
            renderChannelPanel();
            renderGuildBar();
            triggerNotification(`Yeni DM: ${data.senderName}`, data.text || 'Bir dosya gönderdi.');
        }
    } else if (data.type === 'delete-message') {
        deleteLocalMessage(data.messageId, data.channelId);
    } else if (data.type === 'reaction') {
        data.senderId = conn.peer;
        handleReactionPacket(data);
    } else if (data.type === 'edit-message') {
        data.senderId = conn.peer;
        handleEditMessagePacket(data);
    } else if (data.type === 'typing') {
        handleTypingReceived(conn.peer, data.isTyping, data.channelId);
    }
}

function saveJoinedServers() {
    localStorage.setItem('os_joined_servers', JSON.stringify(joinedServers));
}

function addJoinedServer(id, name, icon = null) {
    if (!joinedServers.find(s => s.id === id)) {
        joinedServers.push({ id, name, icon });
    } else {
        const s = joinedServers.find(s => s.id === id);
        if (s.name !== name) {
            s.name = name;
        }
        if (icon !== null) {
            s.icon = icon;
        }
    }
    saveJoinedServers();
}

function createServer() {
    isHost = true;
    currentServerId = myId;
    
    serverAdminIds = new Set();
    try {
        const rawAdmins = localStorage.getItem('os_my_server_admins');
        if (rawAdmins) {
            serverAdminIds = new Set(JSON.parse(rawAdmins));
        }
    } catch(e){}
    
    serverMemberRoles = new Map();
    try {
        const rawMemberRoles = localStorage.getItem('os_my_server_member_roles');
        if (rawMemberRoles) {
            serverMemberRoles = new Map(JSON.parse(rawMemberRoles));
        }
    } catch(e){}
    
    let savedChannels = null;
    const rawSavedChannels = localStorage.getItem('os_my_server_channels');
    if (rawSavedChannels) {
        try { savedChannels = JSON.parse(rawSavedChannels); } catch(e){}
    }
    
    let savedRoles = null;
    try {
        const rawRoles = localStorage.getItem('os_my_server_roles');
        if (rawRoles) savedRoles = JSON.parse(rawRoles);
    } catch(e){}
    
    const myServerName = localStorage.getItem('os_my_server_name') || `${myUsername}'in Ağı`;
    const myServerIcon = localStorage.getItem('os_my_server_icon') || '';
    
    activeServer = {
        id: myId,
        name: myServerName,
        icon: myServerIcon,
        roles: savedRoles || [
            { id: 'role_owner', name: 'Kurucu', color: '#f59e0b', order: 1 },
            { id: 'role_admin', name: 'Yönetici', color: '#a855f7', order: 2 },
            { id: 'role_vip', name: 'VIP', color: '#3b82f6', order: 3 },
            { id: 'role_member', name: 'Üye', color: '#94a3b8', order: 4 }
        ],
        channels: savedChannels || [
            { id: 'genel', name: 'genel', type: 'text' },
            { id: 'tasarim', name: 'tasarım', type: 'text' },
            { id: 'genel_ses', name: 'Genel Toplantı', type: 'voice' }
        ],
        members: new Map()
    };
    activeServer.members.set(myId, { username: myUsername, profilePic: myProfilePic, voiceChannelId: null, role: 'owner', roleId: 'role_owner' });
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
    if (conn.open) {
        connections.set(conn.peer, conn);
    } else {
        conn.on('open', () => connections.set(conn.peer, conn));
    }
    conn.on('error', (err) => {
        console.error("Client connection error:", err);
        connections.delete(conn.peer);
    });
    conn.on('data', (data) => {
        if (data.type === 'intro') {
            const savedRoleId = serverMemberRoles.get(conn.peer) || 'role_member';
            const isPeerAdmin = savedRoleId === 'role_admin' || serverAdminIds.has(conn.peer);
            const actualRoleId = isPeerAdmin ? 'role_admin' : savedRoleId;
            
            activeServer.members.set(conn.peer, { 
                username: data.username, 
                profilePic: data.profilePic || '', 
                voiceChannelId: null, 
                status: data.status || 'online',
                role: isPeerAdmin ? 'admin' : 'member',
                roleId: actualRoleId
            });
            broadcastServerState();
            addSystemMessage(`${data.username} ağa katıldı.`, 'genel');
            playTone('server-join');
        } 
        else if (data.type === 'status-update') {
            const member = activeServer.members.get(conn.peer);
            if (member) {
                member.status = data.status;
                broadcastServerState();
            }
        }
        else if (data.type === 'typing') {
            if (data.channelId === myId) {
                handleTypingReceived(conn.peer, data.isTyping, data.channelId);
            } else {
                connections.forEach(c => {
                    if (c.open && c.peer !== conn.peer) {
                        c.send(data);
                    }
                });
                handleTypingReceived(conn.peer, data.isTyping, data.channelId);
            }
        }
        else if (data.type === 'chat') {
            const msg = {
                id: data.id,
                channelId: data.channelId,
                senderId: conn.peer,
                senderName: activeServer.members.get(conn.peer)?.username || 'İsimsiz',
                text: data.text,
                time: data.time
            };
            if (data.file) msg.file = data.file;
            if (data.replyTo) msg.replyTo = data.replyTo;
            
            messages.push(msg);
            persistMessage(msg);
            broadcastMessageToAll(msg);
            
            const toneType = checkIsMentioned(data.text) ? 'mention' : 'msg-receive';
            playTone(toneType);
            
            if(activeTextChannelId === data.channelId) {
                renderMessages();
            } else {
                incrementUnread(data.channelId);
                renderChannelPanel();
                renderGuildBar();
                const ch = activeServer.channels.find(c => c.id === data.channelId);
                const chName = ch ? ch.name : 'genel';
                triggerNotification(`#${chName} Kanalında Yeni Mesaj`, `${msg.senderName}: ${data.text || 'Dosya paylaştı.'}`);
            }
        }
        else if (data.type === 'delete-message') {
            const msg = messages.find(m => m.id === data.messageId);
            if (msg && (msg.senderId === conn.peer || conn.peer === myId)) {
                deleteLocalMessage(data.messageId, data.channelId);
                broadcastMessageToAll(data);
            }
        }
        else if (data.type === 'reaction') {
            data.senderId = conn.peer;
            handleReactionPacket(data);
            broadcastMessageToAll(data);
        }
        else if (data.type === 'edit-message') {
            const origMsg = messages.find(m => m.id === data.messageId);
            if (origMsg && origMsg.senderId === conn.peer) {
                data.senderId = conn.peer;
                handleEditMessagePacket(data);
                broadcastMessageToAll(data);
            }
        }
        else if (data.type === 'pin-message') {
            data.senderId = conn.peer;
            handlePinMessagePacket(data);
            broadcastMessageToAll(data);
        }
        else if (data.type === 'dm') {
            if (data.targetId === myId) {
                const msg = {
                    id: data.id,
                    channelId: conn.peer,
                    senderId: conn.peer,
                    senderName: data.senderName,
                    text: data.text,
                    file: data.file,
                    time: data.time
                };
                messages.push(msg);
                persistMessage(msg);
                addJoinedDM(conn.peer, data.senderName);
                if (activeDMUserId === conn.peer) {
                    renderMessages();
                } else {
                    triggerNotification(`Yeni DM: ${data.senderName}`, data.text || 'Bir dosya gönderdi.');
                }
            } else {
                const targetConn = connections.get(data.targetId);
                if (targetConn && targetConn.open) {
                    targetConn.send(data);
                }
            }
        }
        else if (data.type === 'friend-added-forward') {
            const targetConn = connections.get(data.targetId);
            if (targetConn && targetConn.open) {
                targetConn.send({ type: 'friend-added', senderId: data.senderId, senderName: data.senderName });
            }
        }
        else if (data.type === 'friend-accept-forward') {
            const targetConn = connections.get(data.targetId);
            if (targetConn && targetConn.open) {
                targetConn.send({ type: 'friend-accept', senderId: data.senderId, senderName: data.senderName });
            }
        }
        else if (data.type === 'friend-decline-forward') {
            const targetConn = connections.get(data.targetId);
            if (targetConn && targetConn.open) {
                targetConn.send({ type: 'friend-decline', senderId: data.senderId });
            }
        }
        else if (data.type === 'manage-channel') {
            const sender = activeServer.members.get(conn.peer);
            if (!sender || sender.role !== 'admin') {
                console.warn(`Unauthorized manage-channel request from peer ${conn.peer}`);
                return;
            }
            
            if (data.action === 'create') {
                const chId = 'ch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                activeServer.channels.push({ id: chId, name: data.name, type: data.channelType });
                showToast(`${sender.username} yeni bir oda oluşturdu: #${data.name}`, "info");
            } 
            else if (data.action === 'edit') {
                const ch = activeServer.channels.find(c => c.id === data.channelId);
                if (ch) {
                    const oldName = ch.name;
                    ch.name = data.name;
                    showToast(`${sender.username} oda adını güncelledi: #${oldName} -> #${data.name}`, "info");
                }
            } 
            else if (data.action === 'delete') {
                if (data.channelId === 'genel' || data.channelId === 'genel_ses') return; // protect default
                
                const ch = activeServer.channels.find(c => c.id === data.channelId);
                if (ch) {
                    activeServer.channels = activeServer.channels.filter(c => c.id !== data.channelId);
                    showToast(`${sender.username} #${ch.name} odasını sildi.`, "info");
                    
                    if (activeTextChannelId === data.channelId) {
                        const firstText = activeServer.channels.find(c => c.type === 'text');
                        activeTextChannelId = firstText ? firstText.id : 'genel';
                    }
                    if (activeVoiceChannelId === data.channelId) {
                        leaveVoiceChannel();
                    }
                }
            }
            
            localStorage.setItem('os_my_server_channels', JSON.stringify(activeServer.channels));
            broadcastServerState();
            renderServerView();
        }
        else if (data.type === 'voice-state') {
            const member = activeServer.members.get(conn.peer);
            if(member) {
                const oldChannel = member.voiceChannelId;
                const newChannel = data.channelId;
                member.voiceChannelId = data.channelId;
                
                if (activeVoiceChannelId) {
                    if (newChannel === activeVoiceChannelId && oldChannel !== activeVoiceChannelId) {
                        playTone('join');
                        if (localScreenStream && !screenCalls.has(conn.peer)) {
                            const call = peer.call(conn.peer, localScreenStream, { 
                                metadata: { type: 'screen-share', username: myUsername } 
                            });
                            screenCalls.set(conn.peer, call);
                        }
                        if (localCameraStream && !cameraCalls.has(conn.peer)) {
                            const call = peer.call(conn.peer, localCameraStream, {
                                metadata: { type: 'camera-share', username: myUsername }
                            });
                            cameraCalls.set(conn.peer, call);
                        }
                    } else if (oldChannel === activeVoiceChannelId && newChannel !== activeVoiceChannelId) {
                        playTone('leave');
                    }
                }
                
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
        icon: activeServer.icon || '',
        channels: activeServer.channels,
        roles: activeServer.roles || [],
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
    persistMessage(msg);
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
        hostConnection.send({ type: 'intro', username: myUsername, profilePic: myProfilePic, status: myStatus });
        showToast('Bağlantı sağlandı.', 'success');
    });

    hostConnection.on('data', (data) => {
        if(data.type === 'server-state') {
            const oldMembers = new Map(activeServer.members);
            activeServer.name = data.name;
            activeServer.icon = data.icon || '';
            activeServer.channels = data.channels;
            activeServer.roles = data.roles || [];
            activeServer.members = new Map(data.members.map(m => [m.id, {
                username: m.username, 
                profilePic: m.profilePic || '', 
                voiceChannelId: m.voiceChannelId, 
                status: m.status || 'online', 
                role: m.role || 'member',
                roleId: m.roleId || (m.role === 'owner' ? 'role_owner' : (m.role === 'admin' ? 'role_admin' : 'role_member'))
            }]));
            
            // Check if active channels were deleted
            const textExists = activeServer.channels.some(c => c.id === activeTextChannelId && c.type === 'text');
            if (!textExists && !activeDMUserId) {
                const firstText = activeServer.channels.find(c => c.type === 'text');
                activeTextChannelId = firstText ? firstText.id : 'genel';
            }
            if (activeVoiceChannelId) {
                const voiceExists = activeServer.channels.some(c => c.id === activeVoiceChannelId && c.type === 'voice');
                if (!voiceExists) {
                    leaveVoiceChannel();
                    showToast("Bulunduğunuz ses kanalı silindi.", "warning");
                }
            }
            
            if (oldMembers.size > 0 && activeServer.members.size > oldMembers.size) {
                let someoneNew = false;
                activeServer.members.forEach((member, id) => {
                    if (id !== myId && !oldMembers.has(id)) {
                        someoneNew = true;
                    }
                });
                if (someoneNew) {
                    playTone('server-join');
                }
            }

            if (activeVoiceChannelId) {
                activeServer.members.forEach((member, id) => {
                    if (id !== myId) {
                        const oldMember = oldMembers.get(id);
                        const oldChannel = oldMember ? oldMember.voiceChannelId : null;
                        const newChannel = member.voiceChannelId;
                        
                        if (newChannel === activeVoiceChannelId && oldChannel !== activeVoiceChannelId) {
                            playTone('join');
                            if (localScreenStream && !screenCalls.has(id)) {
                                const call = peer.call(id, localScreenStream, { 
                                    metadata: { type: 'screen-share', username: myUsername } 
                                });
                                screenCalls.set(id, call);
                            }
                            if (localCameraStream && !cameraCalls.has(id)) {
                                const call = peer.call(id, localCameraStream, {
                                    metadata: { type: 'camera-share', username: myUsername }
                                });
                                cameraCalls.set(id, call);
                            }
                        } else if (oldChannel === activeVoiceChannelId && newChannel !== activeVoiceChannelId) {
                            playTone('leave');
                        }
                    }
                });
            }
            
            addJoinedServer(currentServerId, data.name, data.icon);

            if(!activeTextChannelId || !activeServer.channels.find(c => c.id === activeTextChannelId)) {
                const firstText = activeServer.channels.find(c => c.type === 'text');
                if(firstText) activeTextChannelId = firstText.id;
            }
            renderServerView();
        }
        else if (data.type === 'message') {
            if (data.senderId === myId) return;
            messages.push(data);
            persistMessage(data);
            const toneType = checkIsMentioned(data.text) ? 'mention' : 'msg-receive';
            playTone(toneType);
            
            if(activeTextChannelId === data.channelId) {
                renderMessages();
            } else {
                incrementUnread(data.channelId);
                renderChannelPanel();
                renderGuildBar();
                const ch = activeServer.channels.find(c => c.id === data.channelId);
                const chName = ch ? ch.name : 'genel';
                triggerNotification(`#${chName} Kanalında Yeni Mesaj`, `${data.senderName}: ${data.text || 'Dosya paylaştı.'}`);
            }
        }
        else if (data.type === 'typing') {
            handleTypingReceived(data.senderId, data.isTyping, data.channelId);
        }
        else if (data.type === 'delete-message') {
            deleteLocalMessage(data.messageId, data.channelId);
        }
        else if (data.type === 'reaction') {
            handleReactionPacket(data);
        }
        else if (data.type === 'edit-message') {
            handleEditMessagePacket(data);
        }
        else if (data.type === 'pin-message') {
            handlePinMessagePacket(data);
        }
        else if (data.type === 'dm') {
            const senderId = data.senderId;
            const dmRoomId = senderId === myId ? data.targetId : senderId;
            
            const msg = {
                id: data.id,
                channelId: dmRoomId,
                senderId: data.senderId,
                senderName: data.senderName,
                text: data.text,
                file: data.file,
                time: data.time
            };
            
            addJoinedDM(dmRoomId, data.senderName);
            
            const toneType = checkIsMentioned(data.text) ? 'mention' : 'msg-receive';
            playTone(toneType);
            
            if (activeDMUserId === dmRoomId) {
                messages.push(msg);
                persistMessage(msg);
                renderMessages();
            } else {
                messages.push(msg);
                persistMessage(msg);
                incrementUnread(dmRoomId);
                renderChannelPanel();
                renderGuildBar();
                triggerNotification(`Yeni DM: ${data.senderName}`, data.text || 'Bir dosya gönderdi.');
            }
        }
        else if (data.type === 'friend-added') {
            handleIncomingFriendRequest(data.senderId, data.senderName);
        }
        else if (data.type === 'friend-accept') {
            handleIncomingFriendAccept(data.senderId, data.senderName);
        }
        else if (data.type === 'friend-decline') {
            handleIncomingFriendDecline(data.senderId);
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

function sendChatMessage(text, fileObj = null) {
    if (activeDMUserId) {
        sendDirectMessage(activeDMUserId, text, fileObj);
        return;
    }
    if(!activeTextChannelId || !currentServerId) return;
    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const msg = { id: msgId, channelId: activeTextChannelId, senderId: myId, senderName: myUsername, text, time };
    if (fileObj) msg.file = fileObj;
    if (activeReplyMessage) {
        msg.replyTo = { ...activeReplyMessage };
        window.cancelReply();
    }
    
    messages.push(msg);
    persistMessage(msg);
    playTone('msg-send');
    
    if(isHost) {
        broadcastMessageToAll(msg);
        renderMessages();
    } else if(hostConnection && hostConnection.open) {
        const packet = { id: msgId, type: 'chat', channelId: activeTextChannelId, text, time };
        if (fileObj) packet.file = fileObj;
        if (msg.replyTo) packet.replyTo = msg.replyTo;
        
        hostConnection.send(packet);
        renderMessages();
    }
}

function updateVoiceState(channelId) {
    activeVoiceChannelId = channelId;
    const member = activeServer.members.get(myId);
    if(member) member.voiceChannelId = channelId;
    renderChannelPanel();
    
    if(isHost) {
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
            
            if (!audioCtx.rnnoiseModuleLoaded) {
                await audioCtx.audioWorklet.addModule(workletUrl);
                audioCtx.rnnoiseModuleLoaded = true;
            }
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
    if (!activeAudioCtx || !localAudioSource || !localAudioDestination) return;
    
    try {
        // Disconnect everything first to clear the graph
        try { localAudioSource.disconnect(); } catch(e){}
        if (micGainNode) { try { micGainNode.disconnect(); } catch(e){} }
        if (activeRnnoiseNode) {
            try {
                activeRnnoiseNode.port.postMessage('destroy');
                activeRnnoiseNode.disconnect();
            } catch(e) {}
            activeRnnoiseNode = null;
        }
        
        // Re-route dynamically based on active toggle status
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
            
            if (!activeAudioCtx.rnnoiseModuleLoaded) {
                await activeAudioCtx.audioWorklet.addModule(workletUrl);
                activeAudioCtx.rnnoiseModuleLoaded = true;
            }
            activeRnnoiseNode = new AudioWorkletNode(
                activeAudioCtx, 
                '@sapphi-red/web-noise-suppressor/rnnoise',
                { processorOptions: { maxChannels: 1, wasmBinary: rnnoiseWasmBinary } }
            );
            
            localAudioSource.connect(micGainNode);
            micGainNode.connect(activeRnnoiseNode);
            activeRnnoiseNode.connect(localAudioDestination);
            console.log('[RNNoise] Dynamic audio graph updated: Noise suppression ENABLED.');
        } else {
            localAudioSource.connect(micGainNode);
            micGainNode.connect(localAudioDestination);
            console.log('[RNNoise] Dynamic audio graph updated: Noise suppression DISABLED.');
        }
    } catch (err) {
        console.error('[RNNoise] Dynamic local audio graph update failed:', err);
        // Fallback safety route
        try { localAudioSource.connect(micGainNode); } catch(e){}
        try { micGainNode.connect(localAudioDestination); } catch(e){}
    }
}

async function ensureLocalStream() {
    if (localStream) return localStream;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false }
        });
        rawLocalStream = stream;
        const { processedStream, audioCtx } = await applyRNNoiseProcessing(stream);
        localStream = processedStream;
        activeAudioCtx = audioCtx;
        
        if (activeAudioCtx && activeAudioCtx.state === 'suspended') {
            await activeAudioCtx.resume();
        }
        
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
        return localStream;
    } catch (err) {
        console.error('Failed to get local stream:', err);
        showToast('Mikrofon erişimi reddedildi.', 'error');
        throw err;
    }
}

async function joinVoiceChannel(channelId) {
    if (activeVoiceChannelId === channelId) return;
    leaveVoiceChannel();
    if (activeCall || incomingCall) {
        declineOrHangupCall();
    }
    const channelInfo = activeServer.channels.find(c => c.id === channelId);
    if(!channelInfo) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false }
        });
        rawLocalStream = stream;
        
        const { processedStream, audioCtx } = await applyRNNoiseProcessing(stream);
        localStream = processedStream;
        activeAudioCtx = audioCtx;
        
        if (activeAudioCtx && activeAudioCtx.state === 'suspended') {
            await activeAudioCtx.resume();
        }
        
        // Push-to-Talk track state initialization
        if (voiceMode === 'ptt') {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = false;
            });
        } else {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
        
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
    if(localCameraStream) stopCameraShare();
    if(localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    if(rawLocalStream) { rawLocalStream.getTracks().forEach(t => t.stop()); rawLocalStream = null; }
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
        updateVideoGallery();
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
    
    shareScreenBtn.classList.add('text-[#666]');
    shareScreenBtn.classList.remove('text-blue-500', 'bg-white/[0.04]');
    
    showToast('Ekran paylaşımı sonlandırıldı.', 'info');
    updateVideoGallery();
}

async function toggleCameraShare() {
    if (!activeVoiceChannelId) {
        showToast('Kameranızı açmak için bir ses odasında olmalısınız.', 'warning');
        return;
    }
    if (localCameraStream) {
        stopCameraShare();
    } else {
        await startCameraShare();
    }
}

async function startCameraShare() {
    try {
        localCameraStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, frameRate: { ideal: 30, max: 60 } },
            audio: false
        });
        
        activeServer.members.forEach((member, peerId) => {
            if (peerId !== myId && member.voiceChannelId === activeVoiceChannelId) {
                const call = peer.call(peerId, localCameraStream, {
                    metadata: { type: 'camera-share', username: myUsername }
                });
                cameraCalls.set(peerId, call);
            }
        });
        
        if (cameraToggleBtn) {
            cameraToggleBtn.classList.remove('text-[#666]');
            cameraToggleBtn.classList.add('text-emerald-400', 'bg-white/[0.04]');
            cameraToggleBtn.title = "Kamerayı Kapat";
        }
        
        showToast('Kamera yayını başlatıldı.', 'success');
        updateVideoGallery();
    } catch (err) {
        console.error("Kamera paylaşımı başlatılamadı:", err);
        showToast('Kamera erişimi sağlanamadı.', 'error');
        localCameraStream = null;
    }
}

function stopCameraShare() {
    if (localCameraStream) {
        localCameraStream.getTracks().forEach(t => t.stop());
        localCameraStream = null;
    }
    
    cameraCalls.forEach(call => call.close());
    cameraCalls.clear();
    
    if (cameraToggleBtn) {
        cameraToggleBtn.classList.add('text-[#666]');
        cameraToggleBtn.classList.remove('text-emerald-400', 'bg-white/[0.04]');
        cameraToggleBtn.title = "Kamerayı Aç";
    }
    
    showToast('Kamera yayını sonlandırıldı.', 'info');
    updateVideoGallery();
}

function updateVideoGallery() {
    const feeds = [];
    
    if (localScreenStream) {
        feeds.push({
            id: 'local-screen',
            stream: localScreenStream,
            type: 'screen-share',
            label: 'Ekranınızı Paylaşıyorsunuz'
        });
    }
    
    if (localCameraStream) {
        feeds.push({
            id: 'local-camera',
            stream: localCameraStream,
            type: 'camera-share',
            label: 'Kameranız'
        });
    }
    
    activeIncomingVideoCalls.forEach((info, key) => {
        feeds.push({
            id: key,
            stream: info.stream,
            type: info.type,
            label: `${info.username} (${info.type === 'screen-share' ? 'Ekran' : 'Kamera'})`
        });
    });
    
    if (feeds.length === 0) {
        screenShareContainer.classList.add('hidden');
        screenShareContainer.classList.remove('flex');
        videoGalleryGrid.innerHTML = '';
        return;
    }
    
    screenShareContainer.classList.remove('hidden');
    screenShareContainer.classList.add('flex');
    
    // Dynamically adjust grid column layout
    videoGalleryGrid.className = "grid gap-4 w-full transition-all duration-300";
    if (feeds.length === 1) {
        videoGalleryGrid.classList.add('grid-cols-1');
    } else if (feeds.length === 2) {
        videoGalleryGrid.classList.add('grid-cols-1', 'md:grid-cols-2');
    } else {
        videoGalleryGrid.classList.add('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    }
    
    // Smart reconciliation: remove card elements no longer in feeds
    const activeIds = new Set(feeds.map(f => f.id));
    Array.from(videoGalleryGrid.children).forEach(card => {
        const cardId = card.id.replace('video-card-', '');
        if (!activeIds.has(cardId)) {
            card.remove();
        }
    });
    
    // Create or update card elements
    feeds.forEach(feed => {
        let card = document.getElementById(`video-card-${feed.id}`);
        if (!card) {
            card = document.createElement('div');
            card.id = `video-card-${feed.id}`;
            card.className = "glass-modal rounded-2xl overflow-hidden border border-white/[0.04] shadow-2xl relative flex flex-col items-center justify-center bg-black/40 min-h-[240px] transition-all";
            
            // Header label overlay
            const header = document.createElement('div');
            header.className = "absolute top-3 left-3 z-10 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/[0.04] text-[10px] text-[#ededed] font-medium flex items-center gap-1.5";
            header.innerHTML = `
                <span class="w-1.5 h-1.5 rounded-full ${feed.id.startsWith('local') ? 'bg-emerald-400' : 'bg-red-500'} ${feed.type === 'screen-share' ? '' : 'animate-pulse'}"></span>
                <span>${feed.label}</span>
            `;
            card.appendChild(header);
            
            // Fullscreen & Close button controls overlay
            const controls = document.createElement('div');
            controls.className = "absolute top-3 right-3 z-10 flex items-center gap-1.5";
            
            const fullscreenBtn = document.createElement('button');
            fullscreenBtn.className = "w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer";
            fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand text-[10px]"></i>';
            fullscreenBtn.title = "Tam Ekran";
            fullscreenBtn.onclick = () => {
                const v = card.querySelector('video');
                if (v) {
                    if (v.requestFullscreen) v.requestFullscreen();
                    else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
                }
            };
            controls.appendChild(fullscreenBtn);
            
            if (feed.id === 'local-screen') {
                const closeBtn = document.createElement('button');
                closeBtn.className = "w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600/80 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer";
                closeBtn.innerHTML = '<i class="fa-solid fa-xmark text-[11px]"></i>';
                closeBtn.title = "Paylaşımı Kapat";
                closeBtn.onclick = () => stopScreenShare();
                controls.appendChild(closeBtn);
            } else if (feed.id === 'local-camera') {
                const closeBtn = document.createElement('button');
                closeBtn.className = "w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600/80 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer";
                closeBtn.innerHTML = '<i class="fa-solid fa-xmark text-[11px]"></i>';
                closeBtn.title = "Kamerayı Kapat";
                closeBtn.onclick = () => stopCameraShare();
                controls.appendChild(closeBtn);
            }
            
            card.appendChild(controls);
            
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.className = "w-full h-full min-h-[240px] max-h-[45vh] object-cover bg-black/20 rounded-2xl";
            
            if (feed.id.startsWith('local')) {
                video.muted = true;
            }
            
            card.appendChild(video);
            videoGalleryGrid.appendChild(card);
            
            // Assign srcObject to play stream
            video.srcObject = feed.stream;
        } else {
            const video = card.querySelector('video');
            if (video && video.srcObject !== feed.stream) {
                video.srcObject = feed.stream;
            }
        }
    });
}

function setupRemoteMedia(call) {
    if (call.metadata && (call.metadata.type === 'screen-share' || call.metadata.type === 'camera-share')) {
        const streamKey = `${call.peer}-${call.metadata.type}`;
        call.on('stream', (remoteStream) => {
            activeIncomingVideoCalls.set(streamKey, {
                call: call,
                stream: remoteStream,
                type: call.metadata.type,
                username: call.metadata.username || 'Birisi'
            });
            updateVideoGallery();
        });
        
        const cleanup = () => {
            if (activeIncomingVideoCalls.has(streamKey)) {
                activeIncomingVideoCalls.delete(streamKey);
                updateVideoGallery();
            }
        };
        
        call.on('close', cleanup);
        call.on('error', cleanup);
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
        
        // Route remote stream through Web Audio GainNode for clean volume boosting (up to 2000x)
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
            
            const source = ctx.createMediaStreamSource(remoteStream);
            const gainNode = ctx.createGain();
            
            const userVol = localUserVolumes.get(call.peer) ?? 1.0;
            gainNode.gain.value = isDeafened ? 0 : userVol;
            
            source.connect(gainNode);
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
        if (remoteAnalysers.has(call.peer)) {
            try { remoteAnalysers.get(call.peer).disconnect(); } catch(e){}
            remoteAnalysers.delete(call.peer);
        }
        speakingUsers.delete(call.peer);
    });
}

function playTone(type) {
    try {
        const soundEnabled = localStorage.getItem('os_sound_enabled');
        if (soundEnabled === 'false') {
            return;
        }

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        if (type === 'join') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'leave') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'server-join') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523, now); // C5
            osc.frequency.setValueAtTime(659, now + 0.08); // E5
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.setValueAtTime(0.06, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'mute') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(330, now); // E4
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'unmute') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now); // A3
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'deafen') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(261, now); // C4
            osc.frequency.setValueAtTime(196, now + 0.08); // G3
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'undeafen') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(196, now); // G3
            osc.frequency.setValueAtTime(261, now + 0.08); // C4
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'msg-send') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'msg-receive') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'mention') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(660, now + 0.12);
            osc.frequency.setValueAtTime(880, now + 0.25);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.setValueAtTime(0.08, now + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    } catch(e){}
}

// ---------------- PREMIUM HELPER FUNCTIONS ----------------

function toggleCategory(cat) {
    collapsedCategories[cat] = !collapsedCategories[cat];
    const arrow = document.getElementById(`category-arrow-${cat}`);
    const list = document.getElementById(cat === 'dm' ? 'dmList' : cat === 'text' ? 'textChannelsList' : 'voiceChannelsList');
    
    if (arrow) {
        if (collapsedCategories[cat]) {
            arrow.classList.remove('fa-chevron-down');
            arrow.classList.add('fa-chevron-right');
        } else {
            arrow.classList.remove('fa-chevron-right');
            arrow.classList.add('fa-chevron-down');
        }
    }
    
    if (list) {
        if (collapsedCategories[cat]) {
            list.classList.add('hidden');
        } else {
            list.classList.remove('hidden');
        }
    }
}

function saveJoinedDMs() {
    localStorage.setItem('os_joined_dms', JSON.stringify(joinedDMs));
}

function loadJoinedDMs() {
    const key = 'os_joined_dms';
    try {
        let raw = localStorage.getItem(key);
        if (!raw) {
            // Migration fallback from older partitioned keys
            raw = localStorage.getItem(`os_joined_dms_${currentServerId || 'home'}`) || localStorage.getItem('os_joined_dms_home');
        }
        joinedDMs = raw ? JSON.parse(raw) : [];
        
        // Self-healing: Repair "Bilinmeyen Kullanıcı" names if we have their details in friends or members
        let repaired = false;
        joinedDMs.forEach(dm => {
            if (dm.username === 'Bilinmeyen Kullanıcı') {
                const friend = friends.find(f => f.id === dm.id);
                if (friend) {
                    dm.username = friend.name;
                    repaired = true;
                } else {
                    const member = activeServer.members.get(dm.id);
                    if (member) {
                        dm.username = member.username;
                        repaired = true;
                    }
                }
            }
        });
        if (repaired) {
            saveJoinedDMs();
        }
    } catch(e) {
        joinedDMs = [];
    }
}

function addJoinedDM(peerId, optionalName = null) {
    if (joinedDMs.some(d => d.id === peerId)) {
        // If it exists but username is 'Bilinmeyen Kullanıcı' and we now have a valid optionalName, update it!
        const existing = joinedDMs.find(d => d.id === peerId);
        if (existing && existing.username === 'Bilinmeyen Kullanıcı' && optionalName) {
            existing.username = optionalName;
            saveJoinedDMs();
            renderChannelPanel();
        }
        return;
    }
    
    let username = optionalName || 'Bilinmeyen Kullanıcı';
    let profilePic = '';
    let status = 'online';
    
    const member = activeServer.members.get(peerId);
    if (member) {
        username = member.username;
        profilePic = member.profilePic || '';
        status = member.status || 'online';
    } else {
        const friend = friends.find(f => f.id === peerId);
        if (friend) {
            username = friend.name;
        }
    }
    
    joinedDMs.push({
        id: peerId,
        username: username,
        profilePic: profilePic,
        status: status
    });
    
    saveJoinedDMs();
    renderChannelPanel();
}

function sendDirectMessage(targetId, text, fileObj = null) {
    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msg = {
        id: msgId,
        channelId: targetId,
        senderId: myId,
        senderName: myUsername,
        text,
        file: fileObj,
        time
    };
    if (activeReplyMessage) {
        msg.replyTo = { ...activeReplyMessage };
        window.cancelReply();
    }
    
    messages.push(msg);
    persistMessage(msg);
    playTone('msg-send');
    renderMessages();
    
    const targetMember = activeServer.members.get(targetId);
    const targetFriend = friends.find(f => f.id === targetId);
    const targetName = targetMember ? targetMember.username : (targetFriend ? targetFriend.name : null);
    addJoinedDM(targetId, targetName);
    
    const packet = {
        id: msgId,
        type: 'dm',
        targetId: targetId,
        senderId: myId,
        senderName: myUsername,
        text,
        file: fileObj,
        time
    };
    if (msg.replyTo) packet.replyTo = msg.replyTo;
    
    let conn = directConnections.get(targetId);
    if (conn && conn.open) {
        conn.send(packet);
    } else if (conn && !conn.open) {
        console.log("[ALCORD P2P] Direct connection exists but is opening. Queueing DM.");
        conn.on('open', () => {
            conn.send(packet);
        });
    } else {
        // Fallback 1: If target is in active server connections as a member (if we are host)
        const serverConn = connections.get(targetId);
        if (serverConn && serverConn.open) {
            serverConn.send(packet);
        }
        // Fallback 2: Route through host connection
        else if (hostConnection && hostConnection.open) {
            hostConnection.send(packet);
        }
        // Primary P2P fallback: Open a direct connection and send!
        else {
            console.log("[ALCORD P2P] Opening new direct P2P channel to:", targetId);
            conn = peer.connect(targetId, { metadata: { type: 'dm-connection' }, reliable: true });
            directConnections.set(targetId, conn);
            setupDirectConnection(conn);
            
            conn.on('open', () => {
                console.log("[ALCORD P2P] Direct channel opened asynchronously, sending DM.");
                conn.send(packet);
            });
        }
    }
}

function triggerNotification(title, body) {
    if (document.hasFocus()) return;
    
    if (Notification.permission === 'granted') {
        try {
            new Notification(title, {
                body: body,
                icon: 'icon.png'
            });
        } catch(e){}
    }
}

// Request desktop notification permission on load
if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    try { Notification.requestPermission(); } catch(e){}
}

// ---------------- SPEAKING DETECTOR (RMS ANALYSIS) ----------------

function startSpeakingDetector() {
    if (speakingIntervalId) clearInterval(speakingIntervalId);
    
    speakingIntervalId = setInterval(() => {
        const now = Date.now();
        
        remoteGainNodes.forEach((gainNode, peerId) => {
            let analyser = remoteAnalysers.get(peerId);
            if (!analyser) {
                try {
                    const ctx = activeAudioCtx;
                    if (ctx) {
                        analyser = ctx.createAnalyser();
                        analyser.fftSize = 256;
                        gainNode.connect(analyser);
                        remoteAnalysers.set(peerId, analyser);
                    }
                } catch(e){}
            }
            
            if (analyser) {
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteTimeDomainData(dataArray);
                
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const val = (dataArray[i] - 128) / 128;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / bufferLength);
                
                const isCurrentlyLoud = rms > 0.005; // highly sensitive voice activation
                
                if (isCurrentlyLoud) {
                    if (!speakingStartTimes.has(peerId)) {
                        speakingStartTimes.set(peerId, now);
                    }
                    const duration = now - speakingStartTimes.get(peerId);
                    const isSpeaking = duration >= 500; // must speak continuously for 500ms
                    const wasSpeaking = speakingUsers.has(peerId);
                    
                    if (isSpeaking) {
                        speakingUsers.add(peerId);
                    }
                    
                    if (isSpeaking !== wasSpeaking) {
                        renderChannelPanel();
                    }
                } else {
                    speakingStartTimes.delete(peerId);
                    const wasSpeaking = speakingUsers.has(peerId);
                    if (wasSpeaking) {
                        speakingUsers.delete(peerId);
                        renderChannelPanel();
                    }
                }
            }
        });
        
        // Local microphone analysis
        const streamToAnalyze = rawLocalStream || localStream;
        if (streamToAnalyze && activeAudioCtx) {
            let analyser = localVolumeAnalyser;
            if (!analyser) {
                try {
                    analyser = activeAudioCtx.createAnalyser();
                    analyser.fftSize = 256;
                    
                    const localSource = activeAudioCtx.createMediaStreamSource(streamToAnalyze);
                    localSource.connect(analyser);
                    localVolumeAnalyser = analyser;
                } catch(e){}
            }
            
            if (analyser) {
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteTimeDomainData(dataArray);
                
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const val = (dataArray[i] - 128) / 128;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / bufferLength);
                
                const trackMuted = !streamToAnalyze.getAudioTracks()[0] || !streamToAnalyze.getAudioTracks()[0].enabled || streamToAnalyze.getAudioTracks()[0].muted;
                const isMutedLocal = isMuted || trackMuted;
                const isCurrentlyLoud = rms > 0.005 && !isMutedLocal;
                
                if (isCurrentlyLoud) {
                    if (!speakingStartTimes.has(myId)) {
                        speakingStartTimes.set(myId, now);
                    }
                    const duration = now - speakingStartTimes.get(myId);
                    const isSpeaking = duration >= 500; // must speak continuously for 500ms
                    const wasSpeaking = speakingUsers.has(myId);
                    
                    if (isSpeaking) {
                        speakingUsers.add(myId);
                    }
                    
                    if (isSpeaking !== wasSpeaking) {
                        renderChannelPanel();
                    }
                } else {
                    speakingStartTimes.delete(myId);
                    const wasSpeaking = speakingUsers.has(myId);
                    if (wasSpeaking) {
                        speakingUsers.delete(myId);
                        renderChannelPanel();
                    }
                }
            }
        } else {
            speakingStartTimes.delete(myId);
            if (speakingUsers.has(myId)) {
                speakingUsers.delete(myId);
                renderChannelPanel();
            }
        }
    }, 120);
}

// Start detector on launch
// Start detector on launch
startSpeakingDetector();

window.toggleStatusDropdown = function(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('statusDropdown');
    if (!dropdown) return;
    if (dropdown.classList.contains('hidden')) {
        dropdown.classList.remove('hidden');
        setTimeout(() => dropdown.classList.remove('opacity-0', 'translate-y-1'), 10);
    } else {
        dropdown.classList.add('opacity-0', 'translate-y-1');
        setTimeout(() => dropdown.classList.add('hidden'), 150);
    }
};

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('statusDropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.add('opacity-0', 'translate-y-1');
        setTimeout(() => dropdown.classList.add('hidden'), 150);
    }
});

window.changeMyStatus = function(statusVal) {
    myStatus = statusVal;
    localStorage.setItem('os_my_status', statusVal);
    
    const statusColors = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-rose-500', invisible: 'bg-[#555]' };
    const statusTexts = { online: 'Çevrimiçi', idle: 'Boşta', dnd: 'Rahatsız Etmeyin', invisible: 'Çevrimdışı' };
    const statusShadows = {
        online: 'shadow-[0_0_6px_rgba(16,185,129,0.6)]',
        idle: 'shadow-[0_0_6px_rgba(245,158,11,0.6)]',
        dnd: 'shadow-[0_0_6px_rgba(239,68,68,0.6)]',
        invisible: 'shadow-[0_0_6px_rgba(85,85,85,0.6)]'
    };
    
    const myStatusDot = document.getElementById('myStatusDot');
    const myStatusText = document.getElementById('myStatusText');
    if (myStatusDot) myStatusDot.className = `absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#09090b] ${statusColors[statusVal]} ${statusShadows[statusVal]}`;
    if (myStatusText) myStatusText.textContent = statusTexts[statusVal] || statusVal;
    
    const profileCardStatusDot = document.getElementById('profileCardStatusDot');
    const profileCardStatusText = document.getElementById('profileCardStatusText');
    if (profileCardStatusDot) profileCardStatusDot.className = `w-2.5 h-2.5 rounded-full ${statusColors[statusVal]} shrink-0`;
    if (profileCardStatusText) profileCardStatusText.textContent = statusTexts[statusVal] || statusVal;

    const dropdown = document.getElementById('statusDropdown');
    if (dropdown) {
        dropdown.classList.add('opacity-0', 'translate-y-1');
        setTimeout(() => dropdown.classList.add('hidden'), 150);
    }

    if (typeof isHost !== 'undefined' && isHost) {
        if (typeof activeServer !== 'undefined' && activeServer) {
            const myMember = activeServer.members.get(myId);
            if (myMember) {
                myMember.status = myStatus;
            }
            broadcastServerState();
            renderMembers();
        }
    } else {
        if (typeof hostConnection !== 'undefined' && hostConnection && hostConnection.open) {
            hostConnection.send({
                type: 'status-update',
                peerId: myId,
                status: myStatus
            });
        }
    }
};

window.showUserProfileCard = function(peerId) {
    const member = activeServer.members.get(peerId) || { username: peerId === myId ? myUsername : 'Bilinmeyen Kullanıcı', profilePic: peerId === myId ? myProfilePic : '', status: peerId === myId ? myStatus : 'online' };
    
    const cardModal = document.getElementById('profileCardModal');
    const avatarEl = document.getElementById('profileCardAvatar');
    const usernameEl = document.getElementById('profileCardUsername');
    const dotEl = document.getElementById('profileCardStatusDot');
    const statusTextEl = document.getElementById('profileCardStatusText');
    const peerIdEl = document.getElementById('profileCardPeerId');
    const dmBtn = document.getElementById('profileCardDmBtn');
    const copyBtn = document.getElementById('btnCopyProfilePeerId');
    
    if (!cardModal) return;
    
    usernameEl.textContent = member.username;
    peerIdEl.textContent = peerId;
    
    const avatarHtml = member.profilePic 
        ? `<img src="${member.profilePic}" class="w-full h-full object-cover">` 
        : member.username.substring(0,1).toUpperCase();
    avatarEl.innerHTML = avatarHtml;
    
    const statusColors = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-rose-500', invisible: 'bg-[#555]' };
    const statusTexts = { online: 'Çevrimiçi', idle: 'Boşta', dnd: 'Rahatsız Etmeyin', invisible: 'Çevrimdışı' };
    
    const statusVal = member.status || 'online';
    dotEl.className = `w-2.5 h-2.5 rounded-full ${statusColors[statusVal]}`;
    statusTextEl.textContent = statusTexts[statusVal];
    

    // Dynamic Role Badge rendering inside the profile card
    const existingBadge = document.getElementById('profileCardRoleBadge');
    if (existingBadge) existingBadge.remove();
    
    let badgeHtml = '';
    const isPeerHost = peerId === currentServerId;
    
    // Find matching role
    const currentMemberObj = activeServer.members.get(peerId);
    const currentRoleId = currentMemberObj ? (currentMemberObj.roleId || (currentMemberObj.role === 'owner' ? 'role_owner' : (currentMemberObj.role === 'admin' ? 'role_admin' : 'role_member'))) : (isPeerHost ? 'role_owner' : 'role_member');
    
    const matchingRole = (activeServer.roles || []).find(r => r.id === currentRoleId) || { name: isPeerHost ? 'Kurucu' : 'Üye', color: isPeerHost ? '#f59e0b' : '#94a3b8' };
    
    badgeHtml = `<span id="profileCardRoleBadge" class="mt-1 px-2 py-0.5 rounded text-[10px] font-semibold border shadow-sm" style="background-color: ${matchingRole.color}15; color: ${matchingRole.color}; border-color: ${matchingRole.color}30;" title="${matchingRole.name}">${matchingRole.name}</span>`;
    
    if (badgeHtml) {
        statusTextEl.insertAdjacentHTML('afterend', badgeHtml);
    }
    
    // Toggle Admin/Role dropdown
    const existingAuthBtn = document.getElementById('profileCardAuthBtn');
    if (existingAuthBtn) existingAuthBtn.remove();
    
    const existingRoleSel = document.getElementById('profileCardRoleSelectorContainer');
    if (existingRoleSel) existingRoleSel.remove();
    
    if (isHost && peerId !== myId) {
        const rolesContainer = document.createElement('div');
        rolesContainer.id = 'profileCardRoleSelectorContainer';
        rolesContainer.className = 'w-full flex flex-col gap-1 mt-1';
        
        let optionsHtml = '';
        (activeServer.roles || []).forEach(role => {
            if (role.id === 'role_owner') return; // Cannot assign Owner role to others
            const isSelected = currentRoleId === role.id;
            optionsHtml += `<option value="${role.id}" ${isSelected ? 'selected' : ''} style="background-color: #111; color: ${role.color}; font-weight: bold;">${role.name}</option>`;
        });
        
        rolesContainer.innerHTML = `
            <label class="text-[9px] font-bold text-[#555] uppercase tracking-wider pl-1">Rol Ata</label>
            <select onchange="window.togglePeerRole('${peerId}', this.value)" class="w-full bg-[#111] hover:bg-white/[0.02] border border-white/[0.06] text-white font-medium py-2 px-3 rounded-xl text-[12px] transition-colors focus:outline-none cursor-pointer">
                ${optionsHtml}
            </select>
        `;
        dmBtn.parentNode.insertBefore(rolesContainer, dmBtn.nextSibling);
    }
    
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(peerId);
            showToast('Kimlik kopyalandı.', 'success');
        };
    }
    
    if (dmBtn) {
        if (peerId === myId) {
            dmBtn.classList.add('hidden');
        } else {
            dmBtn.classList.remove('hidden');
            dmBtn.onclick = () => {
                closeModal('profileCardModal');
                activeDMUserId = peerId;
                activeTextChannelId = null;
                addJoinedDM(peerId, member.username);
                renderServerView();
            };
        }
    }
    
    openModal('profileCardModal');
};

window.togglePeerRole = function(peerId, roleId) {
    if (!isHost) return;
    const member = activeServer.members.get(peerId);
    if (!member) return;
    
    member.roleId = roleId;
    
    // Parity with Phase 4 authorization role: if it is role_admin, set role to 'admin', else 'member'
    const isPeerAdmin = roleId === 'role_admin';
    member.role = isPeerAdmin ? 'admin' : 'member';
    
    if (isPeerAdmin) {
        serverAdminIds.add(peerId);
    } else {
        serverAdminIds.delete(peerId);
    }
    localStorage.setItem('os_my_server_admins', JSON.stringify(Array.from(serverAdminIds)));
    
    // Save assignment persistently in serverMemberRoles map
    serverMemberRoles.set(peerId, roleId);
    localStorage.setItem('os_my_server_member_roles', JSON.stringify(Array.from(serverMemberRoles.entries())));
    
    broadcastServerState();
    
    const roleObj = (activeServer.roles || []).find(r => r.id === roleId);
    const roleName = roleObj ? roleObj.name : 'Üye';
    showToast(`${member.username} isimli kullanıcıya "${roleName}" rolü atandı.`, "success");
    
    // Refresh card instantly
    showUserProfileCard(peerId);
};

window.togglePeerAdminRole = function(peerId, makeAdmin) {
    // Left for backwards compatibility, delegates to togglePeerRole
    window.togglePeerRole(peerId, makeAdmin ? 'role_admin' : 'role_member');
};

window.initRolesModal = function() {
    if (!isHost || !activeServer || !activeServer.roles) return;
    
    const modalRolesList = document.getElementById('modalRolesList');
    if (!modalRolesList) return;
    modalRolesList.innerHTML = '';
    
    activeServer.roles.forEach(role => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isSelected = activeRoleEditingId === role.id;
        btn.className = `w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[12px] font-medium transition-colors ${
            isSelected ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-[#aaa] hover:bg-white/[0.02] border border-transparent'
        }`;
        btn.innerHTML = `
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${role.color}"></span>
            <span class="truncate flex-1">${role.name}</span>
        `;
        btn.onclick = () => {
            window.selectRoleEdit(role.id);
        };
        modalRolesList.appendChild(btn);
    });
    
    // If no role selected, select first
    if (!activeRoleEditingId && activeServer.roles.length > 0) {
        window.selectRoleEdit(activeServer.roles[0].id);
    } else if (activeRoleEditingId) {
        window.selectRoleEdit(activeRoleEditingId);
    }
};

window.selectRoleEdit = function(roleId) {
    activeRoleEditingId = roleId;
    
    // Repopulate left list to show active highlight
    const modalRolesList = document.getElementById('modalRolesList');
    if (modalRolesList) {
        Array.from(modalRolesList.children).forEach((btn, index) => {
            const role = activeServer.roles[index];
            if (!role) return;
            const isSelected = role.id === roleId;
            btn.className = `w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[12px] font-medium transition-colors ${
                isSelected ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-[#aaa] hover:bg-white/[0.02] border border-transparent'
            }`;
        });
    }
    
    const role = (activeServer.roles || []).find(r => r.id === roleId);
    const editArea = document.getElementById('roleEditArea');
    if (!editArea) return;
    
    if (!role) {
        editArea.innerHTML = `<div class="text-[11px] text-[#555] italic flex items-center justify-center h-full w-full">Düzenlemek için soldan bir rol seçin.</div>`;
        return;
    }
    
    const isDefaultRole = role.id === 'role_owner' || role.id === 'role_member' || role.id === 'role_admin';
    const deleteBtnHtml = isDefaultRole 
        ? `<div class="text-[10px] text-slate-500 italic mt-2"><i class="fa-solid fa-lock mr-1"></i> Varsayılan roller silinemez.</div>`
        : `<button type="button" onclick="window.deleteRole('${role.id}')" class="mt-4 w-full py-2 rounded-xl text-[12px] font-semibold bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent transition-colors focus:outline-none flex items-center justify-center gap-1.5 shadow"><i class="fa-regular fa-trash-can"></i> Rolü Sil</button>`;
        
    editArea.innerHTML = `
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-[#555] uppercase tracking-wider pl-1">Rol İsmi</label>
                <input type="text" id="editRoleNameInput" value="${role.name}" class="w-full bg-[#111] border border-white/[0.06] rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="Rol adı girin..." oninput="window.saveRoleNameColor('${role.id}', this.value, null)">
            </div>
            
            <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-[#555] uppercase tracking-wider pl-1">Rol Rengi</label>
                <div class="flex items-center gap-3 bg-black/40 border border-white/[0.04] p-3 rounded-xl">
                    <input type="color" value="${role.color}" class="w-10 h-10 rounded bg-transparent border-0 cursor-pointer outline-none shrink-0" oninput="window.saveRoleNameColor('${role.id}', null, this.value)">
                    <div class="flex flex-col">
                        <span id="editRoleColorHex" class="font-mono text-xs text-white font-semibold uppercase">${role.color}</span>
                        <span class="text-[9px] text-[#555] font-semibold mt-0.5 uppercase tracking-wider">İstediğiniz rengi seçin</span>
                    </div>
                </div>
            </div>
            
            ${deleteBtnHtml}
        </div>
    `;
};

window.createNewRole = function() {
    if (!isHost || !activeServer) return;
    
    const roleId = 'role_' + Date.now();
    const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newRole = {
        id: roleId,
        name: 'Yeni Rol',
        color: randomColor,
        order: (activeServer.roles || []).length + 1
    };
    
    if (!activeServer.roles) activeServer.roles = [];
    activeServer.roles.push(newRole);
    
    localStorage.setItem('os_my_server_roles', JSON.stringify(activeServer.roles));
    activeRoleEditingId = roleId;
    
    window.initRolesModal();
    broadcastServerState();
    showToast("Yeni rol başarıyla oluşturuldu.", "success");
};

window.deleteRole = function(roleId) {
    if (!isHost || !activeServer || roleId === 'role_owner' || roleId === 'role_member' || roleId === 'role_admin') return;
    
    activeServer.roles = (activeServer.roles || []).filter(r => r.id !== roleId);
    localStorage.setItem('os_my_server_roles', JSON.stringify(activeServer.roles));
    
    // Clean up role assignments for deleted role, reset to role_member
    let cleaned = false;
    serverMemberRoles.forEach((rId, pId) => {
        if (rId === roleId) {
            serverMemberRoles.set(pId, 'role_member');
            
            // Clean active map
            const memberObj = activeServer.members.get(pId);
            if (memberObj) {
                memberObj.roleId = 'role_member';
                memberObj.role = 'member';
            }
            cleaned = true;
        }
    });
    if (cleaned) {
        localStorage.setItem('os_my_server_member_roles', JSON.stringify(Array.from(serverMemberRoles.entries())));
    }
    
    activeRoleEditingId = activeServer.roles.length > 0 ? activeServer.roles[0].id : null;
    
    window.initRolesModal();
    broadcastServerState();
    showToast("Rol silindi.", "info");
};

window.saveRoleNameColor = function(roleId, name, color) {
    if (!isHost || !activeServer) return;
    
    const role = (activeServer.roles || []).find(r => r.id === roleId);
    if (!role) return;
    
    let changed = false;
    if (name !== null && name.trim() !== '') {
        role.name = name.trim();
        changed = true;
    }
    if (color !== null) {
        role.color = color;
        changed = true;
        
        // Update hex text dynamically
        const hex = document.getElementById('editRoleColorHex');
        if (hex) hex.textContent = color.toUpperCase();
    }
    
    if (changed) {
        localStorage.setItem('os_my_server_roles', JSON.stringify(activeServer.roles));
        
        // Dynamic left list button update to avoid full reload flickers
        const modalRolesList = document.getElementById('modalRolesList');
        if (modalRolesList) {
            const index = activeServer.roles.findIndex(r => r.id === roleId);
            if (index !== -1 && modalRolesList.children[index]) {
                const btn = modalRolesList.children[index];
                const dot = btn.querySelector('span');
                const label = btn.querySelector('.truncate');
                if (dot) dot.style.backgroundColor = role.color;
                if (label) label.textContent = role.name;
            }
        }
        
        broadcastServerState();
    }
};

function switchServer(id) {
    if (id === currentServerId) return;
    
    if(hostConnection) {
        hostConnection.close();
        hostConnection = null;
    }
    leaveVoiceChannel();
    
    activeDMUserId = null;
    localStorage.setItem('os_last_server', id);
    loadJoinedDMs();
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
        const isSelf = srv.id === myId;
        
        // 1. Dropdown Menü Listesi
        const btn = document.createElement('button');
        btn.className = `w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors text-[13px] group/srv ${
            isActive 
            ? 'bg-[#111] border border-[#1A1A1A] text-[#fff] font-medium' 
            : 'hover:bg-[#111]/50 text-[#888] hover:text-[#ededed]'
        }`;
        btn.setAttribute('data-server-id', srv.id);
        
        btn.innerHTML = `
            <div class="w-4 h-4 rounded bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-[9px] font-bold mr-3 shadow-[0_0_12px_rgba(147,51,234,0.4)] shrink-0">${srv.name.substring(0,1).toUpperCase()}</div>
            <span class="truncate flex-1 font-medium">${srv.name}</span>
            ${isActive ? '<i class="fa-solid fa-check text-blue-500 text-[10px] shrink-0 ml-2"></i>' : '<span class="status-indicator ml-2"></span>'}
        `;
        
        if (!isActive) {
            btn.onclick = () => {
                workspaceDropdown.classList.add('opacity-0', '-translate-y-2');
                setTimeout(() => workspaceDropdown.classList.add('hidden'), 200);
                switchServer(srv.id);
            };
        } else {
            btn.onclick = () => {
                workspaceDropdown.classList.add('opacity-0', '-translate-y-2');
                setTimeout(() => workspaceDropdown.classList.add('hidden'), 200);
                if (currentView === 'home') {
                    renderServerView();
                }
            };
        }
        
        serverList.appendChild(btn);

        // 2. Ana Sayfa Hızlı Erişim Kartları
        const card = document.createElement('div');
        card.className = `glass-modal border border-white/[0.04] rounded-xl p-4 flex items-center justify-between transition-all group`;
        card.setAttribute('data-server-card', srv.id);
        
        const statusBadgeId = `status-badge-${srv.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        card.innerHTML = `
            <div class="flex items-center min-w-0 mr-4">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-[13px] font-bold mr-4 shadow-[0_0_15px_rgba(147,51,234,0.3)] shrink-0">${srv.name.substring(0,1).toUpperCase()}</div>
                <div class="min-w-0 flex flex-col text-left">
                    <span class="text-white text-[13px] font-semibold truncate">${srv.name}</span>
                    <span class="text-[#555] text-[10px] font-mono mt-0.5 truncate select-all">${srv.id}</span>
                </div>
            </div>
            <div class="flex items-center gap-2" id="${statusBadgeId}">
                ${isActive 
                    ? '<span class="text-[11px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Bağlı</span>'
                    : '<span class="text-[11px] text-[#555] flex items-center gap-1.5"><i class="fa-solid fa-spinner fa-spin text-[9px]"></i> Kontrol ediliyor...</span>'
                }
            </div>
        `;
        
        if (isActive) {
            card.classList.add('cursor-pointer', 'hover:bg-white/[0.015]', 'hover:scale-[1.01]');
            card.onclick = () => {
                if (currentView === 'home') {
                    renderServerView();
                }
            };
        }
        
        homeServerList.appendChild(card);

        // 3. Probe online status for non-active, non-self servers
        if (!isActive && !isSelf) {
            probeServerStatus(srv.id, statusBadgeId, card, btn);
        } else if (isSelf && !isActive) {
            // Own server is always "available" to create
            const badge = document.getElementById(statusBadgeId);
            if (badge) {
                badge.innerHTML = `<button class="text-[11px] text-blue-400 group-hover:text-blue-300 font-semibold bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/10 px-3 py-1 rounded-lg transition-colors">Bağlan</button>`;
            }
            card.classList.add('cursor-pointer', 'hover:bg-white/[0.015]', 'hover:scale-[1.01]');
            card.onclick = () => switchServer(srv.id);
        }
    });
}

function probeServerStatus(serverId, badgeId, cardEl, btnEl) {
    let resolved = false;
    
    const probeConn = peer.connect(serverId, { reliable: true });
    
    const timeout = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        try { probeConn.close(); } catch(e){}
        markServerOffline(serverId, badgeId, cardEl, btnEl);
    }, 4000);
    
    probeConn.on('open', () => {
        if (resolved) { try { probeConn.close(); } catch(e){} return; }
        resolved = true;
        clearTimeout(timeout);
        probeConn.close();
        markServerOnline(serverId, badgeId, cardEl, btnEl);
    });
    
    probeConn.on('error', () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        markServerOffline(serverId, badgeId, cardEl, btnEl);
    });
}

function markServerOnline(serverId, badgeId, cardEl, btnEl) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        badge.innerHTML = `<button class="text-[11px] text-blue-400 group-hover:text-blue-300 font-semibold bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/10 px-3 py-1 rounded-lg transition-colors">Bağlan</button>`;
    }
    cardEl.classList.add('cursor-pointer', 'hover:bg-white/[0.015]', 'hover:scale-[1.01]');
    cardEl.onclick = () => switchServer(serverId);
    
    // Enable dropdown button too
    if (btnEl) {
        btnEl.classList.remove('opacity-40', 'pointer-events-none');
    }
}

function markServerOffline(serverId, badgeId, cardEl, btnEl) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        badge.innerHTML = `<span class="text-[11px] font-medium text-red-400/80 bg-red-500/10 border border-red-500/15 px-2.5 py-0.5 rounded-md flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-red-500/60"></span> Açık Değil</span>`;
    }
    cardEl.classList.add('opacity-40');
    cardEl.classList.remove('cursor-pointer', 'hover:bg-white/[0.015]', 'hover:scale-[1.01]');
    cardEl.style.pointerEvents = 'none';
    
    // Disable dropdown button too
    if (btnEl) {
        btnEl.classList.add('opacity-40', 'pointer-events-none');
        const statusSpan = btnEl.querySelector('.status-indicator');
        if (statusSpan) {
            statusSpan.innerHTML = '<i class="fa-solid fa-circle text-[5px] text-red-500/60"></i>';
        }
    }
}

function renderHome() {
    homePanel.classList.remove('hidden');
    homePanel.style.display = 'flex';
    channelPanel.classList.add('hidden');
    mainChatArea.classList.add('hidden');
    membersPanel.classList.add('hidden');
    
    currentView = 'home';
    
    if (!activeVoiceChannelId && !activeCall) {
        currentServerId = null;
        isHost = false;
    }
    
    currentServerIcon.innerHTML = `<i class="fa-solid fa-house"></i>`;
    currentServerIcon.className = "w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold mr-3 shadow-[0_0_12px_rgba(37,99,235,0.5)]";
    currentServerName.textContent = "Ana Sayfa";
    renderJoinedServersList();
    renderGuildBar();
    switchFriendsTab(friendsActiveTab || 'active');
}

window.goHome = function() {
    renderHome();
};

function renderGuildBar() {
    const list = document.getElementById('guildServerList');
    if (!list) return;
    list.innerHTML = '';

    joinedServers.forEach(srv => {
        const btn = document.createElement('div');
        const isActive = (currentView === 'server') && (currentServerId === srv.id);
        btn.className = `guild-icon ${isActive ? 'active' : ''} relative`;
        btn.title = srv.name;
        
        const hasUnread = srv.id === currentServerId && getTotalUnreadForServer() > 0;
        const unreadDot = hasUnread ? `<span class="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-white border border-[#0A0A0F] z-10 animate-pulse"></span>` : '';
        
        const iconHtml = srv.icon 
            ? `<img src="${srv.icon}" class="w-full h-full object-cover transition-all duration-300 rounded-[24px] group-hover:rounded-[16px] ${isActive ? 'rounded-[16px]' : ''}">`
            : srv.name.substring(0, 1).toUpperCase();
            
        btn.innerHTML = `
            ${iconHtml}
            ${unreadDot}
            <span class="guild-pill ${isActive ? 'active' : ''}"></span>
        `;
        btn.addEventListener('mouseenter', () => {
            const pill = btn.querySelector('.guild-pill');
            if (pill && !isActive) pill.classList.add('hover');
        });
        btn.addEventListener('mouseleave', () => {
            const pill = btn.querySelector('.guild-pill');
            if (pill && !isActive) pill.classList.remove('hover');
        });
        btn.addEventListener('click', () => {
            if (currentServerId === srv.id) {
                renderServerView();
            } else {
                joinServer(srv.id);
            }
        });
        list.appendChild(btn);
    });

    // Update home button pill
    const homeBtn = document.getElementById('guildHomeBtn');
    if (homeBtn) {
        const pill = homeBtn.querySelector('.guild-pill');
        if (pill) {
            if (currentView === 'home') {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        }
    }
}

// Wire up guildAddServerBtn
const guildAddServerBtn = document.getElementById('guildAddServerBtn');
if (guildAddServerBtn) {
    guildAddServerBtn.addEventListener('click', () => {
        openModal('serverModal');
    });
}

function renderServerView() {
    homePanel.classList.add('hidden');
    homePanel.style.display = 'none';
    channelPanel.classList.remove('hidden');
    mainChatArea.classList.remove('hidden');
    
    currentView = 'server';
    
    if (activeServer.icon) {
        currentServerIcon.innerHTML = `<img src="${activeServer.icon}" class="w-full h-full object-cover rounded">`;
        currentServerIcon.className = "w-5 h-5 rounded flex items-center justify-center mr-3 shadow-[0_0_12px_rgba(255,255,255,0.08)] overflow-hidden shrink-0";
    } else {
        currentServerIcon.innerHTML = activeServer.name.substring(0, 1).toUpperCase();
        currentServerIcon.className = "w-5 h-5 rounded bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-[12px] font-bold mr-3 shadow-[0_0_12px_rgba(147,51,234,0.4)] shrink-0";
    }
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
    
    const hostManageRolesBtn = document.getElementById('hostManageRolesBtn');
    if (hostManageRolesBtn) {
        hostManageRolesBtn.classList.toggle('hidden', !isHost);
    }
    
    // Load message history from localStorage
    loadMessagesForActiveChannel();
    
    renderJoinedServersList();
    renderChannelPanel();
    renderMembers();
    
    if (activeDMUserId) {
        const dmUser = joinedDMs.find(d => d.id === activeDMUserId) || activeServer.members.get(activeDMUserId);
        if (dmUser) {
            currentChannelName.innerHTML = `<i class="fa-regular fa-user mr-1.5 text-blue-400"></i> ${dmUser.username}`;
        }
        renderMessages();
    } else if (activeTextChannelId) {
        const ch = activeServer.channels.find(c => c.id === activeTextChannelId);
        if (ch) {
            currentChannelName.innerHTML = `<span class="text-[#555] font-mono mr-1">#</span> ${ch.name}`;
        }
        renderMessages();
    }
    renderGuildBar();
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
    
    const addTextBtn = document.getElementById('hostAddTextChannelBtn');
    const addVoiceBtn = document.getElementById('hostAddVoiceChannelBtn');
    const canManage = canManageChannels();
    if (addTextBtn) addTextBtn.classList.toggle('hidden', !canManage);
    if (addVoiceBtn) addVoiceBtn.classList.toggle('hidden', !canManage);
    
    // 1. Direct Messages Rendering
    const dmList = document.getElementById('dmList');
    if (dmList) {
        dmList.innerHTML = '';
        if (joinedDMs.length === 0) {
            dmList.innerHTML = `<div class="px-3 py-1.5 text-[11px] text-[#555] italic">Sohbet yok</div>`;
        } else {
            joinedDMs.forEach(dm => {
                const div = document.createElement('div');
                const isSelected = activeDMUserId === dm.id;
                div.className = `channel-item group flex items-center px-2 py-1.5 cursor-pointer rounded-lg ${isSelected ? 'active' : 'text-[#888]'}`;
                
                // Dynamically resolve display name, profile picture, and status
                let displayName = dm.username;
                let profilePic = dm.profilePic || '';
                let statusVal = dm.status || 'online';
                
                const member = activeServer.members.get(dm.id);
                if (member) {
                    displayName = member.username;
                    profilePic = member.profilePic || '';
                    statusVal = member.status || 'online';
                } else {
                    const friend = friends.find(f => f.id === dm.id);
                    if (friend) {
                        displayName = friend.name;
                        statusVal = friend.isOnline ? 'online' : 'invisible';
                    }
                }
                
                // If it is STILL the default 'Kullanıcı' or 'Bilinmeyen Kullanıcı' (e.g. from historical data),
                // check message history for any incoming message where the sender was this user, and extract their actual name!
                if (displayName === 'Kullanıcı' || displayName === 'Bilinmeyen Kullanıcı') {
                    const histMsg = messages.find(m => m.channelId === dm.id && m.senderId === dm.id);
                    if (histMsg && histMsg.senderName && histMsg.senderName !== 'Kullanıcı' && histMsg.senderName !== 'Bilinmeyen Kullanıcı') {
                        displayName = histMsg.senderName;
                        // Proactively heal the loaded DMs state so it persists globally
                        dm.username = displayName;
                        saveJoinedDMs();
                    }
                }

                const statusColors = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-rose-500', invisible: 'bg-[#555]' };
                const dotColor = statusColors[statusVal] || 'bg-emerald-500';
                
                const avatarHtml = profilePic
                    ? `<img src="${profilePic}" class="w-full h-full object-cover">`
                    : displayName.substring(0, 1).toUpperCase();
                
                const unreadCount = unreadCounts.get(dm.id) || 0;
                const unreadHtml = unreadCount > 0 && !isSelected 
                    ? `<span class="unread-badge mr-1">${unreadCount}</span>` 
                    : '';
                div.innerHTML = `
                    <div class="w-4 h-4 rounded bg-[#222] flex items-center justify-center mr-2 text-[8px] text-[#aaa] font-bold shrink-0 overflow-hidden relative">
                        ${avatarHtml}
                        <span class="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ${dotColor} border border-black/40 shrink-0"></span>
                    </div>
                    <span class="truncate flex-1 font-medium text-[13px] tracking-wide">${displayName}</span>
                    ${unreadHtml}
                `;
                div.onclick = () => {
                    activeDMUserId = dm.id;
                    activeTextChannelId = null;
                    clearUnread(dm.id);
                    renderServerView();
                };
                dmList.appendChild(div);
            });
        }
    }
    
    // 2. Channels Rendering
    activeServer.channels.forEach(ch => {
        const div = document.createElement('div');
        if(ch.type === 'text') {
            const isSelected = !activeDMUserId && activeTextChannelId === ch.id;
            div.className = `channel-item group flex items-center px-2 py-1.5 cursor-pointer rounded-lg ${isSelected ? 'active' : 'text-[#888]'}`;
            
            let gearHtml = '';
            if (canManage) {
                gearHtml = `<button onclick="window.openEditChannelModal('${ch.id}', '${ch.name}', 'text', event)" class="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-[#555] hover:text-[#ededed] opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 focus:outline-none" title="Kanalı Düzenle"><i class="fa-solid fa-gear text-[10px]"></i></button>`;
            }
            
            const unreadCount = unreadCounts.get(ch.id) || 0;
            const unreadHtml = unreadCount > 0 && !isSelected 
                ? `<span class="unread-badge mr-1">${unreadCount}</span>` 
                : '';
            div.innerHTML = `
                <span class="text-[#555] group-hover:text-[#888] font-mono mr-2 text-[13px] ${isSelected ? 'text-[#888]' : ''}">#</span>
                <span class="truncate flex-1 font-medium text-[13px] tracking-wide">${ch.name}</span>
                ${unreadHtml}
                ${gearHtml}
            `;
            div.onclick = () => { 
                activeTextChannelId = ch.id; 
                activeDMUserId = null;
                clearUnread(ch.id);
                renderServerView(); 
            };
            textChannelsList.appendChild(div);
        } else {
            div.className = `channel-item group flex flex-col px-2 py-1.5 cursor-pointer rounded-lg ${activeVoiceChannelId === ch.id ? 'active' : 'text-[#888]'}`;
            const header = document.createElement('div');
            header.className = 'flex items-center w-full';
            
            let gearHtml = '';
            if (canManage) {
                gearHtml = `<button onclick="window.openEditChannelModal('${ch.id}', '${ch.name}', 'voice', event)" class="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-[#555] hover:text-[#ededed] opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 focus:outline-none" title="Odayı Düzenle"><i class="fa-solid fa-gear text-[10px]"></i></button>`;
            }
            
            header.innerHTML = `
                <i class="fa-solid fa-volume-low mr-2 text-[11px] text-[#555] group-hover:text-[#888] ${activeVoiceChannelId === ch.id ? 'text-[#888]' : ''}"></i>
                <span class="truncate flex-1 font-medium text-[13px] tracking-wide">${ch.name}</span>
                ${gearHtml}
            `;
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

                    const avatarHtml = u.profilePic 
                        ? `<img src="${u.profilePic}" class="w-full h-full object-cover">` 
                        : u.username.substring(0,1).toUpperCase();

                    const isSpeaking = speakingUsers.has(u.id);
                    const speakingClass = isSpeaking ? 'voice-speaking border-emerald-500 scale-105 transition-all duration-300' : 'transition-all duration-300';
                    const textSpeakingClass = isSpeaking ? 'text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'text-[#aaa] group-hover/voice-user:text-white';

                    usersDiv.innerHTML += `
                        <div class="flex items-center justify-between text-[12px] text-[#888] group/voice-user py-0.5 select-none">
                            <div class="flex items-center min-w-0 flex-1">
                                <div class="w-6 h-6 rounded-full bg-[#222] border border-[#333] flex items-center justify-center mr-2 text-[10px] text-[#aaa] font-bold shrink-0 overflow-hidden ${speakingClass}">${avatarHtml}</div>
                                <span class="truncate transition-colors duration-200 ${textSpeakingClass}">${u.username}</span>
                            </div>
                            ${!isMe ? `
                            <div class="flex items-center gap-1.5 opacity-0 group-hover/voice-user:opacity-100 transition-all ml-2 shrink-0 pr-1">
                                <i class="${initialIcon}" id="vol-icon-${u.id}"></i>
                                <input type="range" min="0" max="20" step="0.1" value="${volume}" 
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
    
    // Apply categories visual states
    const dmContainer = document.getElementById('dmList');
    if (dmContainer) {
        if (collapsedCategories.dm) dmContainer.classList.add('hidden');
        else dmContainer.classList.remove('hidden');
    }
    const textContainer = document.getElementById('textChannelsList');
    if (textContainer) {
        if (collapsedCategories.text) textContainer.classList.add('hidden');
        else textContainer.classList.remove('hidden');
    }
    const voiceContainer = document.getElementById('voiceChannelsList');
    if (voiceContainer) {
        if (collapsedCategories.voice) voiceContainer.classList.add('hidden');
        else voiceContainer.classList.remove('hidden');
    }
}

function renderMembers() {
    membersList.innerHTML = '';
    if (!activeServer || !activeServer.members) return;
    
    const membersArray = Array.from(activeServer.members.entries()).map(([id, data]) => ({id, ...data}));
    onlineCount.textContent = membersArray.length;
    
    // Sort roles by priority
    const rolesList = activeServer.roles || [
        { id: 'role_owner', name: 'Kurucu', color: '#f59e0b', order: 1 },
        { id: 'role_admin', name: 'Yönetici', color: '#a855f7', order: 2 },
        { id: 'role_vip', name: 'VIP', color: '#3b82f6', order: 3 },
        { id: 'role_member', name: 'Üye', color: '#94a3b8', order: 4 }
    ];
    const sortedRoles = [...rolesList].sort((a, b) => (a.order || 99) - (b.order || 99));
    
    sortedRoles.forEach(role => {
        // Find members belonging to this role
        const membersInRole = membersArray.filter(m => {
            const mRoleId = m.roleId || (m.role === 'owner' ? 'role_owner' : (m.role === 'admin' ? 'role_admin' : 'role_member'));
            return mRoleId === role.id;
        });
        
        if (membersInRole.length === 0) return; // don't render empty role categories
        
        // Render Role Category Header
        const header = document.createElement('div');
        header.className = 'text-[9px] font-bold text-[#555] px-2 mt-4 mb-1.5 uppercase tracking-wider select-none flex items-center justify-between';
        header.innerHTML = `<span>${role.name} — ${membersInRole.length}</span>`;
        membersList.appendChild(header);
        
        membersInRole.forEach(m => {
            const div = document.createElement('div');
            div.className = 'flex items-center gap-2.5 px-2 py-1.5 hover:bg-[#111] rounded-lg cursor-pointer group';
            div.onclick = () => showUserProfileCard(m.id);
            
            const avatarHtml = m.profilePic 
                ? `<img src="${m.profilePic}" class="w-full h-full object-cover">` 
                : m.username.substring(0,1).toUpperCase();
                
            const statusColors = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-rose-500', invisible: 'bg-[#555]' };
            const dotColor = statusColors[m.status || 'online'] || 'bg-emerald-500';
            
            const nameColorStyle = `color: ${role.color || '#94a3b8'} !important;`;
                
            div.innerHTML = `
                <div class="relative shrink-0">
                    <div class="w-6 h-6 rounded bg-[#222] border border-[#333] flex items-center justify-center text-[10px] text-[#aaa] font-bold overflow-hidden">
                        ${avatarHtml}
                    </div>
                    <div class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#09090b] ${dotColor}"></div>
                </div>
                <div class="flex flex-col min-w-0 flex-1 justify-center">
                    <div class="flex items-center gap-1.5 min-w-0 font-medium">
                        <span class="truncate text-[13px] transition-colors" style="${nameColorStyle}">${m.username}</span>
                    </div>
                </div>
            `;
            membersList.appendChild(div);
        });
    });
}

// ---------------- TYPING INDICATOR HELPERS ----------------

function updateTypingIndicatorUI() {
    const indicator = document.getElementById('typingIndicator');
    const textEl = document.getElementById('typingUsersText');
    if (!indicator || !textEl) return;
    
    if (activeTypingUsers.size === 0) {
        indicator.classList.add('opacity-0', 'pointer-events-none');
        indicator.classList.remove('opacity-100');
    } else {
        const names = [];
        activeTypingUsers.forEach(peerId => {
            const member = activeServer.members.get(peerId);
            if (member) names.push(member.username);
        });
        
        if (names.length === 0) {
            indicator.classList.add('opacity-0', 'pointer-events-none');
            indicator.classList.remove('opacity-100');
            return;
        }
        
        if (names.length === 1) {
            textEl.textContent = `${names[0]} yazıyor...`;
        } else if (names.length === 2) {
            textEl.textContent = `${names[0]} ve ${names[1]} yazıyor...`;
        } else {
            textEl.textContent = `Birden fazla kişi yazıyor...`;
        }
        
        indicator.classList.remove('opacity-0', 'pointer-events-none');
        indicator.classList.add('opacity-100');
    }
}

function handleTypingReceived(senderId, isTyping, channelId) {
    const activeTarget = activeDMUserId ? activeDMUserId : activeTextChannelId;
    if (channelId !== activeTarget) return; // ignore typing for other channels
    
    // Clear auto-timeout
    if (typingTimeouts.has(senderId)) {
        clearTimeout(typingTimeouts.get(senderId));
        typingTimeouts.delete(senderId);
    }
    
    if (isTyping) {
        activeTypingUsers.add(senderId);
        // Set auto-expire backup timeout (4s)
        const to = setTimeout(() => {
            activeTypingUsers.delete(senderId);
            typingTimeouts.delete(senderId);
            updateTypingIndicatorUI();
        }, 4000);
        typingTimeouts.set(senderId, to);
    } else {
        activeTypingUsers.delete(senderId);
    }
    
    updateTypingIndicatorUI();
}

function sendTypingState(isTyping) {
    localTypingState = isTyping;
    
    const target = activeDMUserId ? activeDMUserId : activeTextChannelId;
    if (!target) return;
    
    const packet = {
        type: 'typing',
        senderId: myId,
        isTyping,
        channelId: target
    };
    
    if (activeDMUserId) {
        const conn = directConnections.get(activeDMUserId);
        if (conn && conn.open) {
            conn.send(packet);
        }
    } else {
        if (!currentServerId) return;
        if (isHost) {
            // Broadcast to clients in this channel
            connections.forEach(conn => {
                if (conn.open && conn.peer !== myId) {
                    conn.send(packet);
                }
            });
        } else {
            if (hostConnection && hostConnection.open) {
                hostConnection.send(packet);
            }
        }
    }
}

function getMessageHistoryKey(channelOrUserId) {
    const srvId = currentServerId || 'home';
    return `os_msg_hist_${srvId}_${channelOrUserId}`;
}

function loadMessagesForActiveChannel() {
    const target = activeDMUserId ? activeDMUserId : activeTextChannelId;
    if (!target) {
        messages = [];
        return;
    }
    const key = getMessageHistoryKey(target);
    try {
        const raw = localStorage.getItem(key);
        messages = raw ? JSON.parse(raw) : [];
    } catch(e) {
        messages = [];
    }
}

function persistMessage(msg) {
    const target = activeDMUserId ? activeDMUserId : activeTextChannelId;
    const dest = msg.channelId || target;
    if (!dest) return;
    
    const key = getMessageHistoryKey(dest);
    try {
        let history = [];
        const raw = localStorage.getItem(key);
        if (raw) history = JSON.parse(raw);
        
        // Remove large file base64 data to avoid localstorage overflow
        const msgToSave = { ...msg };
        if (msgToSave.file && msgToSave.file.data && msgToSave.file.data.length > 50000) {
            msgToSave.file = { ...msgToSave.file, data: '' }; // clear data, keep metadata
        }
        
        history.push(msgToSave);
        
        // Keep last 150 messages in history to save space
        if (history.length > 150) history.shift();
        
        localStorage.setItem(key, JSON.stringify(history));
    } catch(e) {
        console.error("Mesaj kaydedilemedi:", e);
    }
}

function renderMessages() {
    const target = activeDMUserId ? activeDMUserId : activeTextChannelId;
    const channelMessages = messages.filter(m => m.channelId === target);
    
    let headerTitle = activeDMUserId ? "Sohbet" : `Kanal: ${activeTextChannelId}`;
    if (activeDMUserId) {
        const dmUser = joinedDMs.find(d => d.id === activeDMUserId) || activeServer.members.get(activeDMUserId);
        if (dmUser) headerTitle = `${dmUser.username}`;
    }
    
    chatMessages.innerHTML = `
        <div class="mt-auto mb-6 px-2">
            <h1 class="text-2xl font-bold text-[#ededed] mb-1 tracking-tight">${headerTitle}</h1>
            <p class="text-[13px] text-[#666]">${activeDMUserId ? 'Güvenli, uçtan uca özel P2P sohbet' : 'Burası iletişimin başladığı nokta.'}</p>
        </div>
    `;

    let lastDateStr = '';
    channelMessages.forEach(msg => {
        // Date separator
        if (msg.time && msg.senderId !== 'system') {
            const msgDate = new Date();
            const currentDateStr = msgDate.toDateString();
            if (lastDateStr && lastDateStr !== currentDateStr) {
                const sepDiv = document.createElement('div');
                sepDiv.className = 'date-separator';
                sepDiv.innerHTML = `<span>${getDateLabel(msgDate)}</span>`;
                chatMessages.appendChild(sepDiv);
            }
            lastDateStr = currentDateStr;
        }

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
                } else if (f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
                    messageContentHtml = `
                        <div class="mt-2 flex flex-col gap-2 p-3 rounded-xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03] transition-all max-w-[340px] shadow-sm relative group/media-card">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-music text-[14px]"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-[12px] font-medium text-[#ededed] truncate" title="${f.name}">${f.name}</div>
                                    <div class="text-[10px] text-[#666] mt-0.5">${sizeStr}</div>
                                </div>
                                <a href="${f.data}" download="${f.name}" class="w-7 h-7 rounded bg-white/[0.04] hover:bg-emerald-600 hover:text-white flex items-center justify-center text-slate-400 transition-all border border-white/[0.06] shrink-0 shadow-inner" title="İndir">
                                    <i class="fa-solid fa-arrow-down text-[11px]"></i>
                                </a>
                            </div>
                            <div class="mt-1 w-full">
                                <audio src="${f.data}" controls class="custom-audio"></audio>
                            </div>
                        </div>
                    `;
                } else if (f.type.startsWith('video/') || f.name.match(/\.(mp4|webm|mov|ogg)$/i)) {
                    messageContentHtml = `
                        <div class="mt-2 flex flex-col gap-2 p-2.5 rounded-xl border border-white/[0.05] bg-black/40 hover:border-white/[0.15] transition-all max-w-[360px] shadow-lg relative group/media-card font-sans">
                            <div class="relative rounded-lg overflow-hidden border border-white/[0.06] bg-black/60 aspect-video flex items-center justify-center">
                                <video src="${f.data}" controls class="w-full h-full max-h-[200px] object-contain rounded-lg"></video>
                            </div>
                            <div class="flex items-center justify-between px-1 py-0.5">
                                <div class="flex flex-col min-w-0 mr-3">
                                    <span class="text-[12px] font-medium text-[#ededed] truncate" title="${f.name}">${f.name}</span>
                                    <span class="text-[10px] text-[#666] mt-0.5">${sizeStr}</span>
                                </div>
                                <a href="${f.data}" download="${f.name}" class="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors shadow shrink-0" title="İndir">
                                    <i class="fa-solid fa-arrow-down text-[11px]"></i>
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
                // Parse markdown, links, and mentions
                let parsedText = msg.text || '';
                parsedText = parseMarkdown(parsedText);
                const linkResult = parseLinks(parsedText);
                parsedText = linkResult.html;
                parsedText = parseMentions(parsedText);
                
                let linkPreviewHtml = '';
                if (linkResult.urls.length > 0) {
                    linkPreviewHtml = linkResult.urls.slice(0, 2).map(u => buildLinkPreview(u)).join('');
                }
                messageContentHtml = `<div class="text-[#aaa] break-words whitespace-pre-wrap text-[14px] leading-relaxed font-light">${parsedText}</div>${linkPreviewHtml}`;
            }

            const memberObj = activeServer.members.get(msg.senderId);
            const avatarHtml = memberObj?.profilePic 
                ? `<img src="${memberObj.profilePic}" class="w-full h-full object-cover">` 
                : msg.senderName.substring(0,1).toUpperCase();

            const isDeletable = msg.senderId === myId || (isHost && msg.senderId !== 'system');
            const isEditable = msg.senderId === myId && !msg.file;
            const canPin = typeof canManageChannels === 'function' ? canManageChannels() : isHost;
            div.id = msg.id;
            div.className = 'flex flex-col mt-4 hover:bg-[#111]/50 px-2 py-1 rounded-lg relative group/msg transition-all duration-300';

            // Pinned banner
            let pinnedBannerHtml = '';
            if (msg.pinned) {
                pinnedBannerHtml = `<div class="pinned-banner"><i class="fa-solid fa-thumbtack text-[9px]"></i> Sabitlenmiş mesaj</div>`;
            }

            let replyHeaderHtml = '';
            if (msg.replyTo) {
                const escapedText = (msg.replyTo.text || '').replace(/'/g, "\\'");
                replyHeaderHtml = `
                    <div class="flex items-center gap-1.5 text-[11px] text-[#666] mb-1.5 pl-10 select-none">
                        <i class="fa-solid fa-reply text-[9px] transform scale-x-[-1] opacity-60 mr-1"></i>
                        <span class="font-medium text-slate-400 hover:underline cursor-pointer" onclick="window.scrollToMessage('${msg.replyTo.id}')">@${msg.replyTo.senderName}:</span>
                        <span class="truncate max-w-[280px] opacity-75">${msg.replyTo.text}</span>
                    </div>
                `;
            }

            // Edited label
            const editedLabel = msg.edited ? '<span class="text-[10px] text-[#555] ml-1.5">(düzenlendi)</span>' : '';

            // Reaction badges
            let reactionBadgesHtml = '';
            if (msg.reactions && Object.keys(msg.reactions).length > 0) {
                const badges = Object.entries(msg.reactions)
                    .filter(([, users]) => users.length > 0)
                    .map(([emoji, users]) => {
                        const isMine = users.includes(myId);
                        return `<span class="reaction-badge ${isMine ? 'mine' : ''}" onclick="window.toggleReaction('${msg.id}', '${emoji}')" title="${users.length} tepki">${emoji}<span class="reaction-count">${users.length}</span></span>`;
                    }).join('');
                if (badges) {
                    reactionBadgesHtml = `<div class="flex flex-wrap gap-1.5 mt-1.5 pl-0">${badges}</div>`;
                }
            }

            const cleanTextForReply = (msg.text || '').replace(/'/g, "\\'").replace(/"/g, '\\"');

            div.innerHTML = `
                ${pinnedBannerHtml}
                ${replyHeaderHtml}
                <div class="flex gap-3">
                    <div class="w-8 h-8 rounded bg-[#1A1A1A] border border-[#222] flex items-center justify-center text-[12px] text-[#aaa] font-bold mt-0.5 shrink-0 overflow-hidden cursor-pointer shadow-inner" onclick="showUserProfileCard('${msg.senderId}')">
                        ${avatarHtml}
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col">
                        <div class="flex items-baseline gap-2 mb-0.5">
                            <span class="font-medium text-[#ededed] text-[13px] cursor-pointer hover:underline transition-all" onclick="showUserProfileCard('${msg.senderId}')">${msg.senderName}</span>
                            <span class="text-[11px] text-[#555]">${msg.time}${editedLabel}</span>
                        </div>
                        ${messageContentHtml}
                        ${reactionBadgesHtml}
                    </div>
                </div>
                <div class="opacity-0 group-hover/msg:opacity-100 transition-opacity absolute right-4 top-2 flex items-center gap-1.5 shrink-0 z-10">
                    <button onclick="window.showEmojiPicker('${msg.id}', event)" class="w-7 h-7 rounded bg-white/[0.03] hover:bg-amber-500/10 text-[#666] hover:text-amber-400 flex items-center justify-center transition-all border border-white/[0.04] hover:border-amber-500/20 focus:outline-none" title="Tepki Ekle">
                        <i class="fa-regular fa-face-smile text-[11px]"></i>
                    </button>
                    <button onclick="window.initReply('${msg.id}', '${msg.senderName}', '${cleanTextForReply || 'Dosya paylaştı.'}')" class="w-7 h-7 rounded bg-white/[0.03] hover:bg-blue-500/10 text-[#666] hover:text-blue-400 flex items-center justify-center transition-all border border-white/[0.04] hover:border-blue-500/20 focus:outline-none" title="Yanıtla">
                        <i class="fa-solid fa-reply text-[11px]"></i>
                    </button>
                    ${isEditable ? `
                    <button onclick="window.startEditMessage('${msg.id}')" class="w-7 h-7 rounded bg-white/[0.03] hover:bg-emerald-500/10 text-[#666] hover:text-emerald-400 flex items-center justify-center transition-all border border-white/[0.04] hover:border-emerald-500/20 focus:outline-none" title="Düzenle">
                        <i class="fa-solid fa-pen text-[10px]"></i>
                    </button>
                    ` : ''}
                    ${canPin ? `
                    <button onclick="window.togglePinMessage('${msg.id}', '${msg.channelId}')" class="w-7 h-7 rounded bg-white/[0.03] hover:bg-amber-500/10 text-[#666] hover:text-amber-400 flex items-center justify-center transition-all border border-white/[0.04] hover:border-amber-500/20 focus:outline-none" title="${msg.pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}">
                        <i class="fa-solid fa-thumbtack text-[10px] ${msg.pinned ? 'text-amber-400' : ''}"></i>
                    </button>
                    ` : ''}
                    ${isDeletable ? `
                    <button onclick="window.deleteMessage('${msg.id}', '${msg.channelId}', event)" class="w-7 h-7 rounded bg-white/[0.03] hover:bg-rose-500/10 text-[#666] hover:text-rose-500 flex items-center justify-center transition-all border border-white/[0.04] hover:border-rose-500/20 focus:outline-none" title="Mesajı Sil">
                        <i class="fa-regular fa-trash-can text-[11px]"></i>
                    </button>
                    ` : ''}
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
const hostManageRolesBtn = document.getElementById('hostManageRolesBtn');
if (hostManageRolesBtn) {
    hostManageRolesBtn.addEventListener('click', () => {
        document.getElementById('workspaceDropdown').classList.add('hidden');
        openModal('rolesModal');
        window.initRolesModal();
    });
}
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
    if(text) { 
        sendChatMessage(text); 
        messageInput.value = ''; 
        if (localTypingTimeout) clearTimeout(localTypingTimeout);
        sendTypingState(false);
    }
});

messageInput.addEventListener('input', () => {
    if (!localTypingState) {
        sendTypingState(true);
    }
    if (localTypingTimeout) clearTimeout(localTypingTimeout);
    localTypingTimeout = setTimeout(() => {
        sendTypingState(false);
    }, 2000);
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

// ---------------- PREMIUM VOICE / PTT CONTROLS ----------------

const btnShortcutPTT = document.getElementById('btnShortcutPtt');
if (btnShortcutPTT) {
    btnShortcutPTT.onclick = (e) => {
        e.preventDefault();
        btnShortcutPTT.textContent = 'Tuşa basın...';
        btnShortcutPTT.className = "min-w-[120px] bg-blue-600/10 text-blue-400 border border-blue-500 px-4 py-2 rounded-lg text-center font-mono text-[12px] transition-all focus:outline-none shadow-[0_0_12px_rgba(59,130,246,0.25)] select-none cursor-pointer";
        
        const recordPttHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return;
            
            pttKey = event.code;
            btnShortcutPTT.textContent = pttKey.replace('Key', '');
            
            btnShortcutPTT.className = "min-w-[120px] bg-black/60 text-[#ededed] border border-[#333] hover:border-[#444] px-4 py-2 rounded-lg text-center font-mono text-[12px] transition-all focus:outline-none focus:border-blue-500 shadow-inner select-none cursor-pointer";
            
            window.removeEventListener('keydown', recordPttHandler, true);
        };
        window.addEventListener('keydown', recordPttHandler, true);
    };
}

const modeVaBtn = document.getElementById('btnVoiceActivity');
const modePttBtn = document.getElementById('btnPushToTalk');
const pttBindingRow = document.getElementById('settingsPttKeyContainer');

if (modeVaBtn && modePttBtn && pttBindingRow) {
    modeVaBtn.onclick = () => {
        voiceMode = 'va';
        modeVaBtn.className = "px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-md transition-all cursor-pointer";
        modePttBtn.className = "px-4 py-2.5 rounded-xl bg-[#222] border border-[#333] hover:border-[#444] text-[#888] font-medium text-xs transition-all cursor-pointer";
        pttBindingRow.classList.add('hidden');
        pttBindingRow.classList.remove('flex');
        
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    };
    
    modePttBtn.onclick = () => {
        voiceMode = 'ptt';
        modePttBtn.className = "px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-md transition-all cursor-pointer";
        modeVaBtn.className = "px-4 py-2.5 rounded-xl bg-[#222] border border-[#333] hover:border-[#444] text-[#888] font-medium text-xs transition-all cursor-pointer";
        pttBindingRow.classList.remove('hidden');
        pttBindingRow.classList.add('flex');
        
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = false;
            });
        }
    };
}

window.addEventListener('keydown', (e) => {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
    }
    
    if (voiceMode === 'ptt' && e.code === pttKey) {
        if (!isPttActive) {
            isPttActive = true;
            try { playTone('undeafen'); } catch(err){}
            if (localStream) {
                localStream.getAudioTracks().forEach(track => {
                    track.enabled = !isMuted;
                });
            }
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (voiceMode === 'ptt' && e.code === pttKey) {
        if (isPttActive) {
            isPttActive = false;
            try { playTone('deafen'); } catch(err){}
            if (localStream) {
                localStream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                });
            }
        }
    }
});

settingsBtn.addEventListener('click', () => {
    settingsUsernameInput.value = myUsername;
    
    // Set Profile Photo Preview in Modal
    if (myProfilePic) {
        settingsProfilePicImg.src = myProfilePic;
        settingsProfilePicImg.classList.remove('hidden');
        settingsProfilePicFallback.classList.add('hidden');
        btnRemoveProfilePic.classList.remove('hidden');
    } else {
        settingsProfilePicImg.src = '';
        settingsProfilePicImg.classList.add('hidden');
        settingsProfilePicFallback.classList.remove('hidden');
        btnRemoveProfilePic.classList.add('hidden');
    }
    
    // Reset temp keys and set current display text
    tempHotkeyMic = null;
    tempHotkeyDeafen = null;
    btnShortcutMic.textContent = formatHotkey(hotkeyMic);
    btnShortcutDeafen.textContent = formatHotkey(hotkeyDeafen);
    
    // Set Hosted Server Settings in Modal if Host
    const settingsServerConfigContainer = document.getElementById('settingsServerConfigContainer');
    const settingsServerNameInput = document.getElementById('settingsServerNameInput');
    const settingsServerIconPreview = document.getElementById('settingsServerIconPreview');
    const settingsServerIconFallback = document.getElementById('settingsServerIconFallback');
    const settingsServerIconImg = document.getElementById('settingsServerIconImg');
    const btnRemoveServerIcon = document.getElementById('btnRemoveServerIcon');

    if (isHost && activeServer) {
        if (settingsServerConfigContainer) settingsServerConfigContainer.classList.remove('hidden');
        if (settingsServerNameInput) settingsServerNameInput.value = activeServer.name || '';
        
        tempServerIcon = activeServer.icon || '';
        
        if (tempServerIcon) {
            if (settingsServerIconImg) { settingsServerIconImg.src = tempServerIcon; settingsServerIconImg.classList.remove('hidden'); }
            if (settingsServerIconFallback) settingsServerIconFallback.classList.add('hidden');
            if (btnRemoveServerIcon) btnRemoveServerIcon.classList.remove('hidden');
        } else {
            if (settingsServerIconImg) { settingsServerIconImg.src = ''; settingsServerIconImg.classList.add('hidden'); }
            if (settingsServerIconFallback) settingsServerIconFallback.classList.remove('hidden');
            if (btnRemoveServerIcon) btnRemoveServerIcon.classList.add('hidden');
        }
    } else {
        if (settingsServerConfigContainer) settingsServerConfigContainer.classList.add('hidden');
    }
    
    openModal('settingsModal');
});

closeSettingsModalBtn.addEventListener('click', () => closeModal('settingsModal'));

// Server Icon Customizer State & Event Listeners
let tempServerIcon = '';

setTimeout(() => {
    const btnUploadServerIcon = document.getElementById('btnUploadServerIcon');
    const serverIconInput = document.getElementById('serverIconInput');
    const btnRemoveServerIcon = document.getElementById('btnRemoveServerIcon');
    const settingsServerIconFallback = document.getElementById('settingsServerIconFallback');
    const settingsServerIconImg = document.getElementById('settingsServerIconImg');

    if (btnUploadServerIcon && serverIconInput) {
        btnUploadServerIcon.addEventListener('click', (e) => {
            e.preventDefault();
            serverIconInput.click();
        });
        
        serverIconInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast('Lütfen geçerli bir resim dosyası seçin.', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                tempServerIcon = event.target.result;
                if (settingsServerIconImg) {
                    settingsServerIconImg.src = tempServerIcon;
                    settingsServerIconImg.classList.remove('hidden');
                }
                if (settingsServerIconFallback) settingsServerIconFallback.classList.add('hidden');
                if (btnRemoveServerIcon) btnRemoveServerIcon.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnRemoveServerIcon) {
        btnRemoveServerIcon.addEventListener('click', (e) => {
            e.preventDefault();
            tempServerIcon = '';
            if (settingsServerIconImg) {
                settingsServerIconImg.src = '';
                settingsServerIconImg.classList.add('hidden');
            }
            if (settingsServerIconFallback) settingsServerIconFallback.classList.remove('hidden');
            btnRemoveServerIcon.classList.add('hidden');
        });
    }
}, 500);

// Profile Pic Helpers & Events
let cropImgSrc = '';
let cropScale = 1;
let cropX = 0;
let cropY = 0;
let isDraggingCrop = false;
let startDragX = 0;
let startDragY = 0;

const cropModal = document.getElementById('cropModal');
const cropImageSource = document.getElementById('cropImageSource');
const cropZoomRange = document.getElementById('cropZoomRange');
const btnSaveCrop = document.getElementById('btnSaveCrop');
const cropArea = document.getElementById('cropArea');

if (btnUploadProfilePic && profilePicInput) {
    btnUploadProfilePic.addEventListener('click', (e) => {
        e.preventDefault();
        profilePicInput.click();
    });
    
    profilePicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Lütfen geçerli bir resim dosyası seçin.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            cropImgSrc = event.target.result;
            cropImageSource.src = cropImgSrc;
            
            cropImageSource.onload = () => {
                const areaSize = 220; // Matches our HTML width/height of cropArea
                const imgWidth = cropImageSource.naturalWidth;
                const imgHeight = cropImageSource.naturalHeight;
                
                let initialScale = 1;
                if (imgWidth > imgHeight) {
                    initialScale = areaSize / imgHeight;
                } else {
                    initialScale = areaSize / imgWidth;
                }
                
                cropScale = initialScale;
                cropZoomRange.min = initialScale.toString();
                cropZoomRange.max = (initialScale * 4).toString();
                cropZoomRange.value = initialScale.toString();
                
                cropX = (areaSize - imgWidth * cropScale) / 2;
                cropY = (areaSize - imgHeight * cropScale) / 2;
                
                updateCropImageTransform();
                openModal('cropModal');
            };
        };
        reader.readAsDataURL(file);
    });
}

function updateCropImageTransform() {
    if (cropImageSource) {
        cropImageSource.style.transform = `translate(${cropX}px, ${cropY}px) scale(${cropScale})`;
    }
}

if (cropZoomRange) {
    cropZoomRange.addEventListener('input', (e) => {
        const newScale = parseFloat(e.target.value);
        const areaSize = 220;
        const centerX = areaSize / 2;
        const centerY = areaSize / 2;
        
        const oldScale = cropScale;
        cropX = centerX - (centerX - cropX) * (newScale / oldScale);
        cropY = centerY - (centerY - cropY) * (newScale / oldScale);
        
        cropScale = newScale;
        updateCropImageTransform();
    });
}

if (cropArea) {
    cropArea.addEventListener('mousedown', (e) => {
        isDraggingCrop = true;
        startDragX = e.clientX - cropX;
        startDragY = e.clientY - cropY;
        cropArea.style.cursor = 'grabbing';
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!isDraggingCrop) return;
        cropX = e.clientX - startDragX;
        cropY = e.clientY - startDragY;
        updateCropImageTransform();
    });
    
    window.addEventListener('mouseup', () => {
        if (isDraggingCrop) {
            isDraggingCrop = false;
            cropArea.style.cursor = 'move';
        }
    });
}

if (btnSaveCrop) {
    btnSaveCrop.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        const size = 96;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // In index.html, cropArea is 220px, and preview border is 30px (leaving a 160px diameter preview circle)
        const cropBoxSizeInArea = 160;
        const cropBoxOffset = 30;
        
        const srcX = (cropBoxOffset - cropX) / cropScale;
        const srcY = (cropBoxOffset - cropY) / cropScale;
        const srcW = cropBoxSizeInArea / cropScale;
        const srcH = cropBoxSizeInArea / cropScale;
        
        ctx.drawImage(
            cropImageSource,
            srcX, srcY, srcW, srcH,
            0, 0, size, size
        );
        
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        myProfilePic = base64;
        
        settingsProfilePicImg.src = base64;
        settingsProfilePicImg.classList.remove('hidden');
        settingsProfilePicFallback.classList.add('hidden');
        btnRemoveProfilePic.classList.remove('hidden');
        
        closeModal('cropModal');
        showToast('Fotoğraf başarıyla ayarlandı.', 'success');
    });
}

if (btnRemoveProfilePic) {
    btnRemoveProfilePic.addEventListener('click', (e) => {
        e.preventDefault();
        myProfilePic = '';
        settingsProfilePicImg.src = '';
        settingsProfilePicImg.classList.add('hidden');
        settingsProfilePicFallback.classList.remove('hidden');
        btnRemoveProfilePic.classList.add('hidden');
        profilePicInput.value = '';
    });
}

// Theme Toggle Click Listener
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('os_theme', isLight ? 'light' : 'dark');
        if (isLight) {
            themeToggleBtn.innerHTML = `<i class="fa-solid fa-sun text-[12px]"></i>`;
            showToast('Açık mod aktif.', 'success');
        } else {
            themeToggleBtn.innerHTML = `<i class="fa-solid fa-moon text-[12px]"></i>`;
            showToast('Kapalı mod aktif.', 'success');
        }
    });
}

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
            hostConnection.send({ type: 'intro', username: myUsername, profilePic: myProfilePic });
        }
    }
    
    // Save Profile Picture
    localStorage.setItem('os_profile_pic', myProfilePic);
    const myAvatarContainer = document.getElementById('myAvatarContainer');
    if (myAvatarContainer) {
        if (myProfilePic) {
            myAvatarContainer.innerHTML = `<img src="${myProfilePic}" class="w-full h-full object-cover rounded-lg">`;
        } else {
            myAvatarContainer.innerHTML = `<i class="fa-solid fa-user-astronaut text-[11px] text-[#aaa]"></i>`;
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
    
    // Save Sound Effects Toggle
    if (settingsSoundEffectsToggle) {
        localStorage.setItem('os_sound_enabled', settingsSoundEffectsToggle.checked);
    }
    
    // Save Hosted Server settings if Host
    if (isHost && activeServer) {
        const settingsServerNameInput = document.getElementById('settingsServerNameInput');
        const newServerName = settingsServerNameInput ? settingsServerNameInput.value.trim() : '';
        if (newServerName) {
            activeServer.name = newServerName;
            localStorage.setItem('os_my_server_name', newServerName);
        }
        
        activeServer.icon = tempServerIcon;
        localStorage.setItem('os_my_server_icon', tempServerIcon);
        
        addJoinedServer(myId, activeServer.name, activeServer.icon);
        
        broadcastServerState();
        renderServerView();
        renderGuildBar();
    }
    
    // Save Voice transmission mode & PTT settings
    localStorage.setItem('os_voice_mode', voiceMode);
    localStorage.setItem('os_ptt_key', pttKey);
    
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

cameraToggleBtn.addEventListener('click', () => {
    toggleCameraShare();
});

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

// Channel & Message Deletion Management
let channelModalMode = 'create';
let selectedChannelType = 'text';
let editingChannelId = null;

window.selectChannelType = function(type) {
    selectedChannelType = type;
    const btnText = document.getElementById('btnChannelTypeText');
    const btnVoice = document.getElementById('btnChannelTypeVoice');
    if (!btnText || !btnVoice) return;
    
    if (type === 'text') {
        btnText.className = 'flex items-center justify-center gap-2 py-3 rounded-lg border bg-[#111] border-blue-500 text-white font-medium text-[13px] focus:outline-none transition-all';
        btnVoice.className = 'flex items-center justify-center gap-2 py-3 rounded-lg border bg-black border-[#222] text-[#888] font-medium text-[13px] focus:outline-none transition-all';
    } else {
        btnText.className = 'flex items-center justify-center gap-2 py-3 rounded-lg border bg-black border-[#222] text-[#888] font-medium text-[13px] focus:outline-none transition-all';
        btnVoice.className = 'flex items-center justify-center gap-2 py-3 rounded-lg border bg-[#111] border-blue-500 text-white font-medium text-[13px] focus:outline-none transition-all';
    }
};

window.openCreateChannelModal = function(defaultType, event) {
    if (event) event.stopPropagation();
    channelModalMode = 'create';
    selectedChannelType = defaultType;
    
    const title = document.getElementById('channelModalTitle');
    const typeContainer = document.getElementById('channelTypeContainer');
    const deleteBtn = document.getElementById('btnDeleteChannel');
    const submitBtn = document.getElementById('btnSubmitChannel');
    const nameInput = document.getElementById('channelNameInput');
    
    if (title) title.textContent = "Kanal Oluştur";
    if (typeContainer) typeContainer.style.display = 'block';
    if (deleteBtn) deleteBtn.classList.add('hidden');
    if (submitBtn) submitBtn.textContent = "Oluştur";
    if (nameInput) {
        nameInput.value = '';
        setTimeout(() => nameInput.focus(), 100);
    }
    
    window.selectChannelType(defaultType);
    openModal('channelModal');
};

window.openEditChannelModal = function(channelId, channelName, channelType, event) {
    if (event) event.stopPropagation();
    channelModalMode = 'edit';
    editingChannelId = channelId;
    selectedChannelType = channelType;
    
    const title = document.getElementById('channelModalTitle');
    const typeContainer = document.getElementById('channelTypeContainer');
    const deleteBtn = document.getElementById('btnDeleteChannel');
    const submitBtn = document.getElementById('btnSubmitChannel');
    const nameInput = document.getElementById('channelNameInput');
    
    if (title) title.textContent = "Kanalı Düzenle";
    if (typeContainer) typeContainer.style.display = 'none';
    if (submitBtn) submitBtn.textContent = "Kaydet";
    if (nameInput) {
        nameInput.value = channelName;
        setTimeout(() => nameInput.focus(), 100);
    }
    
    if (deleteBtn) {
        if (channelId === 'genel' || channelId === 'genel_ses') {
            deleteBtn.classList.add('hidden');
        } else {
            deleteBtn.classList.remove('hidden');
        }
    }
    
    openModal('channelModal');
};

window.submitChannelForm = function() {
    const nameInput = document.getElementById('channelNameInput');
    if (!nameInput) return;
    let name = nameInput.value.trim();
    if (!name) {
        showToast("Lütfen bir kanal adı girin.", "warning");
        return;
    }
    
    if (selectedChannelType === 'text') {
        name = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
        if (!name) {
            showToast("Geçersiz kanal adı.", "warning");
            return;
        }
    }
    
    if (isHost) {
        if (channelModalMode === 'create') {
            const chId = 'ch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            activeServer.channels.push({ id: chId, name, type: selectedChannelType });
            showToast("Kanal oluşturuldu.", "success");
        } else {
            const ch = activeServer.channels.find(c => c.id === editingChannelId);
            if (ch) ch.name = name;
            showToast("Kanal güncellendi.", "success");
        }
        
        localStorage.setItem('os_my_server_channels', JSON.stringify(activeServer.channels));
        closeModal('channelModal');
        renderChannelPanel();
        broadcastServerState();
    } else {
        if (!canManageChannels()) {
            showToast("Bu işlem için yetkiniz yok.", "danger");
            return;
        }
        
        if (hostConnection && hostConnection.open) {
            hostConnection.send({
                type: 'manage-channel',
                action: channelModalMode === 'create' ? 'create' : 'edit',
                channelId: editingChannelId,
                name: name,
                channelType: selectedChannelType
            });
            closeModal('channelModal');
        } else {
            showToast("Sunucu bağlantısı yok.", "danger");
        }
    }
};

window.deleteChannelSubmit = function() {
    if (!editingChannelId || editingChannelId === 'genel' || editingChannelId === 'genel_ses') return;
    
    if (isHost) {
        activeServer.channels = activeServer.channels.filter(c => c.id !== editingChannelId);
        
        if (activeTextChannelId === editingChannelId) {
            const firstText = activeServer.channels.find(c => c.type === 'text');
            activeTextChannelId = firstText ? firstText.id : 'genel';
        }
        if (activeVoiceChannelId === editingChannelId) {
            leaveVoiceChannel();
        }
        
        localStorage.setItem('os_my_server_channels', JSON.stringify(activeServer.channels));
        closeModal('channelModal');
        renderServerView();
        broadcastServerState();
        showToast("Kanal silindi.", "success");
    } else {
        if (!canManageChannels()) {
            showToast("Bu işlem için yetkiniz yok.", "danger");
            return;
        }
        
        if (hostConnection && hostConnection.open) {
            hostConnection.send({
                type: 'manage-channel',
                action: 'delete',
                channelId: editingChannelId
            });
            closeModal('channelModal');
        } else {
            showToast("Sunucu bağlantısı yok.", "danger");
        }
    }
};

function deleteLocalMessage(messageId, channelId) {
    messages = messages.filter(m => m.id !== messageId);
    
    const key = getMessageHistoryKey(channelId);
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            let history = JSON.parse(raw);
            history = history.filter(m => m.id !== messageId);
            localStorage.setItem(key, JSON.stringify(history));
        }
    } catch(e) {
        console.error("Local message delete history update failed:", e);
    }
    
    const activeTarget = activeDMUserId ? activeDMUserId : activeTextChannelId;
    if (activeTarget === channelId) {
        renderMessages();
    }
}

window.deleteMessage = function(messageId, channelId, event) {
    if (event) event.stopPropagation();
    
    deleteLocalMessage(messageId, channelId);
    
    const packet = { type: 'delete-message', messageId, channelId };
    if (isHost) {
        broadcastMessageToAll(packet);
    } else if (hostConnection && hostConnection.open) {
        hostConnection.send(packet);
    } else {
        const conn = directConnections.get(channelId);
        if (conn && conn.open) {
            conn.send(packet);
        }
    }
};

// ========== PHASE 7: EMOJI REACTIONS ==========
const EMOJI_LIST = ['😂','❤️','👍','🔥','🎉','😍','🤔','👀','🙏','💯','🥺','😭','💀','✨','😊','🫠','🤣','💕','😎','🥰','🤯','👏','🫡','😈'];

window.showEmojiPicker = function(messageId, event) {
    if (event) event.stopPropagation();
    
    // Remove any existing picker
    const existing = document.getElementById('emojiPickerPopupLive');
    if (existing) { existing.remove(); activeEmojiPickerMsgId = null; }
    
    if (activeEmojiPickerMsgId === messageId) { activeEmojiPickerMsgId = null; return; }
    activeEmojiPickerMsgId = messageId;
    
    const msgEl = document.getElementById(messageId);
    if (!msgEl) return;
    
    const picker = document.createElement('div');
    picker.id = 'emojiPickerPopupLive';
    picker.className = 'emoji-picker-popup';
    picker.innerHTML = EMOJI_LIST.map(e => `<button onclick="window.toggleReaction('${messageId}', '${e}')">${e}</button>`).join('');
    picker.onclick = (ev) => ev.stopPropagation();
    
    // Position relative to message toolbar
    const toolbar = msgEl.querySelector('.group-hover\\/msg\\:opacity-100');
    if (toolbar) {
        toolbar.style.position = 'relative';
        picker.style.position = 'absolute';
        picker.style.bottom = 'calc(100% + 6px)';
        picker.style.right = '0';
        toolbar.appendChild(picker);
        toolbar.style.opacity = '1';
    } else {
        msgEl.style.position = 'relative';
        msgEl.appendChild(picker);
    }
};

// Close emoji picker on outside click
document.addEventListener('click', (e) => {
    const picker = document.getElementById('emojiPickerPopupLive');
    if (picker && !picker.contains(e.target)) {
        picker.remove();
        activeEmojiPickerMsgId = null;
    }
});

window.toggleReaction = function(messageId, emoji) {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    
    const idx = msg.reactions[emoji].indexOf(myId);
    const action = idx === -1 ? 'add' : 'remove';
    
    if (action === 'add') {
        msg.reactions[emoji].push(myId);
    } else {
        msg.reactions[emoji].splice(idx, 1);
        if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    }
    
    // Close emoji picker
    const picker = document.getElementById('emojiPickerPopupLive');
    if (picker) { picker.remove(); activeEmojiPickerMsgId = null; }
    
    // Persist
    updateMessageInPersistence(msg);
    renderMessages();
    
    // P2P broadcast
    const packet = { type: 'reaction', messageId, channelId: msg.channelId, emoji, action, senderId: myId };
    if (isHost) {
        broadcastMessageToAll(packet);
    } else if (hostConnection && hostConnection.open) {
        hostConnection.send(packet);
    } else {
        const conn = directConnections.get(msg.channelId);
        if (conn && conn.open) conn.send(packet);
    }
};

// ========== PHASE 7: MESSAGE EDITING ==========

window.startEditMessage = function(messageId) {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || msg.senderId !== myId) return;
    
    editingMessageId = messageId;
    const msgEl = document.getElementById(messageId);
    if (!msgEl) return;
    
    // Find the text content div
    const textDiv = msgEl.querySelector('.break-words');
    if (!textDiv) return;
    
    const originalText = msg.text || '';
    textDiv.innerHTML = `
        <textarea id="editTextarea_${messageId}" class="edit-textarea" rows="2">${originalText}</textarea>
        <div class="flex items-center gap-2 mt-1.5">
            <button onclick="window.saveEditMessage('${messageId}')" class="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors">Kaydet</button>
            <span class="text-[#555] text-[10px]">•</span>
            <button onclick="window.cancelEdit()" class="text-[11px] text-[#666] hover:text-[#aaa] font-medium transition-colors">İptal</button>
            <span class="text-[10px] text-[#444] ml-auto">Esc iptal • Enter kaydet</span>
        </div>
    `;
    
    const textarea = document.getElementById(`editTextarea_${messageId}`);
    if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { e.preventDefault(); window.cancelEdit(); }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.saveEditMessage(messageId); }
        });
    }
};

window.saveEditMessage = function(messageId) {
    const textarea = document.getElementById(`editTextarea_${messageId}`);
    if (!textarea) return;
    
    const newText = textarea.value.trim();
    if (!newText) return;
    
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    
    msg.text = newText;
    msg.edited = true;
    msg.editedAt = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    editingMessageId = null;
    
    updateMessageInPersistence(msg);
    renderMessages();
    
    // P2P broadcast
    const packet = { type: 'edit-message', messageId, channelId: msg.channelId, newText, senderId: myId };
    if (isHost) {
        broadcastMessageToAll(packet);
    } else if (hostConnection && hostConnection.open) {
        hostConnection.send(packet);
    } else {
        const conn = directConnections.get(msg.channelId);
        if (conn && conn.open) conn.send(packet);
    }
};

window.cancelEdit = function() {
    editingMessageId = null;
    renderMessages();
};

// ========== PHASE 7: MESSAGE PINNING ==========

window.togglePinMessage = function(messageId, channelId) {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    
    const action = msg.pinned ? 'unpin' : 'pin';
    msg.pinned = !msg.pinned;
    
    updateMessageInPersistence(msg);
    renderMessages();
    renderPinnedMessages();
    
    showToast(action === 'pin' ? 'Mesaj sabitlendi 📌' : 'Sabitleme kaldırıldı', 'success');
    
    // P2P broadcast
    const packet = { type: 'pin-message', messageId, channelId, action, senderId: myId };
    if (isHost) {
        broadcastMessageToAll(packet);
    } else if (hostConnection && hostConnection.open) {
        hostConnection.send(packet);
    }
};

window.openPinnedDrawer = function() {
    const drawer = document.getElementById('pinnedMessagesDrawer');
    if (!drawer) return;
    drawer.classList.toggle('hidden');
    if (!drawer.classList.contains('hidden')) renderPinnedMessages();
};

window.closePinnedDrawer = function() {
    const drawer = document.getElementById('pinnedMessagesDrawer');
    if (drawer) drawer.classList.add('hidden');
};

function renderPinnedMessages() {
    const list = document.getElementById('pinnedMessagesList');
    if (!list) return;
    
    const target = activeDMUserId || activeTextChannelId;
    const pinned = messages.filter(m => m.channelId === target && m.pinned);
    
    if (pinned.length === 0) {
        list.innerHTML = '<div class="text-[11px] text-[#555] italic text-center py-8">Sabitlenmiş mesaj yok.</div>';
        return;
    }
    
    list.innerHTML = pinned.map(msg => `
        <div class="p-3 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] transition-all cursor-pointer group" onclick="window.scrollToMessage('${msg.id}'); window.closePinnedDrawer();">
            <div class="flex items-center gap-2 mb-1.5">
                <span class="text-[12px] font-medium text-[#ededed]">${msg.senderName}</span>
                <span class="text-[10px] text-[#555]">${msg.time}</span>
            </div>
            <div class="text-[12px] text-[#aaa] line-clamp-3 font-light">${msg.text || (msg.file ? '📎 ' + msg.file.name : '')}</div>
            <div class="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); window.togglePinMessage('${msg.id}', '${msg.channelId}')" class="text-[10px] text-rose-400 hover:text-rose-300 font-medium transition-colors">Sabitlemeyi Kaldır</button>
            </div>
        </div>
    `).join('');
}

// ========== PERSISTENCE HELPER ==========

function updateMessageInPersistence(msg) {
    const dest = msg.channelId;
    if (!dest) return;
    const key = getMessageHistoryKey(dest);
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            let history = JSON.parse(raw);
            const idx = history.findIndex(m => m.id === msg.id);
            if (idx !== -1) {
                const msgToSave = { ...msg };
                if (msgToSave.file && msgToSave.file.data && msgToSave.file.data.length > 50000) {
                    msgToSave.file = { ...msgToSave.file, data: '' };
                }
                history[idx] = msgToSave;
                localStorage.setItem(key, JSON.stringify(history));
            }
        }
    } catch(e) {
        console.error("Mesaj persistence güncellenemedi:", e);
    }
}

// ========== P2P REACTION/EDIT/PIN HANDLER HELPERS ==========

function handleReactionPacket(data) {
    const msg = messages.find(m => m.id === data.messageId);
    if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[data.emoji]) msg.reactions[data.emoji] = [];
    
    if (data.action === 'add') {
        if (!msg.reactions[data.emoji].includes(data.senderId)) {
            msg.reactions[data.emoji].push(data.senderId);
        }
    } else {
        msg.reactions[data.emoji] = msg.reactions[data.emoji].filter(id => id !== data.senderId);
        if (msg.reactions[data.emoji].length === 0) delete msg.reactions[data.emoji];
    }
    
    updateMessageInPersistence(msg);
    const activeTarget = activeDMUserId || activeTextChannelId;
    if (activeTarget === data.channelId) renderMessages();
}

function handleEditMessagePacket(data) {
    const msg = messages.find(m => m.id === data.messageId);
    if (!msg) return;
    
    msg.text = data.newText;
    msg.edited = true;
    msg.editedAt = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    updateMessageInPersistence(msg);
    const activeTarget = activeDMUserId || activeTextChannelId;
    if (activeTarget === data.channelId) renderMessages();
}

function handlePinMessagePacket(data) {
    const msg = messages.find(m => m.id === data.messageId);
    if (!msg) return;
    
    msg.pinned = data.action === 'pin';
    updateMessageInPersistence(msg);
    
    const activeTarget = activeDMUserId || activeTextChannelId;
    if (activeTarget === data.channelId) {
        renderMessages();
        renderPinnedMessages();
    }
}

function canManageChannels() {
    if (!activeServer) return false;
    if (isHost) return true;
    const myMember = activeServer.members.get(myId);
    return myMember && myMember.role === 'admin';
}

// ========== PHASE 8: MARKDOWN PARSING ==========

function parseMarkdown(text) {
    if (!text) return text;
    // Code blocks first (triple backtick)
    text = text.replace(/```([\s\S]*?)```/g, (_, code) => `<div class="markdown-code-block">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`);
    // Inline code (single backtick)
    text = text.replace(/`([^`]+)`/g, (_, code) => `<span class="markdown-code">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`);
    // Bold (**text**)
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#ededed]">$1</strong>');
    // Italic (*text*)
    text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');
    // Strikethrough (~~text~~)
    text = text.replace(/~~(.+?)~~/g, '<del class="opacity-60 line-through">$1</del>');
    return text;
}

// ========== PHASE 8: LINK PARSING ==========

function parseLinks(text) {
    if (!text) return { html: text, urls: [] };
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    const urls = [];
    const html = text.replace(urlRegex, (url) => {
        urls.push(url);
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all">${url}</a>`;
    });
    return { html, urls };
}

function buildLinkPreview(url) {
    try {
        const domain = new URL(url).hostname;
        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        return `
            <div class="link-preview" onclick="window.open('${url}', '_blank')">
                <img src="${favicon}" class="w-5 h-5 rounded shrink-0" onerror="this.style.display='none'">
                <div class="flex flex-col min-w-0">
                    <span class="text-[12px] font-medium text-[#ededed] truncate">${domain}</span>
                    <span class="text-[10px] text-[#666] truncate">${url}</span>
                </div>
                <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-[#555] ml-auto shrink-0"></i>
            </div>
        `;
    } catch(e) { return ''; }
}

// ========== PHASE 8: MENTION PARSING ==========

function parseMentions(text) {
    if (!text) return text;
    // Match @username patterns (with word boundary)
    const members = activeServer?.members ? Array.from(activeServer.members.entries()) : [];
    
    members.forEach(([peerId, memberData]) => {
        const username = memberData.username;
        if (!username) return;
        const escapedName = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`@${escapedName}`, 'g');
        const isSelf = peerId === myId;
        text = text.replace(regex, `<span class="mention ${isSelf ? 'self' : ''}" onclick="showUserProfileCard('${peerId}')">@${username}</span>`);
    });
    return text;
}

function checkIsMentioned(text) {
    if (!text || !myUsername) return false;
    const escapedMyName = myUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const myMentionRegex = new RegExp(`@${escapedMyName}\\b`, 'i');
    return myMentionRegex.test(text);
}

// ========== PHASE 8: UNREAD COUNTS ==========

let unreadCounts = new Map(); // channelId/dmId -> count

function incrementUnread(channelId) {
    const current = unreadCounts.get(channelId) || 0;
    unreadCounts.set(channelId, current + 1);
}

function clearUnread(channelId) {
    unreadCounts.set(channelId, 0);
}

function getTotalUnreadForServer() {
    let total = 0;
    unreadCounts.forEach((count) => { total += count; });
    return total;
}

// ========== PHASE 8: DATE SEPARATOR ==========

function getDateLabel(dateStr) {
    const today = new Date();
    const msgDate = new Date(dateStr);
    
    const todayStr = today.toDateString();
    const msgStr = msgDate.toDateString();
    
    if (todayStr === msgStr) return 'Bugün';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === msgStr) return 'Dün';
    
    const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    return `${msgDate.getDate()} ${months[msgDate.getMonth()]} ${msgDate.getFullYear()}`;
}

// ========== PHASE 8: SEARCH MODAL ==========

let searchTimeout = null;

window.openSearchModal = function() {
    openModal('searchModal');
    const input = document.getElementById('searchInput');
    if (input) { input.value = ''; input.focus(); }
};

window.closeSearchModal = function() {
    closeModal('searchModal');
};

window.searchMessages = function(query) {
    const resultsEl = document.getElementById('searchResults');
    if (!resultsEl) return;
    
    if (!query.trim()) {
        resultsEl.innerHTML = '<div class="text-[11px] text-[#555] italic text-center py-8">Aramaya başla...</div>';
        return;
    }
    
    const target = activeDMUserId || activeTextChannelId;
    const q = query.toLowerCase();
    const results = messages.filter(m => 
        m.channelId === target && 
        m.text && 
        m.text.toLowerCase().includes(q) &&
        m.senderId !== 'system'
    );
    
    if (results.length === 0) {
        resultsEl.innerHTML = '<div class="text-[11px] text-[#555] italic text-center py-8">Sonuç bulunamadı.</div>';
        return;
    }
    
    resultsEl.innerHTML = results.map(msg => {
        const highlightedText = msg.text.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<span class="search-highlight">$1</span>');
        return `
            <div class="search-result-item" onclick="window.closeSearchModal(); setTimeout(() => window.scrollToMessage('${msg.id}'), 200);">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[12px] font-medium text-[#ededed]">${msg.senderName}</span>
                    <span class="text-[10px] text-[#555]">${msg.time}</span>
                </div>
                <div class="text-[12px] text-[#aaa] font-light line-clamp-2">${highlightedText}</div>
            </div>
        `;
    }).join('');
};

// Wire search input
const _searchInput = document.getElementById('searchInput');
if (_searchInput) {
    _searchInput.addEventListener('input', () => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            window.searchMessages(_searchInput.value);
        }, 300);
    });
}

// ========== PHASE 8: MENTION AUTOCOMPLETE ==========

let mentionActive = false;
let mentionQuery = '';
let mentionSelectedIdx = 0;
let mentionMatches = [];

function getMentionMatches(query) {
    if (!activeServer || !activeServer.members) return [];
    const q = query.toLowerCase();
    return Array.from(activeServer.members.entries())
        .map(([id, data]) => ({ id, ...data }))
        .filter(m => m.username && m.username.toLowerCase().includes(q));
}

function renderMentionAutocomplete() {
    const popup = document.getElementById('mentionAutocomplete');
    if (!popup) return;
    
    mentionMatches = getMentionMatches(mentionQuery);
    
    if (mentionMatches.length === 0) {
        popup.classList.add('hidden');
        popup.innerHTML = '';
        return;
    }
    
    if (mentionSelectedIdx >= mentionMatches.length) {
        mentionSelectedIdx = 0;
    } else if (mentionSelectedIdx < 0) {
        mentionSelectedIdx = mentionMatches.length - 1;
    }
    
    popup.innerHTML = mentionMatches.map((member, idx) => {
        const isActive = idx === mentionSelectedIdx;
        const avatar = member.profilePic || '';
        const avatarHtml = avatar.startsWith('data:') 
            ? `<img src="${avatar}" class="w-5 h-5 rounded-full object-cover shrink-0">`
            : `<div class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[9px] text-white" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6)">${member.username[0].toUpperCase()}</div>`;
            
        return `
            <div class="mention-autocomplete-item ${isActive ? 'active' : ''}" onclick="window.selectMention('${member.username}')">
                ${avatarHtml}
                <span class="text-[12px] text-[#ededed] font-medium">${member.username}</span>
            </div>
        `;
    }).join('');
    
    popup.classList.remove('hidden');
}

window.selectMention = function(username) {
    const input = document.getElementById('messageInput');
    if (!input) return;
    
    const val = input.value;
    const cursor = input.selectionStart;
    const textBeforeCursor = val.substring(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    
    if (lastAt !== -1) {
        const before = val.substring(0, lastAt);
        const after = val.substring(cursor);
        input.value = before + '@' + username + ' ' + after;
        input.focus();
        const newCursor = lastAt + username.length + 2; // account for @ and space
        input.setSelectionRange(newCursor, newCursor);
    }
    
    hideMentionAutocomplete();
};

function hideMentionAutocomplete() {
    mentionActive = false;
    const popup = document.getElementById('mentionAutocomplete');
    if (popup) {
        popup.classList.add('hidden');
        popup.innerHTML = '';
    }
}

// Wire input and keydown events for mention autocomplete
setTimeout(() => {
    const msgInput = document.getElementById('messageInput');
    if (msgInput) {
        msgInput.addEventListener('input', (e) => {
            const val = msgInput.value;
            const cursor = msgInput.selectionStart;
            const textBeforeCursor = val.substring(0, cursor);
            const lastAt = textBeforeCursor.lastIndexOf('@');
            
            if (lastAt !== -1) {
                // Check if @ is preceded by space or start of string
                const charBeforeAt = lastAt > 0 ? textBeforeCursor[lastAt - 1] : ' ';
                const isWordStart = /\s/.test(charBeforeAt);
                const textAfterAt = textBeforeCursor.substring(lastAt + 1);
                
                // Check if there are spaces after @
                const hasSpaceAfterAt = /\s/.test(textAfterAt);
                
                if (isWordStart && !hasSpaceAfterAt) {
                    mentionActive = true;
                    mentionQuery = textAfterAt;
                    renderMentionAutocomplete();
                    return;
                }
            }
            
            hideMentionAutocomplete();
        });
        
        msgInput.addEventListener('keydown', (e) => {
            if (!mentionActive) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                mentionSelectedIdx++;
                renderMentionAutocomplete();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                mentionSelectedIdx--;
                renderMentionAutocomplete();
            } else if (e.key === 'Enter') {
                if (mentionMatches.length > 0) {
                    e.preventDefault();
                    window.selectMention(mentionMatches[mentionSelectedIdx].username);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideMentionAutocomplete();
            }
        });
    }
}, 500);

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
        playTone('mute');
    } else {
        micToggleBtn.innerHTML = `<i class="fa-solid fa-microphone text-[12px]"></i>`;
        micToggleBtn.classList.remove('bg-red-500/10');
        showToast('Mikrofon açıldı.', 'success');
        playTone('unmute');
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
        playTone('deafen');
    } else {
        deafenToggleBtn.innerHTML = `<i class="fa-solid fa-headphones text-[12px]"></i>`;
        deafenToggleBtn.classList.remove('bg-red-500/10');
        showToast('Sesler açıldı.', 'success');
        playTone('undeafen');
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

function handleUploadFile(file) {
    if (!file) return;
    
    // Max file size limit: 15MB (since WebRTC connection data channels perform best under 20MB)
    if (file.size > 15 * 1024 * 1024) {
        showToast('Dosya boyutu 15MB\'dan büyük olamaz.', 'error');
        return;
    }
    
    showToast('Dosya okunuyor ve gönderiliyor...', 'info');
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const base64Data = event.target.result;
        sendFileMessage(file.name, file.type, file.size, base64Data);
    };
    reader.onerror = () => {
        showToast('Dosya okuma hatası.', 'error');
    };
    reader.readAsDataURL(file);
}

chatFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleUploadFile(file);
        chatFileInput.value = '';
    }
});

// Drag and drop event listeners on window
window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    const overlay = document.getElementById('dragDropOverlay');
    if (overlay) overlay.classList.add('active');
});

window.addEventListener('dragover', (e) => {
    e.preventDefault();
});

window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    // Only remove active class if we leave towards outside window
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        const overlay = document.getElementById('dragDropOverlay');
        if (overlay) overlay.classList.remove('active');
    }
});

window.addEventListener('drop', (e) => {
    e.preventDefault();
    const overlay = document.getElementById('dragDropOverlay');
    if (overlay) overlay.classList.remove('active');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        handleUploadFile(file);
    }
});

// Clipboard paste listener on window / document
document.addEventListener('paste', (e) => {
    // Skip paste handler if typing in an editable field that is NOT messageInput (e.g. settings input, roles input)
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && activeEl.id !== 'messageInput') {
        return;
    }
    
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
        const item = items[index];
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
                e.preventDefault();
                handleUploadFile(file);
                showToast('Dosya panodan yapıştırıldı.', 'success');
                break;
            }
        }
    }
});

function sendFileMessage(fileName, fileType, fileSize, fileData) {
    const fileObj = {
        name: fileName,
        type: fileType,
        size: fileSize,
        data: fileData
    };

    if (activeDMUserId) {
        sendDirectMessage(activeDMUserId, '', fileObj);
        return;
    }
    
    if(!activeTextChannelId || !currentServerId) return;
    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const msg = { id: msgId, channelId: activeTextChannelId, senderId: myId, senderName: myUsername, text: '', file: fileObj, time };
    messages.push(msg);
    persistMessage(msg);
    playTone('msg-send');
    
    if(isHost) {
        broadcastMessageToAll(msg);
        renderMessages();
    } else if(hostConnection && hostConnection.open) {
        hostConnection.send({ id: msgId, type: 'chat', channelId: activeTextChannelId, text: '', file: fileObj, time });
        renderMessages();
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

// ---------------- PREMIUM P2P FRIENDS & DIRECT CALLS ----------------

window.loadFriends = function() {
    const raw = localStorage.getItem('os_friends_list');
    if (raw) {
        try { friends = JSON.parse(raw); } catch(e) { friends = []; }
    } else {
        friends = [];
    }
    friends.forEach(f => f.isOnline = false);
    
    // Load friend requests
    loadFriendRequests();
    updatePendingBadge();
    
    renderFriends();
};

window.saveFriends = function() {
    localStorage.setItem('os_friends_list', JSON.stringify(friends));
};

window.loadFriendRequests = function() {
    const raw = localStorage.getItem('os_friend_requests');
    if (raw) {
        try { friendRequests = JSON.parse(raw); } catch(e) { friendRequests = []; }
    } else {
        friendRequests = [];
    }
};

window.saveFriendRequests = function() {
    localStorage.setItem('os_friend_requests', JSON.stringify(friendRequests));
};

window.updatePendingBadge = function() {
    const badge = document.getElementById('pendingRequestBadge');
    if (!badge) return;
    
    const incomingCount = friendRequests.filter(r => r.direction === 'incoming').length;
    if (incomingCount > 0) {
        badge.textContent = incomingCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
};

window.switchFriendsTab = function(tab) {
    friendsActiveTab = tab;
    
    const tabs = ['active', 'all', 'pending', 'add', 'servers'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-friends-${t}`);
        if (btn) {
            if (t === tab) {
                btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] text-white hover:text-white transition-all focus:outline-none flex items-center gap-1.5";
            } else {
                btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold text-[#888] hover:text-white transition-all focus:outline-none flex items-center gap-1.5";
            }
        }
    });
    
    const listContainer = document.getElementById('friendsListContainer');
    const addFriendContainer = document.getElementById('addFriendContainer');
    const homeServerListContainer = document.getElementById('homeServerListContainer');
    
    if (tab === 'active' || tab === 'all' || tab === 'pending') {
        if (listContainer) { listContainer.style.display = 'flex'; }
        if (addFriendContainer) { addFriendContainer.style.display = 'none'; }
        if (homeServerListContainer) { homeServerListContainer.style.display = 'none'; }
        
        const titleEl = document.getElementById('friendsListTitle');
        if (titleEl) {
            if (tab === 'active') titleEl.textContent = "Aktif Arkadaşlar";
            else if (tab === 'all') titleEl.textContent = "Tüm Arkadaşlar";
            else if (tab === 'pending') titleEl.textContent = "Bekleyen Arkadaşlık İstekleri";
        }
        renderFriends();
    } else if (tab === 'add') {
        if (listContainer) { listContainer.style.display = 'none'; }
        if (addFriendContainer) { addFriendContainer.style.display = 'flex'; }
        if (homeServerListContainer) { homeServerListContainer.style.display = 'none'; }
    } else if (tab === 'servers') {
        if (listContainer) { listContainer.style.display = 'none'; }
        if (addFriendContainer) { addFriendContainer.style.display = 'none'; }
        if (homeServerListContainer) { homeServerListContainer.style.display = 'flex'; }
        renderJoinedServersList();
    }
};

window.renderFriends = function() {
    const list = document.getElementById('friendsList');
    if (!list) return;
    list.innerHTML = '';
    
    updatePendingBadge();
    
    if (friendsActiveTab === 'pending') {
        if (friendRequests.length === 0) {
            list.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#444] select-none py-16">
                    <i class="fa-solid fa-clock text-[28px] mb-3 opacity-30"></i>
                    <div class="text-xs font-medium">Bekleyen arkadaşlık isteği yok.</div>
                </div>
            `;
            return;
        }
        
        friendRequests.forEach(req => {
            const div = document.createElement('div');
            div.className = "flex items-center justify-between p-3.5 bg-white/[0.015] border border-white/[0.04] rounded-xl hover:bg-white/[0.03] hover:border-white/[0.08] transition-all select-none group";
            
            const isIncoming = req.direction === 'incoming';
            
            div.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <div class="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600/20 to-purple-500/20 border border-white/[0.05] flex items-center justify-center shrink-0">
                        <span class="text-xs text-white font-bold">${req.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-semibold text-[#ededed] truncate">${req.name}</span>
                            <span class="text-[9px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[#888] font-medium shrink-0">
                                ${isIncoming ? 'Gelen İstek' : 'Giden İstek'}
                            </span>
                        </div>
                        <div class="text-[10px] text-[#555] truncate font-mono">${req.id}</div>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                    ${isIncoming ? `
                        <button onclick="window.acceptFriendRequest('${req.id}', '${req.name}')" class="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center transition-all focus:outline-none animate-pulse" title="Kabul Et">
                            <i class="fa-solid fa-check text-[11px]"></i>
                        </button>
                        <button onclick="window.declineFriendRequest('${req.id}')" class="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all focus:outline-none" title="Reddet">
                            <i class="fa-solid fa-xmark text-[11px]"></i>
                        </button>
                    ` : `
                        <button onclick="window.declineFriendRequest('${req.id}')" class="w-7 h-7 rounded-lg hover:bg-white/[0.05] text-[#aaa] hover:text-rose-500 flex items-center justify-center transition-all focus:outline-none" title="İsteği İptal Et">
                            <i class="fa-regular fa-trash-can text-[11px]"></i>
                        </button>
                    `}
                </div>
            `;
            list.appendChild(div);
        });
        return;
    }
    
    let filtered = friends;
    if (friendsActiveTab === 'active') {
        filtered = friends.filter(f => f.isOnline);
    }
    
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#444] select-none py-16">
                <i class="fa-solid fa-user-group text-[28px] mb-3 opacity-30"></i>
                <div class="text-xs font-medium">Burada hiç arkadaşın yok.</div>
            </div>
        `;
        return;
    }
    
    filtered.forEach(f => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-3.5 bg-white/[0.015] border border-white/[0.04] rounded-xl hover:bg-white/[0.03] hover:border-white/[0.08] transition-all select-none group";
        
        const isOnline = f.isOnline;
        const statusColor = isOnline ? 'bg-emerald-500' : 'bg-neutral-600';
        
        div.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                <div class="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600/20 to-purple-500/20 border border-white/[0.05] flex items-center justify-center shrink-0">
                    <span class="text-xs text-white font-bold">${f.name.charAt(0).toUpperCase()}</span>
                    <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#09090b] ${statusColor}"></div>
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs font-semibold text-[#ededed] truncate">${f.name}</span>
                    </div>
                    <div class="text-[10px] text-[#555] truncate font-mono">${f.id}</div>
                </div>
            </div>
            <div class="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                <button onclick="window.startFriendDirectDM('${f.id}')" class="w-7 h-7 rounded-lg hover:bg-white/[0.05] text-[#aaa] hover:text-white flex items-center justify-center transition-all focus:outline-none" title="Mesaj Gönder">
                    <i class="fa-regular fa-message text-[11px]"></i>
                </button>
                ${isOnline ? `
                    <button onclick="window.startDirectVoiceCall('${f.id}', '${f.name}')" class="w-7 h-7 rounded-lg hover:bg-white/[0.05] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center transition-all focus:outline-none" title="Sesli Ara">
                        <i class="fa-solid fa-phone text-[11px]"></i>
                    </button>
                ` : ''}
                <button onclick="window.removeFriend('${f.id}')" class="w-7 h-7 rounded-lg hover:bg-rose-500/5 text-rose-500 hover:bg-rose-500/20 flex items-center justify-center transition-all focus:outline-none" title="Arkadaşı Sil">
                    <i class="fa-regular fa-trash-can text-[11px]"></i>
                </button>
            </div>
        `;
        list.appendChild(div);
    });
};

window.startFriendDirectDM = function(friendId) {
    activeDMUserId = friendId;
    activeTextChannelId = null;
    const friend = friends.find(f => f.id === friendId);
    addJoinedDM(friendId, friend ? friend.name : null);
    renderServerView();
};

window.handleIncomingFriendRequest = function(senderId, senderName) {
    console.log("[ALCORD P2P] Received friend request from:", senderId, senderName);
    
    const existsInFriends = friends.find(f => f.id === senderId);
    if (existsInFriends) return; // Already friends
    
    const existsInRequests = friendRequests.find(r => r.id === senderId);
    if (!existsInRequests) {
        friendRequests.push({ id: senderId, name: senderName, direction: 'incoming' });
        saveFriendRequests();
        
        showToast(`${senderName} size arkadaşlık isteği gönderdi!`, 'success');
        triggerNotification(`Yeni Arkadaşlık İsteği`, `${senderName} size arkadaşlık isteği gönderdi!`);
        updatePendingBadge();
        
        if (friendsActiveTab === 'pending') {
            renderFriends();
        }
    }
};

window.handleIncomingFriendAccept = function(senderId, senderName) {
    console.log("[ALCORD P2P] Friend request accepted by:", senderId, senderName);
    
    // Remove from pending
    friendRequests = friendRequests.filter(r => r.id !== senderId);
    saveFriendRequests();
    
    const exists = friends.find(f => f.id === senderId);
    if (!exists) {
        friends.push({ id: senderId, name: senderName, isOnline: true });
        saveFriends();
    }
    
    showToast(`${senderName} arkadaşlık isteğinizi kabul etti!`, 'success');
    triggerNotification(`Arkadaşlık İsteği Kabul Edildi`, `${senderName} arkadaşlık isteğinizi kabul etti!`);
    updatePendingBadge();
    
    if (friendsActiveTab === 'all' || friendsActiveTab === 'active' || friendsActiveTab === 'pending') {
        renderFriends();
    }
    
    checkFriendPresenceSingle(senderId);
};

window.handleIncomingFriendDecline = function(senderId) {
    console.log("[ALCORD P2P] Friend request declined/canceled by:", senderId);
    
    friendRequests = friendRequests.filter(r => r.id !== senderId);
    saveFriendRequests();
    
    updatePendingBadge();
    
    if (friendsActiveTab === 'pending') {
        renderFriends();
    }
};

window.acceptFriendRequest = function(reqId, reqName) {
    // 1. Remove from requests
    friendRequests = friendRequests.filter(r => r.id !== reqId);
    saveFriendRequests();
    
    // 2. Add to friends list if not exists
    const exists = friends.find(f => f.id === reqId);
    if (!exists) {
        friends.push({ id: reqId, name: reqName, isOnline: true });
        saveFriends();
    }
    
    showToast(`${reqName} ile artık arkadaşsınız!`, 'success');
    updatePendingBadge();
    
    // 3. Send acceptance packet back to the sender
    const conn = peer.connect(reqId, { metadata: { type: 'friend-request-connection' }, reliable: true });
    conn.on('open', () => {
        conn.send({ type: 'friend-accept', senderId: myId, senderName: myUsername });
        setTimeout(() => conn.close(), 1500);
    });
    
    if (!isHost && hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'friend-accept-forward', senderId: myId, senderName: myUsername, targetId: reqId });
    }
    else if (isHost) {
        const clientConn = connections.get(reqId);
        if (clientConn && clientConn.open) {
            clientConn.send({ type: 'friend-accept', senderId: myId, senderName: myUsername });
        }
    }
    
    checkFriendPresenceSingle(reqId);
    renderFriends();
};

window.declineFriendRequest = function(reqId) {
    const req = friendRequests.find(r => r.id === reqId);
    const wasIncoming = req ? req.direction === 'incoming' : false;
    
    // Remove from requests
    friendRequests = friendRequests.filter(r => r.id !== reqId);
    saveFriendRequests();
    
    if (wasIncoming) {
        showToast('Arkadaşlık isteği reddedildi.', 'info');
    } else {
        showToast('Arkadaşlık isteği iptal edildi.', 'info');
    }
    updatePendingBadge();
    
    const conn = peer.connect(reqId, { metadata: { type: 'friend-request-connection' }, reliable: true });
    conn.on('open', () => {
        conn.send({ type: 'friend-decline', senderId: myId });
        setTimeout(() => conn.close(), 1500);
    });
    
    if (!isHost && hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'friend-decline-forward', senderId: myId, targetId: reqId });
    } else if (isHost) {
        const clientConn = connections.get(reqId);
        if (clientConn && clientConn.open) {
            clientConn.send({ type: 'friend-decline', senderId: myId });
        }
    }
    
    renderFriends();
};

window.handleAddFriendSubmit = function() {
    const peerIdInput = document.getElementById('addFriendPeerId');
    const nameInput = document.getElementById('addFriendName');
    
    if (!peerIdInput) return;
    
    const peerId = peerIdInput.value.trim();
    let nickname = nameInput ? nameInput.value.trim() : '';
    
    if (!peerId) {
        showToast('Lütfen Ağ Davet Kodunu girin.', 'error');
        return;
    }
    
    if (peerId === myId) {
        showToast('Kendinizi arkadaş olarak ekleyemezsiniz.', 'warning');
        return;
    }
    
    const existsInFriends = friends.find(f => f.id === peerId);
    if (existsInFriends) {
        if (nickname) {
            existsInFriends.name = nickname;
            saveFriends();
            showToast('Arkadaş adı güncellendi!', 'success');
        } else {
            showToast('Bu kişi zaten arkadaş listenizde ekli.', 'info');
        }
        peerIdInput.value = '';
        if (nameInput) nameInput.value = '';
        switchFriendsTab('all');
        return;
    }
    
    // Check if there is already an incoming request from this peer
    const incomingReq = friendRequests.find(r => r.id === peerId && r.direction === 'incoming');
    if (incomingReq) {
        // Automatically accept it!
        acceptFriendRequest(peerId, nickname || incomingReq.name);
        peerIdInput.value = '';
        if (nameInput) nameInput.value = '';
        switchFriendsTab('all');
        return;
    }
    
    // Check if outgoing request already exists
    const outgoingExists = friendRequests.find(r => r.id === peerId && r.direction === 'outgoing');
    if (outgoingExists) {
        showToast('Bu kişiye zaten arkadaşlık isteği gönderdiniz.', 'info');
        peerIdInput.value = '';
        if (nameInput) nameInput.value = '';
        switchFriendsTab('pending');
        return;
    }
    
    if (!nickname) nickname = 'Arkadaş';
    
    // Push to outgoing friendRequests
    friendRequests.push({ id: peerId, name: nickname, direction: 'outgoing' });
    saveFriendRequests();
    
    peerIdInput.value = '';
    if (nameInput) nameInput.value = '';
    
    showToast('Arkadaşlık isteği gönderildi!', 'success');
    switchFriendsTab('pending');
    
    // --- SEND FRIEND ADDED PACKET ---
    console.log("[ALCORD P2P] Attempting to send friend request notification to:", peerId);
    
    // 1. Direct P2P notification attempt
    const conn = peer.connect(peerId, { metadata: { type: 'friend-request-connection' }, reliable: true });
    conn.on('open', () => {
        conn.send({ type: 'friend-added', senderId: myId, senderName: myUsername });
        setTimeout(() => conn.close(), 1500);
    });
    
    // 2. Route through host if we are client
    if (!isHost && hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'friend-added-forward', senderId: myId, senderName: myUsername, targetId: peerId });
    }
    // 3. Directly send to client if we are host and they are connected to us
    else if (isHost) {
        const clientConn = connections.get(peerId);
        if (clientConn && clientConn.open) {
            clientConn.send({ type: 'friend-added', senderId: myId, senderName: myUsername });
        }
    }
    
    checkFriendPresenceSingle(peerId);
};

window.removeFriend = function(friendId) {
    friends = friends.filter(f => f.id !== friendId);
    saveFriends();
    showToast('Arkadaş silindi.', 'info');
    renderFriends();
};

window.checkFriendOnline = function(friendId) {
    return new Promise((resolve) => {
        if (directConnections.has(friendId)) {
            resolve(true);
            return;
        }
        if (isHost && connections.has(friendId)) {
            resolve(true);
            return;
        }
        if (!isHost && hostConnection && hostConnection.peer === friendId && hostConnection.open) {
            resolve(true);
            return;
        }
        
        if (!peer || peer.destroyed) {
            resolve(false);
            return;
        }
        
        const conn = peer.connect(friendId, { metadata: { type: 'ping' }, reliable: true });
        let resolved = false;
        
        const cleanup = (status) => {
            if (resolved) return;
            resolved = true;
            try { conn.close(); } catch(e){}
            resolve(status);
        };
        
        conn.on('open', () => cleanup(true));
        conn.on('error', () => cleanup(false));
        setTimeout(() => cleanup(false), 2000);
    });
};

window.startFriendsPresenceCheck = function() {
    friends.forEach(f => {
        checkFriendOnline(f.id).then(isOnline => {
            f.isOnline = isOnline;
            renderFriends();
        });
    });
    
    setInterval(() => {
        friends.forEach(f => {
            checkFriendOnline(f.id).then(isOnline => {
                if (f.isOnline !== isOnline) {
                    f.isOnline = isOnline;
                    renderFriends();
                }
            });
        });
    }, 20000);
};

window.checkFriendPresenceSingle = function(friendId) {
    checkFriendOnline(friendId).then(isOnline => {
        const f = friends.find(x => x.id === friendId);
        if (f) {
            f.isOnline = isOnline;
            renderFriends();
        }
    });
};

// ---------------- DIRECT P2P CALL SYSTEM ----------------

function startCallRingtone(isIncoming) {
    if (callRingtoneInterval) clearInterval(callRingtoneInterval);
    
    const playToneNode = (freq1, freq2, duration) => {
        try {
            const ctx = activeAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (!activeAudioCtx) activeAudioCtx = ctx;
            
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(freq1, ctx.currentTime);
            osc2.frequency.setValueAtTime(freq2, ctx.currentTime);
            
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration - 0.05);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            
            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + duration);
            osc2.stop(ctx.currentTime + duration);
        } catch(e) {}
    };
    
    if (isIncoming) {
        callRingtoneInterval = setInterval(() => {
            playToneNode(440, 480, 0.4);
            setTimeout(() => playToneNode(440, 480, 0.4), 600);
        }, 2000);
    } else {
        callRingtoneInterval = setInterval(() => {
            playToneNode(440, 480, 1.2);
        }, 3000);
    }
}

function stopCallRingtone() {
    if (callRingtoneInterval) {
        clearInterval(callRingtoneInterval);
        callRingtoneInterval = null;
    }
}

window.startDirectVoiceCall = async function(friendId, friendName) {
    if (activeCall || incomingCall) return;
    
    const callModal = document.getElementById('callModal');
    const targetName = document.getElementById('callTargetName');
    const statusText = document.getElementById('callStatusText');
    const acceptBtn = document.getElementById('btnAcceptCall');
    
    if (!callModal) return;
    
    targetName.textContent = friendName;
    statusText.textContent = "ARANIYOR...";
    if (acceptBtn) acceptBtn.classList.add('hidden');
    
    callModal.classList.remove('hidden');
    setTimeout(() => {
        callModal.classList.remove('opacity-0');
    }, 10);
    
    startCallRingtone(false);
    
    try {
        leaveVoiceChannel();
        const stream = await ensureLocalStream();
        const call = peer.call(friendId, stream, { metadata: { type: 'direct-call', senderName: myUsername } });
        if (!call) {
            declineOrHangupCall();
            return;
        }
        
        activeCall = call;
        
        call.on('stream', (remoteStream) => {
            stopCallRingtone();
            statusText.textContent = "BAĞLANTI AKTİF";
            playDirectRemoteStream(remoteStream, friendId);
        });
        
        call.on('close', () => {
            declineOrHangupCall();
        });
        
        call.on('error', () => {
            declineOrHangupCall();
        });
    } catch (err) {
        console.error('Direct voice call setup failed:', err);
        declineOrHangupCall();
    }
};

window.handleIncomingDirectCall = function(call) {
    if (activeCall || incomingCall) {
        call.close();
        return;
    }
    
    incomingCall = call;
    
    const callModal = document.getElementById('callModal');
    const targetName = document.getElementById('callTargetName');
    const statusText = document.getElementById('callStatusText');
    const acceptBtn = document.getElementById('btnAcceptCall');
    
    if (!callModal) return;
    
    targetName.textContent = call.metadata.senderName || 'Bilinmeyen Kullanıcı';
    statusText.textContent = "GELEN SESLİ ARAMA...";
    if (acceptBtn) acceptBtn.classList.remove('hidden');
    
    callModal.classList.remove('hidden');
    setTimeout(() => {
        callModal.classList.remove('opacity-0');
    }, 10);
    
    startCallRingtone(true);
    
    call.on('close', () => {
        declineOrHangupCall();
    });
    
    call.on('error', () => {
        declineOrHangupCall();
    });
};

window.acceptCall = async function() {
    if (!incomingCall) return;
    
    stopCallRingtone();
    
    const statusText = document.getElementById('callStatusText');
    const acceptBtn = document.getElementById('btnAcceptCall');
    if (statusText) statusText.textContent = "BAĞLANIYOR...";
    if (acceptBtn) acceptBtn.classList.add('hidden');
    
    try {
        leaveVoiceChannel();
        const stream = await ensureLocalStream();
        
        incomingCall.answer(stream);
        activeCall = incomingCall;
        incomingCall = null;
        
        activeCall.on('stream', (remoteStream) => {
            if (statusText) statusText.textContent = "BAĞLANTI AKTİF";
            playDirectRemoteStream(remoteStream, activeCall.peer);
        });
        
        activeCall.on('close', () => {
            declineOrHangupCall();
        });
        
        activeCall.on('error', () => {
            declineOrHangupCall();
        });
    } catch (err) {
        console.error('Accept call failed:', err);
        declineOrHangupCall();
    }
};

window.declineOrHangupCall = function() {
    stopCallRingtone();
    
    if (activeCall) {
        try { activeCall.close(); } catch(e){}
        activeCall = null;
    }
    if (incomingCall) {
        try { incomingCall.close(); } catch(e){}
        incomingCall = null;
    }
    
    // Stop local stream if not in a server voice channel
    if (!activeVoiceChannelId) {
        if (localStream) {
            try {
                localStream.getTracks().forEach(t => t.stop());
            } catch(e) {}
            localStream = null;
        }
        if (activeRnnoiseNode) {
            try { activeRnnoiseNode.port.postMessage('destroy'); activeRnnoiseNode.disconnect(); } catch(e){}
            activeRnnoiseNode = null;
        }
        if (activeAudioCtx) {
            try { activeAudioCtx.close(); } catch(e){}
            activeAudioCtx = null;
        }
    }
    
    const audios = document.querySelectorAll('audio[id^="audio-direct-"]');
    audios.forEach(a => a.remove());
    
    const callModal = document.getElementById('callModal');
    if (callModal) {
        callModal.classList.add('opacity-0');
        setTimeout(() => {
            callModal.classList.add('hidden');
        }, 300);
    }
};

function playDirectRemoteStream(remoteStream, peerId) {
    try {
        let audio = document.getElementById(`audio-direct-${peerId}`);
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = `audio-direct-${peerId}`;
            audio.autoplay = true;
            document.body.appendChild(audio);
        }
        audio.srcObject = remoteStream;
    } catch (e) {}
}

// Bind direct call modal control button listeners
const btnAcceptCall = document.getElementById('btnAcceptCall');
const btnDeclineCall = document.getElementById('btnDeclineCall');
if (btnAcceptCall) btnAcceptCall.onclick = () => acceptCall();
if (btnDeclineCall) btnDeclineCall.onclick = () => declineOrHangupCall();

// ---------------- REPLYING & GIF PANEL CONTROLLERS ----------------

let gifSearchTimeout = null;

window.initReply = function(msgId, senderName, text) {
    activeReplyMessage = { id: msgId, senderName, text };
    
    const preview = document.getElementById('inputReplyPreview');
    const previewUser = document.getElementById('replyPreviewUser');
    const previewText = document.getElementById('replyPreviewText');
    const form = document.getElementById('messageForm');
    
    if (preview && previewUser && previewText && form) {
        previewUser.textContent = senderName;
        previewText.textContent = text;
        preview.classList.remove('hidden');
        form.classList.add('rounded-t-none', 'border-t-0');
    }
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.focus();
};

window.cancelReply = function() {
    activeReplyMessage = null;
    
    const preview = document.getElementById('inputReplyPreview');
    const form = document.getElementById('messageForm');
    
    if (preview && form) {
        preview.classList.add('hidden');
        form.classList.remove('rounded-t-none', 'border-t-0');
    }
};

window.scrollToMessage = function(msgId) {
    const el = document.getElementById(msgId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a temporary yellow glow animation
        el.classList.add('bg-yellow-500/10', 'transition-all', 'duration-500');
        setTimeout(() => {
            el.classList.remove('bg-yellow-500/10');
        }, 1500);
    }
};

window.toggleGifPanel = function(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const panel = document.getElementById('gifPanel');
    if (!panel) return;
    
    gifPanelOpen = !gifPanelOpen;
    if (gifPanelOpen) {
        panel.classList.remove('hidden');
        const searchInput = document.getElementById('gifSearchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        window.loadTrendingGifs();
    } else {
        panel.classList.add('hidden');
    }
};

// Close GIF panel when clicking outside
document.addEventListener('click', (e) => {
    const panel = document.getElementById('gifPanel');
    if (panel && !panel.classList.contains('hidden')) {
        const inputWrapper = document.querySelector('.message-input-wrapper');
        if (!panel.contains(e.target) && (!inputWrapper || !inputWrapper.contains(e.target))) {
            window.toggleGifPanel();
        }
    }
});

window.loadTrendingGifs = async function() {
    const grid = document.getElementById('gifGrid');
    if (!grid) return;
    
    grid.innerHTML = `<div class="col-span-3 flex items-center justify-center py-12"><i class="fa-solid fa-spinner animate-spin text-[20px] text-[#555]"></i></div>`;
    
    try {
        const url = `https://g.tenor.com/v1/trending?key=LIVDSRZULELA&limit=12`;
        const res = await fetch(url);
        const data = await res.json();
        window.renderGifsInGrid(data.results || []);
    } catch (e) {
        console.error("Failed to load trending GIFs:", e);
        grid.innerHTML = `<div class="col-span-3 text-center text-[#555] py-12 text-[12px] italic">GIF'ler yüklenemedi.</div>`;
    }
};

window.searchGifs = async function(query) {
    const grid = document.getElementById('gifGrid');
    if (!grid) return;
    
    if (!query.trim()) {
        window.loadTrendingGifs();
        return;
    }
    
    grid.innerHTML = `<div class="col-span-3 flex items-center justify-center py-12"><i class="fa-solid fa-spinner animate-spin text-[20px] text-[#555]"></i></div>`;
    
    try {
        const url = `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDSRZULELA&limit=12`;
        const res = await fetch(url);
        const data = await res.json();
        window.renderGifsInGrid(data.results || []);
    } catch (e) {
        console.error("Failed to search GIFs:", e);
        grid.innerHTML = `<div class="col-span-3 text-center text-[#555] py-12 text-[12px] italic">Arama başarısız oldu.</div>`;
    }
};

window.renderGifsInGrid = function(results) {
    const grid = document.getElementById('gifGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (results.length === 0) {
        grid.innerHTML = `<div class="col-span-3 text-center text-[#555] py-12 text-[12px]">Hiçbir GIF bulunamadı.</div>`;
        return;
    }
    
    results.forEach(item => {
        // Support both Tenor v1 (media[0].gif.url) and v2 (media_formats.gif.url) response formats
        const gifUrl = item.media_formats?.gif?.url 
            || item.media_formats?.tinygif?.url 
            || (item.media && item.media[0]?.gif?.url) 
            || (item.media && item.media[0]?.tinygif?.url);
        if (!gifUrl) return;
        
        const div = document.createElement('div');
        div.className = 'aspect-video rounded-lg overflow-hidden border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.15] transition-all cursor-pointer relative group';
        div.innerHTML = `<img src="${gifUrl}" class="w-full h-full object-cover">`;
        div.onclick = () => window.selectGif(gifUrl);
        grid.appendChild(div);
    });
};

window.selectGif = function(gifUrl) {
    const target = activeDMUserId ? activeDMUserId : activeTextChannelId;
    if (!target) return;
    
    const filePayload = {
        name: 'GIF',
        type: 'image/gif',
        size: 0,
        data: gifUrl
    };
    
    sendChatMessage('', filePayload);
    window.toggleGifPanel();
};

const gifSearchInput = document.getElementById('gifSearchInput');
if (gifSearchInput) {
    gifSearchInput.addEventListener('input', () => {
        if (gifSearchTimeout) clearTimeout(gifSearchTimeout);
        const query = gifSearchInput.value;
        gifSearchTimeout = setTimeout(() => {
            window.searchGifs(query);
        }, 500);
    });
}

initApp();
initElectronTitleBar();
