import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Matches errorHandler.middleware.js's response shape so the frontend's existing
// `error.response?.data?.message` handling works the same way for 429s as any other ApiError.
const rateLimitHandler = message => (req, res) => {
	res.status(429).json({ success: false, message, field: null, details: null });
};

// Unauthenticated route — keyed by phone number (the thing actually being protected from abuse)
// with an IP fallback so an empty/malformed phone can't dodge the limit entirely.
export const otpRequestLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: 3,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => req.body?.phone || ipKeyGenerator(req.ip),
	handler: rateLimitHandler('عدد كبير من طلبات رمز التحقق لنفس الرقم، حاول تاني بعد شوية'),
});

// Mounted after `authenticate`, so req.user is always set here.
export const placesSearchLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 30,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => req.user.id,
	handler: rateLimitHandler('عدد كبير من طلبات البحث، حاول تاني بعد شوية'),
});
