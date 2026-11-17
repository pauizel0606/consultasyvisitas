// Ubicación: GPS del navegador + geocodificación gratuita con OpenStreetMap (Nominatim).
// Nominatim pide un uso moderado (máx. 1 petición por segundo): solo se llama al pulsar
// "Buscar" o "Usar mi ubicación", nunca mientras se escribe.
const NOMINATIM = 'https://nominatim.openstreetmap.org';

export function myPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Tu navegador no permite obtener la ubicación'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(new Error(e.code === 1 ? 'Has bloqueado el permiso de ubicación. Actívalo en el navegador o escribe tu ciudad.' : 'No hemos podido obtener tu ubicación')),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  });
}

export async function geocode(query) {
  const url = `${NOMINATIM}/search?format=jsonv2&limit=1&addressdetails=1&accept-language=es&q=${encodeURIComponent(query)}`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('El servicio de mapas no responde. Inténtalo en un momento.');
  const [hit] = await r.json();
  if (!hit) return null;
  return { lat: +hit.lat, lng: +hit.lon, label: shortLabel(hit.address) || hit.display_name.split(',').slice(0, 2).join(','), address: hit.address };
}

export async function reverse(lat, lng) {
  const url = `${NOMINATIM}/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=es&lat=${lat}&lon=${lng}`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) return null;
  const j = await r.json();
  const a = j.address || {};
  return {
    street: [a.road || a.pedestrian || a.square, a.house_number].filter(Boolean).join(' '),
    city: a.city || a.town || a.village || a.municipality || '',
    label: shortLabel(a),
  };
}

function shortLabel(a = {}) {
  const place = a.city || a.town || a.village || a.municipality || a.county || '';
  const street = a.road || a.pedestrian || a.square || a.neighbourhood || a.suburb || '';
  return [street, place].filter(Boolean).join(', ');
}

export function distanceKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const fmtKm = (km) => (km < 1 ? `${Math.max(50, Math.round(km * 1000 / 50) * 50)} m` : `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`);
