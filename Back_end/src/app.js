import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use('/fonts', express.static(path.join(__dirname, '../public/fonts'), {
	setHeaders: res => res.setHeader('Content-Type', 'application/x-protobuf'),
}));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, '../public/privacy.html')));
app.use('/api', routes);

app.use(errorHandler);


export default app;