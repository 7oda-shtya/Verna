import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { initializeSocket } from './src/socket/index.js';
import { initializeWhatsApp } from './src/services/whatsappService.js';
import './src/jobs/weeklyLeaderboard.job.js';
import './src/jobs/weeklyReputation.job.js';
import './src/jobs/tripExpiration.job.js';

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

initializeSocket(httpServer);
initializeWhatsApp().catch(error => console.error('تعذر بدء خدمة WhatsApp:', error.message));

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
