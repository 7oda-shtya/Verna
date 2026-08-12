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

  const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;

  res.send(`
    <html dir="rtl">
      <body style="display:flex;flex-direction:column;align-items:center;font-family:sans-serif;margin-top:40px">
        <h2>امسح الكود ده من واتساب &gt; الأجهزة المرتبطة</h2>
        <img src="${imgUrl}" width="300" height="300" alt="WhatsApp QR" />
        <p style="color:#666">لو الكود خلص صلاحيته، اعمل Refresh للصفحة</p>
      </body>
    </html>
  `);
});

export default router;