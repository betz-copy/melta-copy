export const mapConfig = {
    srid: 4326,
    polygon: {
        polygonPrefix: 'POLYGON((',
        polygonSuffix: '))',
    },
    epsgCode: {
        epsg: 'EPSG',
        wgs84: 'EPSG:4326',
        southHemiUTM: '327',
        northHemiUTM: '326',
    },
    utm: {
        utmRegex: /\b([1-9]|[1-5][0-9]|60)([C-HJ-NP-X])\s([0-9]+(?:\.[0-9]+)?)\s([0-9]+(?:\.[0-9]+)?)\b/,
        utmPolygonRegex: /\b([1-9]|[1-5][0-9]|60)([C-HJ-NP-X])\s([0-9]+(?:\.[0-9]+)?)\s([0-9]+(?:\.[0-9]+)?)\b/g,
        minZone: 1,
        maxZone: 60,
        minEasting: 160000,
        maxEasting: 834000,
        minNorthing: 0,
        maxNorthing: 10000000,
    },
    wgs84: {
        maxLongitude: 180,
        maxLatitude: 90,
        minLongitude: -180,
        minLatitude: -90,
    },
} as const;
