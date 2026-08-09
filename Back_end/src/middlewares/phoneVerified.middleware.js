import ApiError from '../utils/ApiError.js';

export function requirePhoneVerified(req, res, next) {
  if (!req.user?.isPhoneVerified) {
    return next(new ApiError(403, 'لازم تأكد رقم هاتفك قبل طلب رحلة'));
  }
  next();
}
