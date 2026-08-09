import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const avatarStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: 'verna/avatars',
		allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
		transformation: [{ width: 512, height: 512, crop: 'limit' }],
	},
});

const createImageStorage = folder => new CloudinaryStorage({
	cloudinary,
	params: {
		folder,
		allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
		transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
	},
});

const carStorage = createImageStorage('verna/cars');
const licenseStorage = createImageStorage('verna/licenses');
const reportStorage = createImageStorage('verna/reports');
const supportStorage = createImageStorage('verna/support');

function imageFileFilter(req, file, cb) {
	if (!file.mimetype.startsWith('image/')) {
		return cb(new ApiError(400, 'الملف المرفوع لازم يكون صورة'));
	}
	cb(null, true);
}

export const uploadAvatar = multer({
	storage: avatarStorage,
	fileFilter: imageFileFilter,
	limits: { fileSize: 5 * 1024 * 1024 },
});

const imageUpload = storage => multer({
	storage,
	fileFilter: imageFileFilter,
	limits: { fileSize: 8 * 1024 * 1024 },
});

export const uploadCarPicture = imageUpload(carStorage);
export const uploadDriverLicense = imageUpload(licenseStorage);
export const uploadReportAttachment = imageUpload(reportStorage);
export const uploadSupportAttachment = imageUpload(supportStorage);
const KYC_FIELD_FOLDERS = {
	license: 'verna/licenses',
	carPicture: 'verna/cars',
	carLicense: 'verna/car-licenses',
	nationalIdFront: 'verna/national-ids',
	nationalIdBack: 'verna/national-ids',
};

export const uploadDriverKyc = multer({
	storage: new CloudinaryStorage({
		cloudinary,
		params: async (req, file) => ({
			folder: KYC_FIELD_FOLDERS[file.fieldname] || 'verna/cars',
			allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
			transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
		}),
	}),
	fileFilter: imageFileFilter,
	limits: { fileSize: 8 * 1024 * 1024 },
});
