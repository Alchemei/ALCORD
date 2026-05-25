/**
 * ALCORD - Vanilla IndexedDB Database Manager
 * Production-ready, async/await, Promise-wrapped, performance-optimized.
 */

class DBManager {
    constructor(dbName = 'alcord_db', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        this.initPromise = null;
    }

    /**
     * Initializes the IndexedDB database, sets up version upgrades and object stores.
     * Prevents concurrent connection requests using a cached initPromise.
     */
    async init() {
        if (this.db) return this;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.version);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // 1. messages store: autoIncrement primary key (dbId), indexed by roomId, timestamp, messageId (unique)
                    if (!db.objectStoreNames.contains('messages')) {
                        const messageStore = db.createObjectStore('messages', { keyPath: 'dbId', autoIncrement: true });
                        messageStore.createIndex('roomId', 'roomId', { unique: false });
                        messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                        messageStore.createIndex('messageId', 'messageId', { unique: true });
                    }

                    // 2. roles store: keyPath id, indexed by roomId
                    if (!db.objectStoreNames.contains('roles')) {
                        const roleStore = db.createObjectStore('roles', { keyPath: 'id' });
                        roleStore.createIndex('roomId', 'roomId', { unique: false });
                    }

                    // 3. roomSettings store: keyPath roomId
                    if (!db.objectStoreNames.contains('roomSettings')) {
                        db.createObjectStore('roomSettings', { keyPath: 'roomId' });
                    }
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    console.log('[IndexedDB] Database initialized successfully.');
                    resolve(this);
                };

                request.onerror = (event) => {
                    console.error('[IndexedDB] Initialization error:', event.target.error);
                    this.initPromise = null; // reset to allow retry
                    reject(event.target.error);
                };
            } catch (err) {
                console.error('[IndexedDB] Catch error in init:', err);
                this.initPromise = null;
                reject(err);
            }
        });
        
        return this.initPromise;
    }

    /**
     * Saves a message object securely. Updates if it already exists, avoiding duplicates.
     */
    async saveMessage(message) {
        await this.init();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['messages'], 'readwrite');
                const store = transaction.objectStore('messages');
                const index = store.index('messageId');
                
                const msgId = message.id || message.messageId;
                if (!msgId) {
                    return reject(new Error('Message must have a unique id or messageId'));
                }

                // Check for duplicate to avoid primary key error, keep atomic updates
                const getRequest = index.get(msgId);
                getRequest.onsuccess = (event) => {
                    const existing = event.target.result;
                    
                    // Remove large file base64 data to avoid DB overflow, keeping metadata only
                    const fileObj = message.file ? { ...message.file } : null;
                    if (fileObj && fileObj.data && fileObj.data.length > 50000) {
                        fileObj.data = '';
                    }

                    const record = {
                        messageId: msgId,
                        roomId: message.channelId || message.roomId || '',
                        timestamp: message.timestamp || Date.now(),
                        senderId: message.senderId || '',
                        senderName: message.senderName || '',
                        text: message.text || '',
                        file: fileObj,
                        time: message.time || '',
                        replyTo: message.replyTo || null
                    };

                    if (existing) {
                        record.dbId = existing.dbId; // reuse primary key to trigger update
                        const putRequest = store.put(record);
                        putRequest.onsuccess = () => resolve(record);
                        putRequest.onerror = (e) => reject(e.target.error);
                    } else {
                        const addRequest = store.add(record);
                        addRequest.onsuccess = (e) => {
                            record.dbId = e.target.result;
                            resolve(record);
                        };
                        addRequest.onerror = (e) => reject(e.target.error);
                    }
                };

                getRequest.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Returns all message objects stored for a roomId/channelId, sorted by timestamp.
     */
    async getRoomMessages(roomId) {
        await this.init();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['messages'], 'readonly');
                const store = transaction.objectStore('messages');
                const index = store.index('roomId');
                const request = index.getAll(roomId);

                request.onsuccess = (event) => {
                    const results = event.target.result || [];
                    // Ensure chronological order
                    results.sort((a, b) => a.timestamp - b.timestamp);
                    // Map back to ALCORD message format
                    const mapped = results.map(r => ({
                        id: r.messageId,
                        channelId: r.roomId,
                        timestamp: r.timestamp,
                        senderId: r.senderId,
                        senderName: r.senderName,
                        text: r.text,
                        file: r.file,
                        time: r.time,
                        replyTo: r.replyTo
                    }));
                    resolve(mapped);
                };

                request.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Deletes all messages in a roomId/channelId.
     */
    async deleteRoomMessages(roomId) {
        await this.init();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['messages'], 'readwrite');
                const store = transaction.objectStore('messages');
                const index = store.index('roomId');
                const request = index.openCursor(IDBKeyRange.only(roomId));

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        store.delete(cursor.primaryKey);
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };

                request.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Clears all object stores.
     */
    async clearDatabase() {
        await this.init();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['messages', 'roles', 'roomSettings'], 'readwrite');
                transaction.objectStore('messages').clear();
                transaction.objectStore('roles').clear();
                transaction.objectStore('roomSettings').clear();

                transaction.oncomplete = () => {
                    console.log('[IndexedDB] Database cleared successfully.');
                    resolve();
                };

                transaction.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Saves role(s) under a roomId. Accepts single role or array of roles.
     */
    async saveRole(roomId, roleOrRoles) {
        await this.init();
        if (Array.isArray(roleOrRoles)) {
            const promises = roleOrRoles.map(role => this.saveRole(roomId, role));
            return Promise.all(promises);
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['roles'], 'readwrite');
                const store = transaction.objectStore('roles');
                const record = {
                    id: `${roomId}_${roleOrRoles.id}`,
                    roomId: roomId,
                    roleId: roleOrRoles.id,
                    name: roleOrRoles.name,
                    color: roleOrRoles.color,
                    order: roleOrRoles.order
                };
                const request = store.put(record);
                request.onsuccess = () => resolve(record);
                request.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Gets all roles saved for a roomId.
     */
    async getRoles(roomId) {
        await this.init();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['roles'], 'readonly');
                const store = transaction.objectStore('roles');
                const index = store.index('roomId');
                const request = index.getAll(roomId);

                request.onsuccess = (event) => {
                    const results = event.target.result || [];
                    // Sort by hierarchical order
                    results.sort((a, b) => a.order - b.order);
                    const mapped = results.map(r => ({
                        id: r.roleId,
                        name: r.name,
                        color: r.color,
                        order: r.order
                    }));
                    resolve(mapped);
                };

                request.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Saves room settings.
     */
    async saveRoomSettings(roomId, settings) {
        await this.init();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['roomSettings'], 'readwrite');
                const store = transaction.objectStore('roomSettings');
                const record = {
                    roomId: roomId,
                    name: settings.name,
                    icon: settings.icon || '',
                    channels: settings.channels || [],
                    ownerId: settings.ownerId || '',
                    updatedAt: Date.now()
                };
                const request = store.put(record);
                request.onsuccess = () => resolve(record);
                request.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Gets room settings.
     */
    async getRoomSettings(roomId) {
        await this.init();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['roomSettings'], 'readonly');
                const store = transaction.objectStore('roomSettings');
                const request = store.get(roomId);

                request.onsuccess = (event) => {
                    resolve(event.target.result || null);
                };

                request.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
        });
    }
}

// Attach to window for renderer process access
if (typeof window !== 'undefined') {
    window.DBManager = DBManager;
    window.dbManager = new DBManager();
    // Initialize immediately in the background
    window.dbManager.init().catch(err => console.error('[IndexedDB] Immediate init failed:', err));
}

// CommonJS support for Node environments (like headless-host.js or main.js if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DBManager;
}
