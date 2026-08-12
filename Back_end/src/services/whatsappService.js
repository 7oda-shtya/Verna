import { rm } from 'node:fs/promises';
import { DisconnectReason, Browsers, makeWASocket, useMultiFileAuthState } from 'baileys';
import qrcode from 'qrcode-terminal';

const AUTH_FOLDER = 'auth_info_baileys';
const RECONNECT_DELAY_MS = 3_000;

let sock = null;
let connected = false;
let initializing = null;
let reconnectTimer = null;
let lastQr = null;

const getDisconnectCode = error => error?.output?.statusCode || error?.data?.statusCode || error?.statusCode;

const clearReconnectTimer = () => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
};

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initializeWhatsApp().catch(error => console.error('تعذر إعادة اتصال WhatsApp:', error.message));
  }, RECONNECT_DELAY_MS);
};

export const initializeWhatsApp = async () => {
  if (sock || initializing) return initializing || sock;

  initializing = (async () => {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const socket = makeWASocket({
      auth: state,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      browser: Browsers.windows('Verna'),
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });

    sock = socket;
    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        lastQr = qr;
        console.log('\nامسح QR التالي من واتساب > الأجهزة المرتبطة لربط خدمة OTP:\n');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        connected = true;
        lastQr = null;
        clearReconnectTimer();
        console.log('تم ربط WhatsApp بخدمة OTP.');
        return;
      }

      if (connection !== 'close') return;

      connected = false;
      sock = null;
      const disconnectCode = getDisconnectCode(lastDisconnect?.error);
      if (disconnectCode === DisconnectReason.loggedOut) {
        console.warn('تم تسجيل خروج جلسة WhatsApp؛ سيتم طلب QR جديد.');
        await rm(AUTH_FOLDER, { recursive: true, force: true });
      } else {
        console.warn(`انقطع اتصال WhatsApp (${disconnectCode || 'unknown'})؛ ستتم إعادة المحاولة.`);
      }
      scheduleReconnect();
    });

    return socket;
  })();

  try {
    return await initializing;
  } finally {
    initializing = null;
  }
};

const normalizeEgyptianNumber = phoneNumber => {
  let digits = String(phoneNumber || '').replace(/\D/g, '');
  if (digits.startsWith('20')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
};

export const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const localNumber = normalizeEgyptianNumber(phoneNumber);
    if (!/^(10|11|12|15)\d{8}$/.test(localNumber)) {
      throw new Error('رقم هاتف مصري غير صالح لإرسال WhatsApp');
    }
    if (!sock || !connected) {
      throw new Error('WhatsApp غير متصل بعد؛ امسح QR من نافذة السيرفر أولًا');
    }

    const jid = `20${localNumber}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    return { success: true };
  } catch (error) {
    console.error('تعذر إرسال رسالة WhatsApp:', error.message);
    return { success: false, error: error.message };
  }
};

export const getWhatsAppStatus = () => ({ connected, qr: lastQr });