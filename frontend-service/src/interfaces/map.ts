export enum CoordinateSystem {
    UTM = 'UTM',
    WGS84 = 'WGS84',
}

export enum Hemisphere {
    N = 'N',
    S = 'S',
}

export type UTM = {
    zone: number; // UTM Zone (1-60)
    hemi: Hemisphere; // Hemisphere (North or South)
    east: number; // Easting (6-digit)
    north: number; // Northing (7-digit)
};

export type Cartesian3 = {
    x: number;
    y: number;
};

export enum MapItemType {
    Polygon = 'polygon',
    Coordinate = 'coordinate',
}

export type CoordinatesResult = {
    type: MapItemType;
    value: Cartesian3 | Cartesian3[];
};
