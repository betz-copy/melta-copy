const closePolygon = (coords: [number, number][]): [number, number][] => {
    if (coords.length === 0) return coords;
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) return [...coords, first];

    return coords;
};

export default closePolygon;
