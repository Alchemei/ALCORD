# 🌌 ALCORD - Premium P2P Chat & Media Client

ALCORD, **Electron** ve **WebRTC (PeerJS)** teknolojileri kullanılarak geliştirilmiş, uçtan uca şifreli (E2E), tamamen sunucusuz (P2P - Peer-to-Peer) çalışan fütüristik ve ultra modern bir görüntülü/sesli sohbet uygulamasıdır. 

Yüksek kaliteli **Cam Efektli (Glassmorphism)** tasarımıyla modern ve estetik standartların en üst seviyesini hedefler.

---

## ✨ Öne Çıkan Özellikler

### 📹 1. Premium Görüntülü Görüşme & Kamera Paylaşımı (Unified Video Grid)
* Ses odalarında kullanılmak üzere yüksek çözünürlüklü ve akıcı tek yönlü video yayını çeken yerel kamera kontrol altyapısı.
* **Unified Video Gallery Grid:** Ekran paylaşımlarını ve kamera görüntülerini yan yana veya alt alta yerleştiren, akış sayısına göre dinamik olarak boyut değiştiren (1 sütun, 2 sütun veya 3 sütun ızgara) fütüristik video paneli.
* **Akıllı DOM Reconciliation (Diffing):** Video akışlarının her değişiklikte (yeni biri kamerayı açtığında vb.) donmasını veya baştan yüklenmesini önleyen akıllı DOM eşleştirme motoru.
* **Late-Joiner Desteği:** Bir odaya sonradan katılan üyelerin, odadaki aktif video veya ekran yayınlarını otomatik aramayla anında yakalayabilmesini sağlayan dinamik PeerJS el sıkışması.

### 🔇 2. Yapay Zeka Destekli Gürültü Engelleme (RNNoise AI)
* **RNNoise AI Integration:** SIMD hızlandırmalı WebAssembly build'i olan RNNoise kütüphanesi kullanılarak arka plandaki fan, klima, klavye ve dip sesleri tamamen temizlenir.
* **Detached ArrayBuffer Koruması:** Web Audio AudioWorklet iş parçacığının ArrayBuffer verilerini transfer ederek sıfırlamasını önleyen güvenli bellek klonlama yama sistemi (`slice(0)`). Her oda geçişinde ve toggle işleminde tam performans sağlar.
* **Dinamik Ses Grafiği:** Ayarlar panelinden anlık olarak ses kazancı (mic gain up to 5x) ve RNNoise filtresi açılıp kapatılabilir.

### 🖥️ 3. Ekran Paylaşımı (Custom Picker Modal)
* Ekran paylaşımını başlatırken tüm ekranları ve açık pencereleri canlı küçük resimleriyle (live thumbnails) listeleyen fütüristik ekran seçici modalı.
* Tam ekran (native fullscreen) modu, video içi kontroller ve paylaşım sonlandırma tuşları.

### 👥 4. Gelişmiş Sunucu Rolleri & Renkli Kullanıcı Grupları
* **Sunucu Rolleri Paneli:** Kurucu (Host) tarafından yönetilen; rol oluşturma, silme, renk paletinden özel renk atama ve yetki hiyerarşisi oluşturma sistemi.
* Sunucu üyelerinin rollerine göre kategorize edildiği, özel rol renkleriyle süslenmiş interaktif üye listesi.
* Sunucu yetkililerine (Administrators) host tarafından kanal oluşturma, silme ve düzenleme yetkisi verilebilmesi ve bunun tüm ağda P2P paketleriyle senkronize edilmesi.

### 💬 5. Modern Sohbet UX Özellikleri
* **Emoji Tepkileri (Reactions):** Mesajların altına 24 farklı emoji ile tepki ekleme/kaldırma, tepki verenlerin sayaçları ve kendi tepkileriniz için özel parlayan mavi kenarlıklar.
* **Mesaj Düzenleme & Sabitleme (Edit & Pin):** Mesajları düzenleme altyapısı, sabitleme (pin) çekmecesi ve sabitlenmiş mesaja tek tıkla yumuşak kayma (`scrollToMessage`).
* **@Mention Autocomplete:** Sohbet alanına `@` yazıldığında sunucu üyelerini listeleyen, klavye yön tuşlarıyla gezilebilen ve seçilen üyeyi mesaj içinde vurgulayarak bildirim tetikleyen sistem.
* **Mesaj Arama:** Mesaj geçmişinde anlık (debounced) kelime arama modali ve eşleşen kelimelerin sarı ile vurgulanması.
* **Tarih Ayraçları:** Mesaj akışında günler değiştikçe ("Bugün", "Dün" veya "24 Mayıs 2026") otomatik eklenen tarih çizgileri.
* **Okunmamış Rozetleri (Unread Badges):** Kanallar, DM listesi ve sunucular için aktif olunmayan sohbetlerden gelen mesajları sayan gerçek zamanlı kırmızı unread rozetleri.

