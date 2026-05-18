const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Statik dosyaları (HTML, CSS, JS, Medya vb.) ana dizinden servis et
app.use(express.static(path.join(__dirname)));

// Diğer tüm rotalar için index.html döndür (Single Page Application fallback)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n=============================================`);
    console.log(`🚀 Özgür Sohbet Web Sunucusu Başlatıldı!`);
    console.log(`🌐 Bağlantı Adresi: http://localhost:${PORT}`);
    console.log(`=============================================\n`);
});
