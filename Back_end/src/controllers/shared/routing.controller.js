import { catchAsync } from '../../utils/catchAsync.js'
import ApiError from '../../utils/ApiError.js'
import NodeCache from 'node-cache'

// Repeated route requests between the same two points are common within a small city like
// El-Arish (same daily commute, same popular pickup/dropoff pairs) — this avoids re-hitting the
// public OSRM server for those. Keyed by the full (rounded) points array, not just start/end, so
// two trips sharing start/end but differing only in an intermediate waypoint don't collide.
const ROUTE_CACHE_TTL_SECONDS = 10 * 60
const routeCache = new NodeCache({ stdTTL: ROUTE_CACHE_TTL_SECONDS, checkperiod: 120 })

const ROUTE_COORD_DECIMALS = 4 // ~11m precision at this latitude

const roundCoord = value => Number(value.toFixed(ROUTE_COORD_DECIMALS))

const routeCacheKey = points => points.map(p => `${roundCoord(p.lat)},${roundCoord(p.lng)}`).join(';')

export const getRoute = catchAsync(async (req, res) => {
	const { points } = req.body;

	if (!points || points.length < 2) {
		throw new ApiError(400, 'points array with at least 2 points is required');
	}

	const cacheKey = routeCacheKey(points)
	const cached = routeCache.get(cacheKey)
	if (cached) {
		return res.status(200).json({ success: true, data: cached })
	}

	const coordsString = points.map(p => `${p.lng},${p.lat}`).join(';');
	const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

	const osrmRes = await fetch(osrmUrl);
	const osrmData = await osrmRes.json();

	if (osrmData.code !== 'Ok') {
		throw new ApiError(502, 'Failed to calculate route');
	}

	const route = osrmData.routes[0];
	const coordinates = route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));

	const data = {
		coordinates,
		distanceKm: +(route.distance / 1000).toFixed(2),
		durationMin: Math.ceil(route.duration / 60),
	};
	routeCache.set(cacheKey, data)

	res.status(200).json({
		success: true,
		data,
	});
});
