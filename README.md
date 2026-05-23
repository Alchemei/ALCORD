# 🌌 ALCORD - Premium P2P Chat & Media Client

ALCORD is a futuristic, ultra-modern, and highly secure serverless (P2P - Peer-to-Peer) audio, video, and text communication client built with **Electron** and **WebRTC (PeerJS)**. 

Featuring an elegant, state-of-the-art **Glassmorphism** design system, ALCORD is built to wow users and deliver the peak standard of modern desktop application aesthetics.

---

## ✨ Features Highlight

### 📹 1. Premium Video Calling & Camera Sharing (Unified Video Grid)
* High-definition, low-latency, one-way webcam video capture (`localCameraStream`) designed to run perfectly without interfering with active microphone audio streams.
* **Unified Video Gallery Grid:** A futuristic video panel that merges all active screen shares and webcam feeds (including your own) into a dynamic grid layout that automatically adapts based on feed count (1 column, 2 columns, or 3 columns).
* **Smart DOM Reconciliation (Diffing):** A custom reconciliation engine that manages video cards smoothly, preventing stutters, pauses, or frame freezes whenever users toggle their cameras or join/leave rooms.
* **Late-Joiner Stream Sync:** Real-time P2P packet handshakes that ensure any user joining an active voice channel is automatically called and instantly receives all active video and screen shares.

### 🔇 2. AI-Powered Noise Suppression (RNNoise AI Enabler)
* SIMD-accelerated WebAssembly compilation of Shiguredo Inc.'s RNNoise library to dynamically suppress background noise, keyboard clicks, fans, and ambient hums.
* **Detached ArrayBuffer Protection:** An advanced memory-management yama (`slice(0)`) that prevents Web Audio AudioWorklet threads from cloning and detaching the WASM binary. This guarantees consistent, high-performance noise filtering across subsequent toggles and channel changes.
* **Dynamic Audio Routing:** Integrate mic gain boosters (up to 5x level amplification) and a direct RNNoise toggle switch inside the glassmorphic Settings panel.

### 🖥️ 3. Screen Sharing (Custom Picker Modal)
* A gorgeous screen and window capturer picker modal displaying live, real-time thumbnails of active screens and application windows.
* Supports high-resolution desktop captures, native fullscreen player mode, custom in-card controls, and safety confirmation checks.

### 👥 4. Advanced Server Roles & Hiearchy Permissions
* **Server Roles Manager Dashboard:** A sleek Host-only role management dashboard to create, edit, customize colors with a color picker, and manage hiearchy assignments.
* Interactively groups active online members in the sidebar under custom role cards, styling usernames using custom group colors.
* Allows Hosts to authorize managers ("Yetkili" admins), enabling them to perform P2P channel creations, renames, and deletions synced across all active peers.

### 💬 5. Modern Rich Chat & Collaboration UX
* **Emoji Reactions:** Interact with messages using 24 premium emojis. Features reaction counts, user tooltips, and custom neon blue glowing borders for reactions added by yourself.
* **Message Editing & Pinning:** Edit message payloads inline with transition animations. Includes a dedicated golden thumbtack Pin Drawer with quick jump routing (`scrollToMessage`).
* **@Mention Autocomplete:** Typing `@` in the chat input displays a glassmorphic floating member listing, traversable using keyboard arrow keys. Mentions highlight inside chat logs and trigger a custom sound notification.
* **Instant Message Search:** Query local logs with debounced searching, instantly highlighting matched terms in gold.
* **Date Separators:** Chat logs automatically segment messages with clean chronological timelines ("Today", "Yesterday", or "May 24, 2026").
* **Unread Badges:** Keeps track of active messages using glowing red numerical indicators on channels, direct DMs, and server list headers.

### 📎 6. Drag & Drop Uploads & Inline Media Players
* **Drag & Drop Files:** Drag any file directly onto the active chat feed to initiate a high-speed direct P2P transfer (15MB limit).
* **Clipboard Paste (Ctrl+V):** Paste screenshots or copied images directly into the text input to post them instantly.
* **Inline Media Players:** Renders glassmorphic audio and video preview blocks for `.mp3`, `.wav`, `.mp4`, or `.webm` attachments directly inside chat bubbles, complete with native playback sliders and metadata cards.

### ⌨️ 8. Win32 Low-Level Keyboard Hook (Global Hotkeys)
* An integrated C# executable (`keylistener.exe`) that runs hidden in the background, utilizing native Win32 keyboard APIs to intercept key events.
* Allows system-wide global hotkeys for Mic Mute (Alt+M) and Deafen (Alt+D) that function perfectly even when ALCORD is minimized, running in the system tray, or while playing fullscreen games.

---

## 🚀 Technology Stack

* **Core:** HTML5, Vanilla CSS, Vanilla Javascript (with custom TailwindCSS classes and futuristic glassmorphic filters).
* **Desktop Wrapper:** Electron (featuring fully borderless design, custom frameless titlebar navigation, and interactive system tray integration).
* **Networking:** PeerJS & WebRTC (Direct Datachannels for Text/Files, MediaStreams for Audio/Video).
* **Audio Engine:** Web Audio API & AudioWorkletProcessor.
* **Persistence:** LocalStorage is utilized to persist servers, roles, custom channels, settings, direct DMs, and reciprocal friends lists.

---

## 🛠️ Installation & Running

### Requirements
* [Node.js](https://nodejs.org/) (v16 or higher recommended)
* Windows OS (The global keyboard hook relies on Windows-specific Win32 APIs)

### Execution Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Alchemei/ALCORD.git
   cd ALCORD
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the first Electron profile (User 1 / Host):
   ```bash
   npm run dev
   ```
4. Launch the second Electron profile (Isolated profile, User 2) for local P2P testing:
   ```bash
   npm run dev2
   ```

---

## 📦 Packaging & Building Setup Executables

To package the application and compile the final, lightweight Windows setup installer `.exe`:

1. Package the application assets:
   ```bash
   npx electron-packager . ALCORD --platform=win32 --arch=x64 --icon=icon.ico --overwrite --ignore="dist" --ignore="ALCORD-win32-x64"
   ```
2. Compile the Inno Setup installer file:
   ```powershell
   & "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" setup.iss
   ```
   *The compiled installer setup will be located in the `c:\apps\ALCORD\dist\ALCORD_Setup_New.exe` directory.*

---

## 📄 License

This project is licensed under the **MIT License**. For more details, see the `LICENSE` file.
