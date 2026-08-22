const BASE_FARE = 15;
const PER_KM = 5;
const MIN_FARE = 20;

const CATEGORY_MULTIPLIERS = {
	economy: 1,
	comfort: 1.25,
	premium: 1.5,
};

export const VEHICLE_CATEGORIES = [
	{ id: 'economy', label: 'اقتصادي', icon: 'car-outline' },
	{ id: 'comfort', label: 'مريح', icon: 'car-sport-outline' },
	{ id: 'premium', label: 'فاخر', icon: 'diamond-outline' },
];

export function estimateTripPrice(distanceKm, vehicleCategory = 'economy') {
	const distance = Number(distanceKm);
	if (!Number.isFinite(distance) || distance <= 0) return MIN_FARE;
	const multiplier = CATEGORY_MULTIPLIERS[vehicleCategory] ?? 1;
	return Math.max(MIN_FARE, Math.round((BASE_FARE + distance * PER_KM) * multiplier));
}
