import { LatLng } from 'leaflet';

export const polygonStyle = (darkMode) => ({
    color: darkMode ? '#ffffff' : '#3388ff', // Border color
    fillColor: darkMode ? '#555555' : '#3388ff', // Fill color
    fillOpacity: 0.4, // Fill opacity
    weight: 2, // Border thickness
});

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
