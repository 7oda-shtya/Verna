const KYC_REQUIREMENTS = [
	{ key: 'driverLicense', label: 'رخصة القيادة', get: user => user?.driverLicense },
	{ key: 'nationalIdFront', label: 'البطاقة (الوجه الأمامي)', get: user => user?.nationalIdFront },
	{ key: 'nationalIdBack', label: 'البطاقة (الوجه الخلفي)', get: user => user?.nationalIdBack },
	{ key: 'carPicture', label: 'صورة السيارة', get: user => user?.car?.picture },
	{ key: 'carLicense', label: 'رخصة السيارة', get: user => user?.car?.licenseDocument },
	{ key: 'model', label: 'موديل السيارة', get: user => user?.car?.model?.trim() },
	{ key: 'plateNumber', label: 'رقم اللوحة', get: user => user?.car?.plateNumber?.trim() },
];

export function getMissingKycItems(user) {
	return KYC_REQUIREMENTS.filter(item => !item.get(user));
}

export function isDriverKycComplete(user) {
	return getMissingKycItems(user).length === 0;
}

export function missingKycCountLabel(count) {
	if (count === 1) return 'باقي مستند واحد بس!';
	if (count === 2) return 'باقي مستندين بس!';
	if (count >= 3 && count <= 10) return `باقي ${count} مستندات بس!`;
	return `باقي ${count} مستند بس!`;
}
