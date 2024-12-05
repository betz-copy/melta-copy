const gazaBounds = [
    [31.596668, 34.480591],
    [31.532311, 34.580841],
    [31.219261, 34.269104],
    [31.322554, 34.223785],
];

// POLYGON((31.596668 34.480591,31.532311 34.580841,31.219261 34.269104,31.322554 34.223785))

export const generateRandomLocation = () => {
    // Generate random latitude and longitude within gazaBounds
    const lat = (Math.random() * (gazaBounds[1][0] - gazaBounds[2][0]) + gazaBounds[2][0]).toFixed(5);
    const lng = (Math.random() * (gazaBounds[1][1] - gazaBounds[0][1]) + gazaBounds[0][1]).toFixed(5);

    return `${lat}, ${lng}`;
};

export const generateRandomPolygon = () => {
    // Generate a random number of points (between 3 and 7)
    const numPoints = Math.floor(Math.random() * (7 - 3 + 1)) + 3;

    // Pick a random center point within the given bounds (assuming gazaBounds is defined)
    const minLat = gazaBounds[2][0];
    const maxLat = gazaBounds[1][0];
    const minLng = gazaBounds[0][1];
    const maxLng = gazaBounds[1][1];

    const centerLat = Math.random() * (maxLat - minLat) + minLat;
    const centerLng = Math.random() * (maxLng - minLng) + minLng;

    // Define a base radius for the polygon size (in degrees).
    // This will determine how large the polygon is around its center.
    const baseRadius = 0.02; // ~±0.02° ~ a few km radius

    const pointsData: { angle: number; latOffset: number; lngOffset: number }[] = [];

    for (let i = 0; i < numPoints; i++) {
        // Random angle in radians
        const angle = Math.random() * 2 * Math.PI;
        // Random distance scale between 0.5 * baseRadius and baseRadius
        const dist = baseRadius * (0.5 + Math.random() * 0.5);

        // Convert polar coordinates to lat/lng offsets.
        // For simplicity, we're treating lat/lng degrees as a flat plane:
        const latOffset = dist * Math.sin(angle);
        const lngOffset = dist * Math.cos(angle);

        pointsData.push({ angle, latOffset, lngOffset });
    }

    // Sort points by angle to ensure the polygon doesn't intersect itself
    pointsData.sort((a, b) => a.angle - b.angle);

    // Map to string coordinates in "lat lng" format
    const points = pointsData.map(({ latOffset, lngOffset }) => {
        const lat = (centerLat + latOffset).toFixed(5);
        const lng = (centerLng + lngOffset).toFixed(5);
        return `${lat} ${lng}`;
    });

    // Close the polygon by repeating the first point at the end
    points.push(points[0]);

    return `POLYGON((${points.join(',')}))`;
};
