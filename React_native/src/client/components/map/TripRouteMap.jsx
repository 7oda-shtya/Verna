import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Map as MapLibreMap, Camera, ViewAnnotation, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { View, Pressable, Text, Modal } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { convertArabic } from 'arabic-reshaper';
import { SERVER_ORIGIN } from '../../../api/client';
import { nearbyPlacesRequest } from '../../services/place.service';
import { distanceMeters } from '../../../redux/utils/geo';
import { useTheme } from '../../../theme/useTheme';
import { TourTarget } from '../../../tour';

const MAP_STYLE_STORAGE_KEY = 'mapStyle';
const NEARBY_FETCH_DEBOUNCE_MS = 400;
const NEARBY_REFETCH_MIN_DISTANCE_M = 500;
const NEARBY_REFETCH_ZOOM_RATIO_THRESHOLD = 1.4; // bounds span growing/shrinking by >40% counts as a meaningful zoom change
const NEARBY_CACHE_MAX_ENTRIES = 30;
const NEARBY_CACHE_BUCKET_DEGREES = 0.01; // ~1.1km grid cells, used only as a cache lookup key
const REGULAR_MARKER_MIN_ZOOM = 11;
const REGULAR_LABEL_MIN_ZOOM = 13;
const IMPORTANT_MARKER_MIN_ZOOM = 9;
const IMPORTANT_LABEL_MIN_ZOOM = 12;
const IMPORTANT_FILTER = ['>', ['coalesce', ['get', 'importance'], 0], 0];
const REGULAR_FILTER = ['<=', ['coalesce', ['get', 'importance'], 0], 0];
const PRESS_PULSE_RADIUS_M = 100;
const PRESS_PULSE_DURATION_MS = 1500;
const DEVIATION_RECOMPUTE_MS = 2000;
const OFF_ROUTE_DISTANCE_M = 60;
const OFF_ROUTE_SAMPLES_REQUIRED = 3;

const toLngLat = point => [point.lng, point.lat];

const toRoutePoint = point => ({ lat: Number(point.latitude), lng: Number(point.longitude) });

// Local equirectangular projection is accurate enough for the short segments returned by OSRM,
// avoids a map-matching dependency, and makes nearest-segment work O(number of route points).
const nearestRoutePoint = (location, route) => {
	if (!location || route.length < 2) return null;
	const latitudeRadians = (location.lat * Math.PI) / 180;
	const metersPerDegreeLat = 111320;
	const metersPerDegreeLng = metersPerDegreeLat * Math.cos(latitudeRadians);
	const point = { x: location.lng * metersPerDegreeLng, y: location.lat * metersPerDegreeLat };
	let nearest = null;
	route.slice(0, -1).forEach((start, index) => {
		const end = route[index + 1];
		const a = { x: start.lng * metersPerDegreeLng, y: start.lat * metersPerDegreeLat };
		const b = { x: end.lng * metersPerDegreeLng, y: end.lat * metersPerDegreeLat };
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const lengthSquared = dx * dx + dy * dy;
		const fraction = lengthSquared ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared)) : 0;
		const snapped = { lat: start.lat + (end.lat - start.lat) * fraction, lng: start.lng + (end.lng - start.lng) * fraction };
		const distance = Math.hypot(point.x - snapped.lng * metersPerDegreeLng, point.y - snapped.lat * metersPerDegreeLat);
		if (!nearest || distance < nearest.distance) nearest = { index, fraction, snapped, distance };
	});
	return nearest;
};

