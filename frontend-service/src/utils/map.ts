import { GeometryUtil, LatLng, LatLngExpression } from 'leaflet';

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

export const stringToCoordinates = (strCoords: string) => {
    const formatted = strCoords.split(',').map((val) => +val);
    return formatted as LatLngExpression;
    // TODO: add validation to format
};
