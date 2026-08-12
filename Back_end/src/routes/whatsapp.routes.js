import { Router } from 'express';
import { getWhatsAppStatus } from '../services/whatsappService.js';

const router = Router();

router.get('/qr', (req, res) => {
  const { connected, qr } = getWhatsAppStatus();

  if (connected) {
    return res.send('<h2 style="font-family:sans-serif">واتساب متصل بالفعل ✅</h2>');
  }
  if (!qr) {
    return res.send('<h2 style="font-family:sans-serif">مفيش QR جاهز دلوقتي، جرّب Refresh بعد ثواني</h2>');
  }

  res.send(`
    <html dir="rtl">
      <body style="display:flex;flex-direction:column;align-items:center;font-family:sans-serif;margin-top:40px">
        <h2>امسح الكود ده من واتساب &gt; الأجهزة المرتبطة</h2>
        <div id="qr"></div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        <script>
          QRCode.toCanvas(document.getElementById('qr'), ${JSON.stringify(qr)}, { width: 300 });
        </script>
      </body>
    </html>
  `);
});

export default router;