const AnimatedPartyMarker = ({ location }) => {
	const [coordinate, setCoordinate] = useState(location);
	const fromLat = useSharedValue(location.lat);
	const fromLng = useSharedValue(location.lng);
	const toLat = useSharedValue(location.lat);
	const toLng = useSharedValue(location.lng);
	const progress = useSharedValue(1);
	const latestCoordinate = useRef(location);

	useEffect(() => {
		const from = latestCoordinate.current;
		fromLat.value = from.lat;
		fromLng.value = from.lng;
		toLat.value = location.lat;
		toLng.value = location.lng;
		progress.value = 0;
		progress.value = withTiming(1, { duration: 850 });
	}, [fromLat, fromLng, location.lat, location.lng, progress, toLat, toLng]);

	useAnimatedReaction(
		() => progress.value,
		value => {
			const next = { lat: fromLat.value + (toLat.value - fromLat.value) * value, lng: fromLng.value + (toLng.value - fromLng.value) * value };
			runOnJS(setCoordinate)(next);
		},
	);

	useEffect(() => { latestCoordinate.current = coordinate; }, [coordinate]);
	return <ViewAnnotation lngLat={toLngLat(coordinate)} anchor='center'><Animated.View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#f97316', borderWidth: 3, borderColor: '#fff' }} /></ViewAnnotation>;
};

// Approximates a real-world radius (meters) as a pixel circle-radius via zoom interpolation,
// since MapLibre's circle-radius is always in screen pixels, not meters.
const metersToPixelsAtMaxZoom = (meters, latitude) =>
	meters / 0.075 / Math.cos((latitude * Math.PI) / 180);

const TILE_STYLES = {
	standard: {
		url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
		title: 'الخريطة العادية',
		color: '#2563eb',
		icon: <Ionicons name='map' size={20} color='white' />,
	},
	satellite: {
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
		title: 'قمر صناعي',
		color: '#9333ea',
		icon: <MaterialCommunityIcons name='satellite-variant' size={20} color='white' />,
	},
	terrain: {
		url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
		title: 'تضاريس',
		color: '#16a34a',
		icon: <MaterialCommunityIcons name='image-filter-hdr' size={20} color='white' />,
	},
	dark: {
		url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
		title: 'الوضع الداكن',
		color: '#3f3f46',
		icon: <Ionicons name='moon' size={20} color='white' />,
	},
};

const PinMarker = ({ color, size = 28 }) => {
	const { theme } = useTheme();
	const tipWidth = size * 0.55;
	const tipHeight = size * 0.6;
	const overlap = size * 0.12;
	return (
		<View style={{ width: size, height: size + tipHeight - overlap }}>
			<View
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: color,
					borderWidth: 3,
					borderColor: theme.colors.background,
				}}
			/>
			<View
				style={{
					position: 'absolute',
					top: size - overlap,
					left: (size - tipWidth) / 2,
					width: 0,
					height: 0,
					borderLeftWidth: tipWidth / 2,
					borderRightWidth: tipWidth / 2,
					borderTopWidth: tipHeight,
					borderLeftColor: 'transparent',
					borderRightColor: 'transparent',
					borderTopColor: color,
				}}
			/>
		</View>
	);
};

// self-hosted (verified complete Arabic coverage) instead of the external demotiles demo server, which timed out under real usage
const GLYPHS_URL = `${SERVER_ORIGIN}/fonts/{fontstack}/{range}.pbf`;
const LABEL_FONT = ['Noto Sans Regular'];

const buildMapStyle = tileUrl => ({
	version: 8,
	glyphs: GLYPHS_URL,
	sources: { baseTiles: { type: 'raster', tiles: [tileUrl], tileSize: 256 } },
	layers: [{ id: 'baseLayer', type: 'raster', source: 'baseTiles' }],
});

