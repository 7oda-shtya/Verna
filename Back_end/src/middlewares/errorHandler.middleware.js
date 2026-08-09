export function errorHandler(err, req, res, next) {
	const statusCode = err.statusCode || 500;
	res.status(statusCode).json({
		success: false,
		message: err.message || "حصل خطأ في السيرفر",
		field: err.field || null,
		details: err.details || null,
	});
}
