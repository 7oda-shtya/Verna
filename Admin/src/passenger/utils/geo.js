// src/utils/geo.js
import locations from '../../json/locations.json';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const OSRM_URL = 'https://router.project-osrm.org';

// حدود محافظة شمال سيناء تقريبًا (بتغطي العريش، الشيخ زويد، رفح، بئر العبد، الحسنة، نخل)
// الصيغة اللي نوميناتيم عايزها: left(minLon),top(maxLat),right(maxLon),bottom(minLat)
const NORTH_SINAI_VIEWBOX = '32.6,31.35,34.3,29.7';

const LOCAL_NAME_FIELDS = ['neighbourhood', 'suburb', 'quarter', 'residential', 'hamlet', 'village', 'road'];

function extractLocalName(address) {
  if (!address) return null;
  for (const field of LOCAL_NAME_FIELDS) {
    if (address[field]) return address[field];
  }
  return null;
}

export function distanceMeters(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// searchLocalPlaces تدور في locations.json بتاعك بالاسم أو الكلمات المفتاحية أو الحي
function searchLocalPlaces(query) {
  const q = query.trim().toLowerCase();
  return locations
    .filter((loc) => {
      const names = Array.isArray(loc.name) ? loc.name : [loc.name];
      const keywords = loc.keywords || [];
      return (
        names.some((n) => n && n.toLowerCase().includes(q)) ||
        keywords.some((k) => k && k.toLowerCase().includes(q)) ||
        (loc.section && loc.section.toLowerCase().includes(q))
      );
    })
    .map((loc) => {
      const name = Array.isArray(loc.name) ? loc.name[0] : loc.name;
      return {
        lat: loc.coords[0],
        lng: loc.coords[1],
        localName: name,
        fullName: loc.section ? `${name} - ${loc.section}` : name,
        source: 'local',
      };
    });
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`${NOMINATIM_URL}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`);
    if (!res.ok) throw new Error('reverse geocode failed');
    const data = await res.json();
    return { localName: extractLocalName(data.address), fullName: data.display_name || null };
  } catch {
    return { localName: null, fullName: null };
  }
}

// searchPlaces بتدور في المحلي الأول، وبعدين في نوميناتيم لكن مقفولة على شمال سيناء بس
export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) return [];

  const localResults = searchLocalPlaces(query);

  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      q: query,
      'accept-language': 'ar',
      limit: '6',
      addressdetails: '1',
      viewbox: NORTH_SINAI_VIEWBOX,
      bounded: '1', // ده اللي بيمنع نتايج من برة شمال سيناء خالص
      countrycodes: 'eg',
    });
    const res = await fetch(`${NOMINATIM_URL}/search?${params.toString()}`);
    if (!res.ok) throw new Error('search failed');
    const data = await res.json();
    const remoteResults = data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      localName: extractLocalName(item.address),
      fullName: item.display_name,
      source: 'online',
    }));

    // نستبعد أي نتيجة أونلاين قريبة جدًا (أقل من 80 متر) من نتيجة محلية موجودة أصلاً
    const filteredRemote = remoteResults.filter((r) => !localResults.some((l) => distanceMeters(l, r) < 80));

    return [...localResults, ...filteredRemote].slice(0, 8);
  } catch (err) {
    console.error('searchPlaces error:', err);
    return localResults; // حتى لو النت فشل، رجّع نتايج المحلي على الأقل
  }
}

export async function fetchRouteOptions(points) {
  if (!points || points.length < 2) return [];
  const coordsParam = points.map((p) => `${p.lng},${p.lat}`).join(';');
  try {
    const res = await fetch(`${OSRM_URL}/route/v1/driving/${coordsParam}?overview=full&geometries=geojson&alternatives=true`);
    if (!res.ok) throw new Error('route failed');
    const data = await res.json();
    const routes = data.routes || [];
    return routes.map((route) => ({
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    }));
  } catch {
    return [];
  }
}

export function estimateFare(distanceKm = 0) {
  const base = 10;
  const perKm = 3.5;
  return Math.max(base, Math.round(base + distanceKm * perKm));
}