const TileModal = ({ currentStyle, onSelect, isModalVisible, onClose }) => {
	const { theme } = useTheme();
	const { colors } = theme;
	return (
	<Modal visible={isModalVisible} transparent animationType='fade' onRequestClose={onClose} className=''>
		<Pressable className='flex-1 justify-center p-7' style={{ backgroundColor: colors.backdrop }} onPress={onClose}>
			<Pressable className='rounded-3xl p-4 gap-4' style={theme.components.modal} onPress={e => e.stopPropagation()}>
				<View className='flex-row justify-between items-center p-3' style={{ borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}>
					<Text className='text-lg font-bold' style={{ color: colors.textPrimary }}>اختر تصميم الخريطة</Text>
					<Pressable onPress={onClose}>
						<FontAwesome name='close' size={24} color={colors.textPrimary} />
					</Pressable>
				</View>

				<View className='gap-3'>
					{Object.entries(TILE_STYLES).map(([key, item]) => (
						<Pressable
							key={key}
							onPress={() => onSelect(key)}
							className='flex-row items-center justify-between p-3 rounded-xl'
							style={{
								backgroundColor: currentStyle === key ? colors.primaryMuted : colors.surfaceElevated,
								borderColor: currentStyle === key ? colors.primary : colors.border,
								borderWidth: theme.borderWidths.subtle,
							}}
						>
							<View className='flex-row items-center gap-3'>
								<Text className='font-bold text-xl' style={{ color: colors.textPrimary }}>{item.title}</Text>
							</View>
							<View className='w-11 h-11 rounded-xl items-center justify-center' style={{ backgroundColor: item.color }}>
								{item.icon}
							</View>
						</Pressable>
					))}
				</View>
			</Pressable>
		</Pressable>
	</Modal>
	);
};

const TripRouteMap = ({ startPin, endPin, waypoints = [], routeCoordinates = [], onMapPress, userLocation, partyLocation, partyLocations = [], driverLocation, showRouteDeviation = false, tourId }) => {
	const { theme } = useTheme();
	const { colors } = theme;
	const [mapStyle, setMapStyle] = useState('standard');
	const [isModalVisible, setIsModalVisible] = useState(false);

	const [initialCenter] = useState(() => (startPin ? toLngLat(startPin) : [33.7984, 31.1313]));
	const [mapReady, setMapReady] = useState(false)

	const mapRef = useRef(null);
	const cameraRef = useRef(null);
	const [nearbyPlaces, setNearbyPlaces] = useState([]);
	const nearbyDebounceRef = useRef(null);
	const lastNearbyFetchRef = useRef(null); // { center: {lat,lng}, span } of the last request actually sent
	const nearbyCacheRef = useRef(new Map()); // bucket key -> places array, so panning back reuses results

	const [pressPulse, setPressPulse] = useState(null);
	const pressPulseTimeoutRef = useRef(null);
	const [traversedRoute, setTraversedRoute] = useState([]);
	const [offRouteTrace, setOffRouteTrace] = useState([]);
	const deviationStateRef = useRef({ lastAt: 0, offRouteSamples: 0 });

	const normalizedRoute = useMemo(() => routeCoordinates.map(toRoutePoint).filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng)), [routeCoordinates]);

	useEffect(() => {
		deviationStateRef.current = { lastAt: 0, offRouteSamples: 0 };
		const frame = requestAnimationFrame(() => {
			setTraversedRoute([]);
			setOffRouteTrace([]);
		});
		return () => cancelAnimationFrame(frame);
	}, [routeCoordinates, showRouteDeviation]);

	useEffect(() => {
		if (!showRouteDeviation || !driverLocation || normalizedRoute.length < 2) return;
		const now = Date.now();
		if (now - deviationStateRef.current.lastAt < DEVIATION_RECOMPUTE_MS) return;
		deviationStateRef.current.lastAt = now;
		const nearest = nearestRoutePoint(driverLocation, normalizedRoute);
		if (!nearest) return;
		const traversed = [...normalizedRoute.slice(0, nearest.index + 1), nearest.snapped];
		let appendOffRoutePoint = false;
		if (nearest.distance > OFF_ROUTE_DISTANCE_M) {
			deviationStateRef.current.offRouteSamples += 1;
			if (deviationStateRef.current.offRouteSamples >= OFF_ROUTE_SAMPLES_REQUIRED) {
				appendOffRoutePoint = true;
			}
		} else {
			deviationStateRef.current.offRouteSamples = 0;
		}
		const frame = requestAnimationFrame(() => {
			setTraversedRoute(traversed);
			if (appendOffRoutePoint) setOffRouteTrace(current => [...current, driverLocation]);
		});
		return () => cancelAnimationFrame(frame);
	}, [driverLocation, normalizedRoute, showRouteDeviation]);

	useEffect(() => {
		AsyncStorage.getItem(MAP_STYLE_STORAGE_KEY).then(savedStyle => {
			if (savedStyle && TILE_STYLES[savedStyle]) setMapStyle(savedStyle);
		});
	}, []);

	useEffect(() => () => {
		if (nearbyDebounceRef.current) clearTimeout(nearbyDebounceRef.current);
		if (pressPulseTimeoutRef.current) clearTimeout(pressPulseTimeoutRef.current);
	}, []);

	const handleSelectStyle = style => {
		setMapReady(false);
		setMapStyle(style);
		setIsModalVisible(false);
		AsyncStorage.setItem(MAP_STYLE_STORAGE_KEY, style);
	};
	const routeGeoJSON = {
		type: 'Feature',
		geometry: { type: 'LineString', coordinates: routeCoordinates.map(c => [c.longitude, c.latitude]) },
	};
	const traversedRouteGeoJSON = useMemo(() => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: traversedRoute.map(toLngLat) } }), [traversedRoute]);
	const offRouteGeoJSON = useMemo(() => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: offRouteTrace.map(toLngLat) } }), [offRouteTrace]);

	const routeBounds = useMemo(() => {
		const points = routeCoordinates
			.map(point => [Number(point.longitude), Number(point.latitude)])
			.filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
		if (points.length < 2) return null;
		const lngs = points.map(([lng]) => lng);
		const lats = points.map(([, lat]) => lat);
		return [
			Math.min(...lngs),
			Math.min(...lats),
			Math.max(...lngs),
			Math.max(...lats),
		];
	}, [routeCoordinates]);

	const mapStyleJSON = useMemo(
		() => JSON.stringify(buildMapStyle(TILE_STYLES[mapStyle].url)),
		[mapStyle]
	);

	useEffect(() => {
		if (!mapReady || !routeBounds) return;
		cameraRef.current?.fitBounds(routeBounds, {
			padding: { top: 250, right: 96, bottom: 170, left: 96 },
			duration: 850,
			easing: 'ease',
		});
	}, [mapReady, routeBounds]);

	// bounds: [west, south, east, north], as returned by MapLibre's getBounds()/onRegionDidChange
	const fetchNearbyPlaces = useCallback((bounds) => {
		if (!bounds) return;
		const [minLng, minLat, maxLng, maxLat] = bounds;
		const center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
		const span = Math.max(maxLat - minLat, maxLng - minLng);

		const last = lastNearbyFetchRef.current;
		if (last) {
			const movedMeters = distanceMeters(last.center, center);
			const zoomRatio = last.span > 0 ? Math.max(span, last.span) / Math.min(span, last.span) : 1;
			// Hasn't moved or zoomed enough since the last request to be worth a new one — leave
			// whatever's already showing as-is.
			if (movedMeters <= NEARBY_REFETCH_MIN_DISTANCE_M && zoomRatio <= NEARBY_REFETCH_ZOOM_RATIO_THRESHOLD) return;
		}

		const cacheKey = `${Math.round(center.lat / NEARBY_CACHE_BUCKET_DEGREES)}:${Math.round(center.lng / NEARBY_CACHE_BUCKET_DEGREES)}`;
		const cached = nearbyCacheRef.current.get(cacheKey);
		if (cached) {
			setNearbyPlaces(cached);
			lastNearbyFetchRef.current = { center, span };
			return;
		}

		nearbyPlacesRequest({ minLat, minLng, maxLat, maxLng })
			.then(res => {
				const places = res.data?.data || [];
				setNearbyPlaces(places);
				lastNearbyFetchRef.current = { center, span };
				const cache = nearbyCacheRef.current;
				cache.set(cacheKey, places);
				if (cache.size > NEARBY_CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
			})
			.catch(() => {});
	}, []);

	const handleRegionDidChange = useCallback(e => {
		const bounds = e?.nativeEvent?.bounds;
		if (!bounds) return;
		if (nearbyDebounceRef.current) clearTimeout(nearbyDebounceRef.current);
		nearbyDebounceRef.current = setTimeout(() => fetchNearbyPlaces(bounds), NEARBY_FETCH_DEBOUNCE_MS);
	}, [fetchNearbyPlaces]);

	const nearbyGeoJSON = useMemo(() => ({
		type: 'FeatureCollection',
		features: nearbyPlaces.map(place => ({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [place.lng, place.lat] },
			// pre-shaped to presentation forms so MapLibre Native's own (unreliable) Arabic shaping is bypassed
			properties: { name: convertArabic(place.name || ''), importance: place.importance ?? 0 },
		})),
	}), [nearbyPlaces]);

	const pressPulseGeoJSON = useMemo(() => pressPulse && ({
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [pressPulse.lng, pressPulse.lat] },
	}), [pressPulse]);

	const showPressPulse = (lng, lat) => {
		if (pressPulseTimeoutRef.current) clearTimeout(pressPulseTimeoutRef.current);
		setPressPulse({ lng, lat });
		pressPulseTimeoutRef.current = setTimeout(() => setPressPulse(null), PRESS_PULSE_DURATION_MS);
	};

	return (
		<View style={{ flex: 1 }}>
			<MapLibreMap
				key={mapStyle}
				ref={mapRef}
				style={{ flex: 1 }}
				mapStyle={mapStyleJSON}
				onDidFinishLoadingMap={() => {
					setMapReady(true);
					mapRef.current?.getBounds().then(fetchNearbyPlaces).catch(() => {});
				}}
				onRegionDidChange={handleRegionDidChange}
				onPress={e => {
					const [lng, lat] = e.nativeEvent.lngLat;
					showPressPulse(lng, lat);
					onMapPress?.({ latitude: lat, longitude: lng });
				}}
			>
				<Camera ref={cameraRef} initialViewState={{ center: initialCenter, zoom: 13 }} />
				{mapReady && startPin && (
					<ViewAnnotation lngLat={toLngLat(startPin)} anchor='bottom'>
						<PinMarker color='#10b981' />
					</ViewAnnotation>
				)}

				{mapReady && endPin && (
					<ViewAnnotation lngLat={toLngLat(endPin)} anchor='bottom'>
						<PinMarker color='#ef4444' />
					</ViewAnnotation>
				)}
				{mapReady && userLocation && (
					<ViewAnnotation lngLat={toLngLat(userLocation)} anchor='center'>
						<View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#22d3ee', borderWidth: 3, borderColor: '#fff' }} />
					</ViewAnnotation>
				)}
				{mapReady && (partyLocations.length ? partyLocations : partyLocation ? [partyLocation] : []).map(location => (
					<AnimatedPartyMarker key={location.userId || `${location.lat}:${location.lng}`} location={location} />
				))}

				{mapReady && waypoints.map((wp, i) => wp && (
					<ViewAnnotation key={i} lngLat={toLngLat(wp)} anchor='bottom'>
						<PinMarker color='#3b82f6' size={20} />
					</ViewAnnotation>
				))}
				{mapReady && routeCoordinates.length > 0 && (
					<GeoJSONSource id='routeSource' data={routeGeoJSON}>
						<Layer type='line' paint={{ 'line-color': '#0A84FF', 'line-width': 4 }} />
					</GeoJSONSource>
				)}
				{mapReady && traversedRoute.length > 1 && (
					<GeoJSONSource id='traversedRouteSource' data={traversedRouteGeoJSON}>
						<Layer type='line' paint={{ 'line-color': '#22c55e', 'line-width': 5 }} />
					</GeoJSONSource>
				)}
				{mapReady && offRouteTrace.length > 1 && (
					<GeoJSONSource id='offRouteSource' data={offRouteGeoJSON}>
						<Layer type='line' paint={{ 'line-color': '#ef4444', 'line-width': 5 }} />
					</GeoJSONSource>
				)}

				{mapReady && nearbyPlaces.length > 0 && (
					<GeoJSONSource id='nearbyPlacesSource' data={nearbyGeoJSON}>
						<Layer
							id='nearbyPlacesCircleRegular'
							type='circle'
							minzoom={REGULAR_MARKER_MIN_ZOOM}
							filter={REGULAR_FILTER}
							paint={{
								'circle-radius': 3,
								'circle-color': '#f59e0b',
								'circle-stroke-color': '#ffffff',
								'circle-stroke-width': 1.5,
							}}
						/>
						<Layer
							id='nearbyPlacesCircleImportant'
							type='circle'
							minzoom={IMPORTANT_MARKER_MIN_ZOOM}
							filter={IMPORTANT_FILTER}
							paint={{
								'circle-radius': 6,
								'circle-color': '#f59e0b',
								'circle-stroke-color': '#ffffff',
								'circle-stroke-width': 2,
							}}
						/>
						<Layer
							id='nearbyPlacesLabelRegular'
							type='symbol'
							minzoom={REGULAR_LABEL_MIN_ZOOM}
							filter={REGULAR_FILTER}
							layout={{
								'text-field': ['get', 'name'],
								'text-font': LABEL_FONT,
								'text-size': 12,
								'text-offset': [0, 1.2],
								'text-anchor': 'top',
							}}
							paint={{
								'text-color': '#ffffff',
								'text-halo-color': '#000000',
								'text-halo-width': 1.2,
							}}
						/>
						<Layer
							id='nearbyPlacesLabelImportant'
							type='symbol'
							minzoom={IMPORTANT_LABEL_MIN_ZOOM}
							filter={IMPORTANT_FILTER}
							layout={{
								'text-field': ['get', 'name'],
								'text-font': LABEL_FONT,
								'text-size': 13,
								'text-offset': [0, 1.2],
								'text-anchor': 'top',
							}}
							paint={{
								'text-color': '#ffffff',
								'text-halo-color': '#000000',
								'text-halo-width': 1.2,
							}}
						/>
					</GeoJSONSource>
				)}

				{mapReady && pressPulse && (
					<GeoJSONSource id='pressPulseSource' data={pressPulseGeoJSON}>
						<Layer
							id='pressPulseCircle'
							type='circle'
							paint={{
								'circle-radius': [
									'interpolate', ['exponential', 2], ['zoom'],
									0, 0,
									20, metersToPixelsAtMaxZoom(PRESS_PULSE_RADIUS_M, pressPulse.lat),
								],
								'circle-color': '#0A84FF',
								'circle-opacity': 0.15,
								'circle-stroke-color': '#0A84FF',
								'circle-stroke-width': 2,
								'circle-stroke-opacity': 0.5,
							}}
						/>
					</GeoJSONSource>
				)}
			</MapLibreMap>

			{tourId ? (
				<TourTarget tourId={tourId} targetId='mapStyle' asChild>
					<Pressable
						onPress={() => setIsModalVisible(true)}
						className='absolute top-4 left-3 w-11 h-11 rounded-full items-center justify-center'
						style={{ backgroundColor: colors.overlay, ...theme.shadows.floating }}
					>
						<Ionicons name='layers' size={20} color={colors.textPrimary} />
					</Pressable>
				</TourTarget>
			) : (
				<Pressable
					onPress={() => setIsModalVisible(true)}
					className='absolute top-4 left-3 w-11 h-11 rounded-full items-center justify-center'
					style={{ backgroundColor: colors.overlay, ...theme.shadows.floating }}
				>
					<Ionicons name='layers' size={20} color={colors.textPrimary} />
				</Pressable>
			)}

			<TileModal
				isModalVisible={isModalVisible}
				currentStyle={mapStyle}
				onSelect={handleSelectStyle}
				onClose={() => setIsModalVisible(false)}
			/>
		</View>
	);
};

export default TripRouteMap;