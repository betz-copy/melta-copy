import * as Cesium from 'cesium';
import proj4 from 'proj4';
import { Cartesian3 } from 'cesium';
import { stringToCoordinates } from '.';
import { environment } from '../../globals';

const {
    polygon: { polygonPrefix, polygonSuffix },
    epsgCode: { wgs84, epsg, southHemiUTM, northHemiUTM },
} = environment.map;

export type UTM = {
    zone: number; // UTM Zone (1-60)
    hemi: 'N' | 'S'; // Hemisphere (North or South)
    east: number; // Easting (6-digit)
    north: number; // Northing (7-digit)
};

const utm = (zone: UTM['zone'], hemi: UTM['hemi']) => `${epsg}:${hemi === 'N' ? northHemiUTM : southHemiUTM}${zone}`;

const validateUTM = ({ zone, hemi, east, north }: UTM): boolean => {
    if (zone < 1 || zone > 60) return false;
    if (!['N', 'S'].includes(hemi)) return false;
    if (east < 160000 || east > 834000) return false;
    if (north < 0 || north > 10000000) return false;
    return true;
};

export const isValidUTM = (location: UTM | UTM[]): boolean => {
    if (!location) return false;
    return !Array.isArray(location) ? validateUTM(location) : location.every((point) => validateUTM(point));
};

export const isValidWGS84 = (location: Cartesian3 | Cartesian3[]) =>
    !Array.isArray(location)
        ? Math.abs(location.x) < 180 && Math.abs(location.y) < 90
        : location.every((point) => Math.abs(point.x) < 180 && Math.abs(point.y) < 90);

export const convertWGS94ToECEF = (location: Cartesian3 | Cartesian3[]) =>
    !Array.isArray(location) ? Cartesian3.fromDegrees(location.x, location.y) : location.map((point) => Cartesian3.fromDegrees(point.x, point.y));

export const convertECEFToWGS84 = (point: Cartesian3): { longitude: number; latitude: number } => {
    const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(point);

    if (!cartographic) console.error('Invalid Point');

    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);

    return { longitude, latitude };
};

const getZoneAndHemi = (longitude: number, latitude: number): { epsgCode: string; zone: number; hemi: 'N' | 'S' } => {
    let zoneNumber: number;

    if (latitude >= 56 && latitude < 64 && longitude >= 3 && longitude < 12) zoneNumber = 32;
    else if (latitude >= 72 && latitude < 84) {
        if (longitude >= 0 && longitude < 9) zoneNumber = 31;
        else if (longitude >= 9 && longitude < 21) zoneNumber = 33;
        else if (longitude >= 21 && longitude < 33) zoneNumber = 35;
        else if (longitude >= 33 && longitude < 42) zoneNumber = 37;
        else zoneNumber = Math.floor((longitude + 180) / 6) + 1;
    } else zoneNumber = Math.floor((longitude + 180) / 6) + 1;

    const epsgCode =
        latitude >= 0
            ? `${epsg}:${northHemiUTM}${zoneNumber.toString().padStart(2, '0')}`
            : `${epsg}:${southHemiUTM}${zoneNumber.toString().padStart(2, '0')}`;

    return { epsgCode, zone: zoneNumber, hemi: latitude >= 0 ? 'N' : 'S' };
};

export const convertWGS84ToUTM = (wgs84Location: Cartesian3 | Cartesian3[]): UTM | UTM[] => {
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

export const convertUTMToWGS84 = (utmLocation: UTM | UTM[]): Cartesian3 | Cartesian3[] => {
    const convertToWGS84 = (point: UTM) => proj4(utm(point.zone, point.hemi), wgs84, [point.east, point.north]);
    return !Array.isArray(utmLocation)
        ? ({ x: convertToWGS84(utmLocation)[0], y: convertToWGS84(utmLocation)[1] } as Cartesian3)
        : utmLocation.map((point) => ({ x: convertToWGS84(point)[0], y: convertToWGS84(point)[1] } as Cartesian3));
};

const extractUtmPoint = (utmMatchRegex: RegExpMatchArray | null): UTM => {
    if (!utmMatchRegex) throw new Error('Invalid UTM coordinate format');

    const zone = parseInt(utmMatchRegex[1], 10);
    const hemi = utmMatchRegex[2] >= 'N' ? 'N' : 'S';
    const east = parseInt(utmMatchRegex[3], 10);
    const north = parseInt(utmMatchRegex[4], 10);

    return { zone, hemi, east, north };
};

export const extractUtmLocation = (utmString: string): UTM | UTM[] => {
    const utmRegex = /\b([1-9]|[1-5][0-9]|60)([C-HJ-NP-X])\s([0-9]+(?:\.[0-9]+)?)\s([0-9]+(?:\.[0-9]+)?)\b/;
    const utmPolygonRegex = /\b([1-9]|[1-5][0-9]|60)([C-HJ-NP-X])\s([0-9]+(?:\.[0-9]+)?)\s([0-9]+(?:\.[0-9]+)?)\b/g;

    if (utmString.startsWith(polygonPrefix)) {
        const polygonString = utmString.slice(9, -2);
        const matches = [...polygonString.matchAll(utmPolygonRegex)];
        if (matches.length === 0) throw new Error('Invalid UTM coordinates in POLYGON');

        const utmDataArray = matches.map((match) => extractUtmPoint(match));
        return utmDataArray;
    }
    const match = utmString.match(utmRegex);
    return extractUtmPoint(match);
};

export const locationConverterToString = (
    location?: string,
    unitToConvertFrom: 'WGS84' | 'UTM' = 'UTM',
    unitToConvertTo: 'WGS84' | 'UTM' = 'WGS84',
) => {
    if (!location) return undefined;
    if (unitToConvertFrom === unitToConvertTo) return location;

    if (unitToConvertTo === 'WGS84') {
        const utmLocation = extractUtmLocation(location);
        const wgs84Location = convertUTMToWGS84(utmLocation);

        if (!Array.isArray(wgs84Location)) return `${wgs84Location.x}, ${wgs84Location.y}`;

        const points = wgs84Location.map((point) => {
            return `${point.x} ${point.y}`;
        });
        return `${polygonPrefix}${points.join(',')}${polygonSuffix}`;
    }
    const wgs84Location = stringToCoordinates(location, false);

    const utmLocation = convertWGS84ToUTM(wgs84Location.value);

    if (!Array.isArray(utmLocation)) return `${utmLocation.zone}${utmLocation.hemi} ${utmLocation.east} ${utmLocation.north}`;

    const points = utmLocation.map((point) => {
        return `${point.zone}${point.hemi} ${point.east} ${point.north}`;
    });
    return `${polygonPrefix}${points.join(',')}${polygonSuffix}`;
};
