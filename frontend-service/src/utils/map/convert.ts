import * as Cesium from 'cesium';
import { Cartesian3 } from 'cesium';
import proj4 from 'proj4';
import { CoordinateSystem } from '../../common/inputs/JSONSchemaFormik/Widgets/RjsfLocationWidget';
import { environment } from '../../globals';
import { stringToCoordinates } from '.';

const {
    polygon: { polygonPrefix, polygonSuffix },
    epsgCode: { wgs84, epsg, southHemiUTM, northHemiUTM },
    wgs84: { maxLongitude, maxLatitude },
} = environment.map;

enum Hemisphere {
    N = 'N',
    S = 'S',
}

export type UTM = {
    zone: number; // UTM Zone (1-60)
    hemi: Hemisphere; // Hemisphere (North or South)
    east: number; // Easting (6-digit)
    north: number; // Northing (7-digit)
};

const utm = (zone: UTM['zone'], hemi: Hemisphere) => `${epsg}:${hemi === Hemisphere.N ? northHemiUTM : southHemiUTM}${zone}`;

const validateUTM = ({ zone, hemi, east, north }: UTM): boolean => {
    const { minZone, maxZone, minEasting, maxEasting, minNorthing, maxNorthing } = environment.map.utm;

    if (zone < minZone || zone > maxZone) return false;
    if (!Object.values(Hemisphere).includes(hemi as Hemisphere)) return false;
    if (east < minEasting || east > maxEasting) return false;
    if (north < minNorthing || north > maxNorthing) return false;
    return true;
};

export const isValidUTM = (location: UTM | UTM[]): boolean => {
    if (!location) return false;
    return !Array.isArray(location) ? validateUTM(location) : location.every((point) => validateUTM(point));
};

export const isValidWGS84 = (location: Cartesian3 | Cartesian3[]) => {
    return !Array.isArray(location)
        ? Math.abs(location.x) < maxLongitude && Math.abs(location.y) < maxLatitude
        : location.every((point) => Math.abs(point.x) < maxLongitude && Math.abs(point.y) < maxLatitude);
};

export const convertWGS94ToECEF = (location: Cartesian3 | Cartesian3[]) => {
    const convertPoint = (point: Cartesian3) => Cartesian3.fromDegrees(point.x, point.y);
    return !Array.isArray(location) ? convertPoint(location) : location.map((point) => convertPoint(point));
};

export const convertECEFToWGS84 = (point: Cartesian3): { longitude: number; latitude: number } => {
    const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(point);

    if (!cartographic) throw new Error('Invalid Point');

    return { longitude: Cesium.Math.toDegrees(cartographic.longitude), latitude: Cesium.Math.toDegrees(cartographic.latitude) };
};

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
        : utmLocation.map((point) => ({ x: convertToWGS84(point)[0], y: convertToWGS84(point)[1] }) as Cartesian3);
};

const extractUtmPoint = (utmMatchRegex: RegExpMatchArray | null): UTM | undefined => {
    if (!utmMatchRegex) {
        console.error('Invalid UTM coordinate format');
        return undefined;
    }

    const zone = parseInt(utmMatchRegex[1], 10);
    const hemi = utmMatchRegex[2] >= Hemisphere.N ? Hemisphere.N : Hemisphere.S;
    const east = parseInt(utmMatchRegex[3], 10);
    const north = parseInt(utmMatchRegex[4], 10);

    return { zone, hemi, east, north };
};

export const extractUtmLocation = (utmString: string): UTM | UTM[] | undefined => {
    const { utmRegex, utmPolygonRegex } = environment.map.utm;

    if (utmString.startsWith(polygonPrefix)) {
        const polygonString = utmString.slice(9, -2);
        const matches = [...polygonString.matchAll(utmPolygonRegex)];
        if (matches.length === 0) {
            console.error('Invalid UTM coordinates in POLYGON');
            return undefined;
        }

        const utmDataArray = matches.map((match) => extractUtmPoint(match));
        if (utmDataArray.some((utmData) => utmData === undefined)) return undefined;

        return utmDataArray.filter(Boolean) as UTM[];
    }
    const match = utmString.match(utmRegex);
    return extractUtmPoint(match);
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
        if (!utmLocation) return location;
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
