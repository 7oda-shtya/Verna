class ApiError extends Error {
	constructor(statusCode, message, field = null, details = null) {
		super(message);
		this.statusCode = statusCode;
		this.field = field; 
		this.details = details;
		Error.captureStackTrace(this, this.constructor);
	}
}

export default ApiError;