### 📎 6. Dosya Transferi & Inline Medya Oynatıcılar
* **Sürükle-Bırak (Drag & Drop):** Bilgisayarınızdan bir dosyayı doğrudan sohbet alanına sürükleyip bırakarak hızlı P2P transfer başlatma.
* **Ctrl+V Desteği:** Panodaki ekran görüntülerini veya resimleri doğrudan yapıştırarak gönderebilme.
* **Inline Audio/Video Players:** Gönderilen `.mp3`, `.wav` veya `.mp4`, `.webm` medya dosyalarını tarayıcı dışına çıkmadan doğrudan sohbet balonu içinde oynatan, ses ve ilerleme çubuğu içeren cam efektli inline oynatıcılar.

### ⌨️ 7. Win32 Düşük Seviye Global Kısayol Tuşları (Global Hotkeys)
* **C# Keyhook Derlemesi:** Arka planda çalışan ve Win32 API'leri kullanarak tüm Windows genelinde klavye basışlarını ve modifier tuşları (Ctrl, Alt, Shift) dinleyen C# tabanlı `keylistener.exe` entegrasyonu.
* Uygulama arka planda simge durumunda veya başka bir oyunda olsanız bile çalışabilen susturma (Mute - Alt+M) ve sağırlaştırma (Deafen - Alt+D) global kısayol atamaları.

---

## 🚀 Teknolojik Altyapı

* **Core Framework:** HTML5, Vanilla CSS, Vanilla Javascript (TailwindCSS yardımcı utility sınıfları ve fütüristik cam teması ile zenginleştirilmiştir).
* **Desktop Wrapper:** Electron (çerçevesiz, özel başlık çubuğu tasarımı ve sistem tepsisi - system tray entegrasyonu).
* **Networking:** PeerJS & WebRTC (Direct Datachannels for Text/Files, MediaStreams for Audio/Video).
* **Audio Processing:** Web Audio API & AudioWorkletProcessor.
* **Local Storage:** persistency of servers, channels, roles, settings, friends lists, friend requests, and direct message logs.

---

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler
* [Node.js](https://nodejs.org/) (v16 veya üzeri tavsiye edilir)
* Windows İşletim Sistemi (Global kısayol C# hook'u Windows özeldir)

### Çalıştırma Adımları
1. Repoyu bilgisayarınıza kopyalayın:
   ```bash
   git clone https://github.com/Alchemei/ALCORD.git
   cd ALCORD
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Birinci Electron profilini (Host/Kullanıcı 1) başlatın:
   ```bash
   npm run dev
   ```
4. İkinci Electron profilini (İzole edilmiştir, Kullanıcı 2) yan yana test etmek için başlatın:
   ```bash
   npm run dev2
   ```

---

## 📦 Dağıtım ve Kurulum Dosyası (Setup) Derleme

Uygulamanın Windows kurulum dosyasını (`.exe` setup) oluşturmak için aşağıdaki adımları uygulayabilirsiniz:

1. Uygulamayı Windows için paketleyin:
   ```bash
   npx electron-packager . ALCORD --platform=win32 --arch=x64 --icon=icon.ico --overwrite --ignore="dist" --ignore="ALCORD-win32-x64"
   ```
2. Inno Setup derleyicisini çalıştırarak setup kurulum dosyasını oluşturun:
   ```powershell
   & "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" setup.iss
   ```
   *Oluşturulan setup dosyası `c:\apps\ALCORD\dist\ALCORD_Setup_New.exe` dizininde yer alacaktır.*

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına göz atabilirsiniz.
