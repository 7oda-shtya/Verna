import { catchAsync } from '../../utils/catchAsync.js'
import ApiError from '../../utils/ApiError.js'
import { prisma } from '../../db.js'

const NORTH_SINAI_BBOX = '33.55,31.25,34.35,30.85'
const NEARBY_LIMIT = 100
const NEAREST_RADIUS_M = 80
const NEAREST_SEARCH_DELTA_DEG = 0.001 // ~110m, generous padding around NEAREST_RADIUS_M

async function searchApprovedLocations(query) {
	const results = await prisma.location.findMany({
		where: { name: { contains: query, mode: 'insensitive' } },
		take: 10,
	})
	return results.map(loc => ({
		id: `db-${loc.id}`,
		name: loc.name,
		lat: loc.lat,
		lng: loc.lng,
		source: 'approved',
	}))
}

function haversineMeters(lat1, lng1, lat2, lng2) {
	const R = 6371000
	const toRad = deg => (deg * Math.PI) / 180
	const dLat = toRad(lat2 - lat1)
	const dLng = toRad(lng2 - lng1)
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
	return 2 * R * Math.asin(Math.sqrt(a))
}

export const searchPlaces = catchAsync(async (req, res) => {
	const { q } = req.query
	if (!q || q.trim().length < 2) {
		return res.status(200).json({ success: true, data: [] })
	}

	const approvedResults = await searchApprovedLocations(q)

	const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&viewbox=${NORTH_SINAI_BBOX}&bounded=1&countrycodes=eg&limit=8`
	const nominatimRes = await fetch(url, {
		headers: { 'User-Agent': 'VernaApp/1.0 (mahmoudelrhman@gmail.com)' },
	})
	const nominatimData = await nominatimRes.json()
	const remoteResults = nominatimData.map(r => ({
		id: r.place_id,
		name: r.display_name,
		lat: parseFloat(r.lat),
		lng: parseFloat(r.lon),
		source: 'nominatim',
	}))

	res.status(200).json({
		success: true,
		data: [...approvedResults, ...remoteResults],
	})
})

export const getNearbyPlaces = catchAsync(async (req, res) => {
	const { minLat, minLng, maxLat, maxLng } = req.query
	if ([minLat, minLng, maxLat, maxLng].some(v => v === undefined)) {
		throw new ApiError(400, 'minLat, minLng, maxLat and maxLng are required')
	}

	const results = await prisma.location.findMany({
		where: {
			lat: { gte: parseFloat(minLat), lte: parseFloat(maxLat) },
			lng: { gte: parseFloat(minLng), lte: parseFloat(maxLng) },
		},
		take: NEARBY_LIMIT,
	})

	res.status(200).json({ success: true, data: results })
})

export const getNearestPlace = catchAsync(async (req, res) => {
	const { lat, lng } = req.query
	if (lat === undefined || lng === undefined) {
		throw new ApiError(400, 'lat and lng are required')
	}

	const latNum = parseFloat(lat)
	const lngNum = parseFloat(lng)

	const candidates = await prisma.location.findMany({
		where: {
			lat: { gte: latNum - NEAREST_SEARCH_DELTA_DEG, lte: latNum + NEAREST_SEARCH_DELTA_DEG },
			lng: { gte: lngNum - NEAREST_SEARCH_DELTA_DEG, lte: lngNum + NEAREST_SEARCH_DELTA_DEG },
		},
	})

	let nearest = null
	let nearestDistance = Infinity
	for (const candidate of candidates) {
		const distance = haversineMeters(latNum, lngNum, candidate.lat, candidate.lng)
		if (distance < nearestDistance) {
			nearestDistance = distance
			nearest = candidate
		}
	}

	if (!nearest || nearestDistance > NEAREST_RADIUS_M) {
		return res.status(200).json({ success: true, data: null })
	}

	res.status(200).json({
		success: true,
		data: {
			id: nearest.id,
			name: nearest.name,
			lat: nearest.lat,
			lng: nearest.lng,
			importance: nearest.importance,
			distance: Math.round(nearestDistance),
		},
	})
})
