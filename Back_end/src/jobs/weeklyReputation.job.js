import cron from 'node-cron';
import { recalculateReputationScores } from '../services/reputation.service.js';

cron.schedule('0 6 * * 0', async () => {
  try {
    const updatedUsers = await recalculateReputationScores();
    console.log(`تم تحديث السمعة الأسبوعية لـ ${updatedUsers} مستخدم.`);
  } catch (error) {
    console.error('تعذر تحديث درجات السمعة الأسبوعية:', error);
  }
}, { timezone: 'Africa/Cairo' });
