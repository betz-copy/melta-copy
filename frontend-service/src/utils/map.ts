import { GeometryUtil, LatLng, LatLngExpression } from 'leaflet';

export const jerusalemCoordinates: LatLngExpression = [31.7683, 35.2137];

export const parsePolygon = (polygonStr: string): LatLng[] | undefined => {
    const prefix = 'POLYGON((';
    const suffix = '))';

    if (!polygonStr.startsWith(prefix) || !polygonStr.endsWith(suffix)) {
        return undefined;
    }

    const coordsStr = polygonStr.slice(prefix.length, -suffix.length);
    const coordPairs = coordsStr.split(',');

    const coordinates: LatLng[] = coordPairs.map((pair) => {
        const [latStr, lonStr] = pair.trim().split(/\s+/);

        const lat = +latStr;
        const lon = +lonStr;

        return [lat, lon] as unknown as LatLng;
    });

    return coordinates.length > 0 ? coordinates : undefined;
};

export const calculateDistance = (latlngs: LatLng[]) => {
    let totalDistance = 0;
    for (let i = 1; i < latlngs.length; i++) {
        totalDistance += latlngs[i - 1].distanceTo(latlngs[i]);
    }
    return totalDistance;
};

export const calculatePolygonArea = (latlngs: LatLng[]) => GeometryUtil.geodesicArea(latlngs);

type CoordinatesResult = {
    type: 'polygon' | 'marker';
    value: LatLngExpression | LatLng[];
};

export const stringToCoordinates = (strCoords: string): CoordinatesResult => {
    const polygon = parsePolygon(strCoords);
    if (polygon) return { type: 'polygon', value: polygon };

    const formatted = strCoords.split(',').map((val) => +val);
    return { type: 'marker', value: formatted as LatLngExpression };

    // TODO: add validation to format
};

export const latLngToString = (latLng: LatLng | LatLng[], includePolygon = true) => {
    // Handle single LatLng point
    if (!Array.isArray(latLng)) {
        return latLng
            .toString()
            .replace(/^LatLng\(|\)$/g, '')
            .trim();
    }

    const matchedPoints = latLng.toString().match(/LatLng\(([^)]+)\)/g); // Match each "LatLng(number, number)"

    if (!matchedPoints) {
        return includePolygon ? 'POLYGON(())' : '';
    }

    const points = matchedPoints.map((point) =>
        point
            .replace(/LatLng|\(|\)/g, '')
            .replace(',', ' ')
            .trim(),
    );

    // Return the POLYGON format
    return includePolygon ? `POLYGON((${points.join(', ')}))` : points.join(', ');
};

// ugly af find better solution
export const bindPopupForMarker = (coordinates: LatLng) => {
    const { lat, lng } = coordinates;
    if (lat && lng) {
        return `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    return `Coordinates: ${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}`;
};

export const bindPopupForLine = (coordinates: LatLng[]) => {
    const distanceMeters = calculateDistance(coordinates);
    const distanceKm = distanceMeters / 1000;
    return `Distance: ${distanceKm.toFixed(2)} km`;
};

export const bindPopupForPolygon = (coordinates: LatLng[]) => {
    const areaMeters = calculatePolygonArea(coordinates);
    const areaKm2 = areaMeters / 1_000_000;
    return `Area: ${areaKm2.toFixed(2)} km²`;
};

export const bindPopupForCircle = (radius: number) => {
    const areaMeters = Math.PI * radius * radius;
    const areaKm2 = areaMeters / 1_000_000;
    return `Area: ${areaKm2.toFixed(2)} km²`;
};
