export function generateReferralCode(name) {
	const prefix = name.replace(/\s+/g, '').slice(0, 4).toUpperCase();
	const random = Math.random().toString(36).slice(2, 6).toUpperCase();
	return `${prefix}-${random}`;
}
