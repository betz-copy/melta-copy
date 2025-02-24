import { Cartesian3 } from 'cesium';
import * as Cesium from "cesium";
import { environment } from '../globals';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IEntity } from '../interfaces/entities';

const {
    polygon: { polygonPrefix, polygonSuffix },
    earthRadius, eccentricitySquared, scaleFactor, centralMeridian
} = environment.map;

export const zoomNumber = 300000;

export const jerusalemCoordinates: Cartesian3 = Cartesian3.fromDegrees(35.2137, 31.7683, zoomNumber);

export const parsePolygon = (polygonStr: string): Cartesian3[] | undefined => {
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
            
            return Cartesian3.fromDegrees(longitude,latitude);
        })
        .filter((coord): coord is Cartesian3 => coord !== null);

    return coordinates.length > 0 ? coordinates : undefined;
};

type CoordinatesResult = {
    type: 'polygon' | 'marker';
    value: Cartesian3 | Cartesian3[];
};

export const stringToCoordinates = (strCoords: string): CoordinatesResult => {
    const polygon = parsePolygon(strCoords);
    if (polygon) return { type: 'polygon', value: polygon };

    const formatted = strCoords.split(',').map((val) => +val);
    return { type: 'marker', value: { x: formatted[0], y: formatted[1] } as Cartesian3 };

    // TODO: add validation to format
};

export const isValidWGS84 = (coordinate: Cartesian3) => Math.abs(coordinate.x) < 180 && Math.abs(coordinate.y) < 90;

const validateUTM = (zone: number, hemisphere: string, easting: number, northing: number): boolean  => {
    if (zone < 1 || zone > 60) return false;
    if (!["N", "S"].includes(hemisphere)) return false;
    if (easting < 160000 || easting > 834000) return false;
    if (northing < 0 || northing > 10000000) return false;
    return true;
}

export const isValidUTM =(position: Cartesian3): boolean => {
    if (!position) return false;

    const cartographic = Cesium.Cartographic.fromCartesian(position);
    if (!cartographic) return false;

    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);

    if (latitude < -80 || latitude > 84) return false;
    if (longitude < -180 || longitude > 180) return false;

    const zone = Math.floor((longitude + 180) / 6) + 1;
    const hemisphere = latitude >= 0 ? "N" : "S";

    const easting = 500000; 
    const northing = latitude >= 0 ? 0 : 10000000;
    
    return validateUTM(zone, hemisphere, easting, northing);
}

export const calculateCenterOfPolygon = (coordinates: Cartesian3[]): Cartesian3 => {
    if (coordinates.length === 0) return jerusalemCoordinates;

    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    coordinates.forEach((coordinate) => {
        const newCoordinate = isValidWGS84(coordinate) ? Cartesian3.fromDegrees(coordinate.x, coordinate.y, zoomNumber) : coordinate;
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

// Computes the foot point latitude for the inverse projection
const utmFootPointLatitude = (meridionalArc: number): number => {
  const mu =
    meridionalArc /
    (earthRadius *
      (1 -
        eccentricitySquared / 4 -
        (3 * eccentricitySquared ** 2) / 64 -
        (5 * eccentricitySquared ** 3) / 256));

  const e1 =
    (1 - Math.sqrt(1 - eccentricitySquared)) /
    (1 + Math.sqrt(1 - eccentricitySquared));

  return (
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu)
  );
}

// Computes projection parameters for the conversion
const computeProjectionParameters = (xAdj: number, phi1: number) => {
  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  
  const N1 = earthRadius / Math.sqrt(1 - eccentricitySquared * sinPhi1 ** 2);
  const T1 = Math.tan(phi1) ** 2;
  const C1 = (eccentricitySquared / (1 - eccentricitySquared)) * cosPhi1 ** 2;
  const D = xAdj / (N1 * scaleFactor);
  const R1 =
    (earthRadius * (1 - eccentricitySquared)) /
    Math.pow(1 - eccentricitySquared * sinPhi1 ** 2, 1.5);

  return { N1, T1, C1, D, cosPhi1, R1 };
}

// Computes the latitude (in radians) from projection parameters
const computeLatitude = (phi1: number, N1: number, R1: number, T1: number, C1: number, D: number): number => (
    phi1 -
    (N1 * Math.tan(phi1) / R1) *
      ((D ** 2) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * eccentricitySquared) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * eccentricitySquared - 3 * C1 ** 2) * D ** 6) / 720)
);

// Computes the longitude (in radians) from projection parameters
const computeLongitude = (T1: number, C1: number, D: number, cosPhi1: number): number => (
  centralMeridian +
  (D / cosPhi1 -
    ((1 + 2 * T1 + C1) * D ** 3) / 6 +
    ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * eccentricitySquared + 24 * T1 ** 2) * D ** 5) / 120)
);

// Converts UTM coordinates (in meters) to geographic (lat/lon in degrees)
export const convertUTMToWGS84 = (easting: number, northing: number) => {
  const xAdj = easting - 500000; // Remove false easting
  const m = northing / scaleFactor;
  const phi1 = utmFootPointLatitude(m);
  
  const { N1, T1, C1, D, cosPhi1, R1 } = computeProjectionParameters(xAdj, phi1);
  
  const latitudeRad = computeLatitude(phi1, N1, R1, T1, C1, D);
  const longitudeRad = computeLongitude(T1, C1, D, cosPhi1);
  
  return {
    latitude: (latitudeRad * 180) / Math.PI,
    longitude: (longitudeRad * 180) / Math.PI,
  };
}

export const location3ToString = (location: Cartesian3 | Cartesian3[]): string => {
    if (!Array.isArray(location)) {
        const { longitude, latitude } = convertUTMToWGS84(location.x, location.y);
        return `${longitude}, ${latitude}`;
    }

    const points = location.map((point) => {
        const { longitude, latitude } = convertUTMToWGS84(point.x, point.y);
        return `${longitude} ${latitude}`;
    });
    return `${polygonPrefix}${points.join(',')}${polygonSuffix}`;
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
    
    if (!template) return {template: undefined, locationTemplateProperties: undefined, locationProperties: undefined};
    
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
}