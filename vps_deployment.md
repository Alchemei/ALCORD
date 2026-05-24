# 🌌 ALCORD - 24/7 Bulut Sunucu (VPS) Kurulum Kılavuzu

Bu kılavuz, ALCORD ağınızı **7 gün 24 saat kesintisiz** çevrimiçi tutmak için hazırlanan hafif ve güçlü **`headless-host.js`** scriptini bir Linux veya Windows bulut sunucusunda (VPS) nasıl çalıştıracağınızı adım adım açıklamaktadır.

Bu kurulum sayesinde, kişisel bilgisayarınızı kapatsanız dahi sunucunuz ve ses kanallarınız sürekli online kalacaktır!

---

## ☁️ 1. Adım: Bir Bulut Sunucu (VPS) Edinme
Tamamen ücretsiz veya son derece ucuz bulut sunucu sunan popüler platformlardan birini tercih edebilirsiniz:
*   **Oracle Cloud (Önerilen - Her Zaman Ücretsiz):** 4 CPU ve 24 GB RAM'e kadar "Always Free" Ubuntu sunucu sunar.
*   **Google Cloud / AWS (Free Tier):** 1 yıl boyunca geçerli ücretsiz giriş seviyesi VPS sunarlar.
*   **DigitalOcean / Hetzner:** Aylık 4-5$ gibi çok düşük ücretlerle anında Ubuntu sunucu kiralayabilirsiniz.

> [!NOTE]
> Sunucu işletim sistemi olarak **Ubuntu Server 20.04 LTS** veya **22.04 LTS** tercih edilmesi kurulumu en kolay hale getirecektir.

---

## ⚙️ 2. Adım: Sunucuda Gerekli Altyapıyı Kurma
Sunucunuza SSH ile (veya Windows Server kullanıyorsanız Uzak Masaüstü ile) bağlandıktan sonra sırasıyla şu komutları çalıştırarak Node.js ve Chromium (Puppeteer) kütüphanelerini kurun:

### 🐧 Linux (Ubuntu/Debian) Kurulumu:

1.  **Sistem Güncelleme:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Node.js Kurulumu (v18+):**
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

3.  **Tarayıcı Kütüphaneleri (Puppeteer için gerekli Chromium bağımlılıkları):**
    ```bash
    sudo apt-get install -y libxss1 libgconf-2-4 libnss3 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdbus-1-3 libgtk-3-0 libgbm1 libasound2-dev
    ```

---

## 📂 3. Adım: Projeyi Sunucuya Aktarma ve Kütüphaneleri Yükleme

1.  **ALCORD Kodlarını Sunucuya Çekin:**
    ```bash
    git clone https://github.com/Alchemei/ALCORD.git
    cd ALCORD
    ```

2.  **Gerekli Node.js Paketlerini Yükleyin:**
    ```bash
    npm install
    ```

3.  **Puppeteer (Arayüzsüz Tarayıcı) Paketini Kurun:**
    ```bash
    npm install puppeteer --save
    ```

---

## 🚀 4. Adım: Sunucuyu 24/7 PM2 ile Arka Planda Çalıştırma
Uygulamanın sunucu kapansa bile arka planda **sonsuza kadar** çalışmaya devam etmesi ve hata durumunda otomatik olarak yeniden başlatılması için **PM2** yöneticisini kullanacağız.

1.  **PM2'yi Küresel Olarak Kurun:**
    ```bash
    sudo npm install -y pm2 -g
    ```

2.  **Headless Sunucuyu Başlatın:**
    ```bash
    pm2 start headless-host.js --name "alcord-server"
    ```

3.  **Sunucunun Durumunu Kontrol Edin:**
    ```bash
    pm2 status
    ```

4.  **Canlı Logları / Konsol Çıktılarını İzleyin:**
    ```bash
    pm2 logs alcord-server
    ```
    *Konsolda `💚 ALCORD Sunucusu 24/7 ONLINE ve Host Ediliyor!` yazısını gördüyseniz işlem başarıyla tamamlanmıştır!*

5.  **Sunucu Yeniden Başlatıldığında Otomatik Açılması İçin Kaydedin:**
    ```bash
    pm2 startup
    pm2 save
    ```

---

## ⚡ İpuçları & Faydalı Komutlar
*   **Sunucuyu Durdurmak İçin:** `pm2 stop alcord-server`
*   **Sunucuyu Yeniden Başlatmak İçin:** `pm2 restart alcord-server`
*   **Ağ Davet Kodu:** Arkadaşlarınızla paylaşacağınız kalıcı ağ kodu: **`alcord_srv_yr0p1m1`**

Artık ağınız 24/7 tamamen güvenli, uçtan uca şifreli ve kesintisiz bir şekilde bulutta online! Keyifli sohbetler dileriz! 🌌
