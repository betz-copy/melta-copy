import proj4 from 'proj4';
import { BadRequestError } from '../express/error';
import config from '../config';

const locationFormatError = 'location format not valid';

const {
    polygon: { polygonPrefix, polygonSuffix },
    epsgCode: { wgs84, epsg, southHemiUTM, northHemiUTM },
    utm: { utmPolygonRegex, utmRegex },
} = config.map;

export enum CoordinateSystem {
    UTM = 'UTM',
    WGS84 = 'WGS84',
}

enum Hemisphere {
    N = 'N',
    S = 'S',
}

enum SplitBy {
    space = ' ',
    comma = ',',
}

type UTM = {
    zone: number; // UTM Zone (1-60)
    hemi: Hemisphere; // Hemisphere (North or South)
    east: number; // Easting (6-digit)
    north: number; // Northing (7-digit)
};

type Cartesian3 = {
    x: number;
    y: number;
};

type CoordinatesResult = {
    type: 'polygon' | 'marker';
    value: Cartesian3 | Cartesian3[];
};

const utm = (zone: UTM['zone'], hemi: UTM['hemi']) => `${epsg}:${hemi === 'N' ? northHemiUTM : southHemiUTM}${zone}`;

const getZoneAndHemi = (longitude: number, latitude: number): { epsgCode: string; zone: number; hemi: Hemisphere } => {
    let zoneNumber: number;

    if (latitude >= 56 && latitude < 64 && longitude >= 3 && longitude < 12) zoneNumber = 32;
    else if (latitude >= 72 && latitude < 84) {
        if (longitude >= 0 && longitude < 9) zoneNumber = 31;
        else if (longitude < 21) zoneNumber = 33;
        else if (longitude < 33) zoneNumber = 35;
        else if (longitude < 42) zoneNumber = 37;
        else zoneNumber = Math.floor((longitude + 180) / 6) + 1;
    } else zoneNumber = Math.floor((longitude + 180) / 6) + 1;

    const epsgCode =
        latitude >= 0
            ? `${epsg}:${northHemiUTM}${zoneNumber.toString().padStart(2, '0')}`
            : `${epsg}:${southHemiUTM}${zoneNumber.toString().padStart(2, '0')}`;

    return { epsgCode, zone: zoneNumber, hemi: latitude >= 0 ? Hemisphere.N : Hemisphere.S };
};

const convertWGS84ToUTM = (wgs84Location: Cartesian3 | Cartesian3[]): UTM | UTM[] => {
    const convertToUTM = (point: Cartesian3): UTM => {
        const { zone, hemi, epsgCode } = getZoneAndHemi(point.x, point.y);
        const [east, north] = proj4(wgs84, epsgCode, [point.x, point.y]);

        return {
            zone,
            hemi,
            east,
            north,
        };
    };

    return !Array.isArray(wgs84Location) ? convertToUTM(wgs84Location) : wgs84Location.map((point) => convertToUTM(point));
};

const convertUTMToWGS84 = (utmLocation: UTM | UTM[]): Cartesian3 | Cartesian3[] => {
    const convertToWGS84 = (point: UTM) => proj4(utm(point.zone, point.hemi), wgs84, [point.east, point.north]);
    return !Array.isArray(utmLocation)
        ? ({ x: convertToWGS84(utmLocation)[0], y: convertToWGS84(utmLocation)[1] } as Cartesian3)
        : utmLocation.map((point) => ({ x: convertToWGS84(point)[0], y: convertToWGS84(point)[1] }) as Cartesian3);
};

const extractUtmPoint = (utmMatchRegex: RegExpMatchArray | null): UTM => {
    if (!utmMatchRegex) throw new BadRequestError(locationFormatError);

    const zone = parseInt(utmMatchRegex[1], 10);
    const hemi = utmMatchRegex[2] >= Hemisphere.N ? Hemisphere.N : Hemisphere.S;
    const east = parseInt(utmMatchRegex[3], 10);
    const north = parseInt(utmMatchRegex[4], 10);

    return { zone, hemi, east, north };
};

const extractUtmLocation = (utmString: string): UTM | UTM[] => {
    if (utmString.startsWith(polygonPrefix)) {
        const polygonString = utmString.slice(9, -2);
        const matches = [...polygonString.matchAll(utmPolygonRegex)];
        if (matches.length === 0) throw new BadRequestError(locationFormatError);

        return matches.map((match) => extractUtmPoint(match));
    }
    return extractUtmPoint(utmString.match(utmRegex));
};

const parsePolygon = (polygonStr: string): Cartesian3[] | undefined => {
    if (!polygonStr.startsWith(polygonPrefix) || !polygonStr.endsWith(polygonSuffix)) {
        return undefined;
    }

    const coordsStr = polygonStr.slice(polygonPrefix.length, -polygonSuffix.length).trim();
    const coordPairs = coordsStr.split(',').map((pair) => pair.trim());

    const coordinates: Cartesian3[] = coordPairs
        .map((pair) => {
            const [longitudeStr, latitudeStr] = pair.split(/\s+/);
            const longitude = parseFloat(longitudeStr);
            const latitude = parseFloat(latitudeStr);

            if (Number.isNaN(longitude) || Number.isNaN(latitude)) throw new BadRequestError(locationFormatError);

            return { x: longitude, y: latitude };
        })
        .filter((coord): coord is Cartesian3 => coord !== null);

    return coordinates.length > 0 ? coordinates : undefined;
};

export const stringToCoordinates = (strCoords: string): CoordinatesResult => {
    const polygon = parsePolygon(strCoords);
    if (polygon) return { type: 'polygon', value: polygon };

    const formatted = strCoords.includes(',') ? strCoords.split(',').map(Number) : strCoords.split(' ').map(Number);
    return { type: 'marker', value: { x: formatted[0], y: formatted[1] } as Cartesian3 };

    // TODO: add validation to format
};

export const locationConverterToString = (
    location?: string,
    unitToConvertFrom: CoordinateSystem.WGS84 | CoordinateSystem.UTM = CoordinateSystem.UTM,
    unitToConvertTo: CoordinateSystem.WGS84 | CoordinateSystem.UTM = CoordinateSystem.WGS84,
) => {
    if (!location) return undefined;
    if (unitToConvertFrom === unitToConvertTo) return location;

    if (unitToConvertTo === CoordinateSystem.WGS84) {
        const utmLocation = extractUtmLocation(location);
        const wgs84Location = convertUTMToWGS84(utmLocation);

        if (!Array.isArray(wgs84Location)) return `${wgs84Location.x}, ${wgs84Location.y}`;

        const points = wgs84Location.map((point) => {
            return `${point.x} ${point.y}`;
        });
        return `${polygonPrefix}${points.join(SplitBy.comma)}${polygonSuffix}`;
    }
    const wgs84Location = stringToCoordinates(location);

    const utmLocation = convertWGS84ToUTM(wgs84Location.value);

    if (!Array.isArray(utmLocation)) return `${utmLocation.zone}${utmLocation.hemi} ${utmLocation.east} ${utmLocation.north}`;

    const points = utmLocation.map((point) => {
        return `${point.zone}${point.hemi} ${point.east} ${point.north}`;
    });
    return `${polygonPrefix}${points.join(SplitBy.comma)}${polygonSuffix}`;
};
