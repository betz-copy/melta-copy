/* eslint-disable no-param-reassign */
import { Cartesian3 } from 'cesium';
import * as Cesium from 'cesium';
import * as utm from 'utm';
import { environment } from '../globals';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IEntity } from '../interfaces/entities';

const {
    polygon: { polygonPrefix, polygonSuffix },
} = environment.map;

export type LatLng = {
    latitude: number;
    longitude: number;
};

type CoordinatesResult = {
    type: 'polygon' | 'marker';
    value: Cartesian3 | Cartesian3[];
};

export const zoomNumber = 300000;

export const jerusalemCoordinates: Cartesian3 = Cartesian3.fromDegrees(35.2137, 31.7683, zoomNumber);

export const parsePolygon = (polygonStr: string): Cartesian3[] | undefined => {
    console.log({ polygonStr });

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

            if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
                console.error(`Invalid coordinate pair: ${pair}`);
                return null;
            }

            return Cartesian3.fromDegrees(longitude, latitude);
        })
        .filter((coord): coord is Cartesian3 => coord !== null);

    return coordinates.length > 0 ? coordinates : undefined;
};

export const convertWGS94ToUTM = (location: Cartesian3 | Cartesian3[]) => {
    return !Array.isArray(location)
        ? Cartesian3.fromDegrees(location.x, location.y)
        : location.map((point) => Cartesian3.fromDegrees(point.x, point.y));
};

export const location3ToString = (location: Cartesian3 | Cartesian3[], unit: 'UTM' | 'WGS84' = 'WGS84'): string => {
    console.log({ location, unit });

    let longitude;
    let latitude;

    if (!Array.isArray(location)) {
        if (unit === 'WGS84') {
            const cartographic = Cesium.Cartographic.fromCartesian(location);
            longitude = Cesium.Math.toDegrees(cartographic.longitude);
            latitude = Cesium.Math.toDegrees(cartographic.latitude);
            return `${longitude}, ${latitude}`;
        }

        const utmConverted = utm.fromLatLon(latitude, longitude);
        console.log({ utmConverted });

        return `${utmConverted.easting}, ${utmConverted.northing}`;
    }

    const points = location.map((point) => {
        if (unit === 'WGS84') {
            const cartographic = Cesium.Cartographic.fromCartesian(point);
            longitude = Cesium.Math.toDegrees(cartographic.longitude);
            latitude = Cesium.Math.toDegrees(cartographic.latitude);
            return `${longitude} ${latitude}`;
        }

        const utmConverted = utm.fromLatLon(latitude, longitude);
        return `${utmConverted.easting} ${utmConverted.northing}`;
    });

    return `${polygonPrefix}${points.join(',')}${polygonSuffix}`;
};

export const stringToCoordinates = (strCoords: string): CoordinatesResult => {
    console.log({ strCoords });

    const polygon = parsePolygon(strCoords);
    if (polygon) return { type: 'polygon', value: polygon };

    const formatted = strCoords.split(',').map((val) => +val);
    return { type: 'marker', value: { x: formatted[0], y: formatted[1] } as Cartesian3 };

    // TODO: add validation to format
};

export const isValidWGS84 = (location: Cartesian3 | Cartesian3[]) =>
    !Array.isArray(location)
        ? Math.abs(location.x) < 180 && Math.abs(location.y) < 90
        : location.every((point) => Math.abs(point.x) < 180 && Math.abs(point.y) < 90);

const validateUTM = (zone: number, hemisphere: string, easting: number, northing: number): boolean => {
    if (zone < 1 || zone > 60) return false;
    if (!['N', 'S'].includes(hemisphere)) return false;
    if (easting < 160000 || easting > 834000) return false;
    if (northing < 0 || northing > 10000000) return false;
    return true;
};

const isValidUTMCoordinate = (point: Cartesian3) => {
    console.log('is valid UTM Coordinate', { point });

    const cartographic = Cesium.Cartographic.fromCartesian(point);
    if (!cartographic) return false;

    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);

    if (latitude < -80 || latitude > 84) return false;
    if (longitude < -180 || longitude > 180) return false;

    const zone = Math.floor((longitude + 180) / 6) + 1;
    const hemisphere = latitude >= 0 ? 'N' : 'S';

    const easting = 500000;
    const northing = latitude >= 0 ? 0 : 10000000;

    return validateUTM(zone, hemisphere, easting, northing);
};

export const isValidUTM = (location: Cartesian3 | Cartesian3[]): boolean => {
    if (!location) return false;
    return !Array.isArray(location) ? isValidUTMCoordinate(location) : location.every((point) => isValidUTMCoordinate(point));
};

export const calculateCenterOfPolygon = (coordinates: Cartesian3[]): Cartesian3 => {
    if (coordinates.length === 0) return jerusalemCoordinates;

    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    coordinates.forEach((coordinate) => {
        const newCoordinate = isValidWGS84(coordinate) ? (convertWGS94ToUTM(coordinate) as Cartesian3) : coordinate;
        sumX += newCoordinate.x;
        sumY += newCoordinate.y;
        sumZ += newCoordinate.z;
    });

    const { length } = coordinates;
    return new Cartesian3(sumX / length, sumY / length, sumZ / length);
};

export const getPolygonFarthestPoint = (polygonCenter: Cartesian3, polygon: Cartesian3[]) => {
    let longestDistance = 0;

    polygon.forEach((point) => {
        const distance = Cartesian3.distance(polygonCenter, point);
        if (distance > longestDistance) longestDistance = distance;
    });

    return longestDistance;
};

export const isValidPolygonPoint = (polygonPoints: Cartesian3[], newPoint: Cartesian3) => {
    if (polygonPoints.length < 2) return true;

    const points = [...polygonPoints, newPoint];
    const numPoints = points.length;
    let isClockwise = false;

    for (let i = 0; i < numPoints; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % numPoints];
        const p3 = points[(i + 2) % numPoints];

        const crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);

        if (i === 0) {
            isClockwise = crossProduct > 0;
        } else if (crossProduct > 0 !== isClockwise) {
            return false;
        }
    }

    return true;
};

export const getLocationProperties = (entity: IEntity, selectedTemplates: IMongoEntityTemplatePopulated[]) => {
    const template = selectedTemplates.find(({ _id }) => _id === entity.templateId);

    if (!template) return { template: undefined, locationTemplateProperties: undefined, locationProperties: undefined };

    const locationTemplateProperties = Object.entries(template.properties.properties)
        .filter(([_key, value]) => value.format === 'location')
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {} as { [x: string]: IEntitySingleProperty });

    const locationProperties = Object.entries(entity.properties)
        .filter(([key, _value]) => key in locationTemplateProperties)
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {} as { [x: string]: any });

    return { template, locationTemplateProperties, locationProperties };
};
