import { CoordinateSystem } from '@packages/utils';

const gazaBounds = [
    [31.596668, 34.480591],
    [31.532311, 34.580841],
    [31.219261, 34.269104],
    [31.322554, 34.223785],
];

export const generateRandomLocation = () => {
    const lat = (Math.random() * (gazaBounds[1][0] - gazaBounds[2][0]) + gazaBounds[2][0]).toFixed(5);
    const lng = (Math.random() * (gazaBounds[1][1] - gazaBounds[0][1]) + gazaBounds[0][1]).toFixed(5);

    return JSON.stringify({ location: `${lat}, ${lng}`, coordinateSystem: CoordinateSystem.WGS84 });
};

export const generateRandomPolygon = () => {
    const numPoints = Math.floor(Math.random() * (7 - 3 + 1)) + 3;

    const minLat = gazaBounds[2][0];
    const maxLat = gazaBounds[1][0];
    const minLng = gazaBounds[0][1];
    const maxLng = gazaBounds[1][1];

    const centerLat = Math.random() * (maxLat - minLat) + minLat;
    const centerLng = Math.random() * (maxLng - minLng) + minLng;

    const baseRadius = 0.02;

    const pointsData: { angle: number; latOffset: number; lngOffset: number }[] = [];

    for (let i = 0; i < numPoints; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const dist = baseRadius * (0.5 + Math.random() * 0.5);

        const latOffset = dist * Math.sin(angle);
        const lngOffset = dist * Math.cos(angle);

        pointsData.push({ angle, latOffset, lngOffset });
    }

    pointsData.sort((a, b) => a.angle - b.angle);

    const points = pointsData.map(({ latOffset, lngOffset }) => {
        const lat = (centerLat + latOffset).toFixed(5);
        const lng = (centerLng + lngOffset).toFixed(5);
        return `${lat} ${lng}`;
    });

    points.push(points[0]);

    return JSON.stringify({ location: `POLYGON((${points.join(',')}))`, coordinateSystem: CoordinateSystem.WGS84 });
};
