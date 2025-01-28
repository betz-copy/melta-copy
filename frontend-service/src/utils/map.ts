import { GeometryUtil, LatLng } from 'leaflet';
import * as L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { Cartesian3, Ellipsoid, Math as CesiumMath } from 'cesium';
import { IEntity } from '../interfaces/entities';
import { IEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { environment } from '../globals';

const {
    polygon: { polygonPrefix, polygonSuffix },
    units: { km, squaredKm },
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
            return Cartesian3.fromDegrees(longitude, latitude, 0, Ellipsoid.WGS84);
        })
        .filter((coord): coord is Cartesian3 => coord !== null);

    return coordinates.length > 0 ? coordinates : undefined;
};

export const calculateDistance = (latlngs: LatLng[]) => {
    let totalDistance = 0;
    for (let i = 1; i < latlngs.length; i++) {
        totalDistance += latlngs[i - 1].distanceTo(latlngs[i]);
    }
    return totalDistance;
};

export const calculatePolygonArea = (latlngs: LatLng[]) => GeometryUtil.geodesicArea(latlngs);

type CoordinatesResult = {
    type: 'polygon' | 'marker';
    value: Cartesian3 | Cartesian3[];
};

export const stringToCoordinates = (strCoords: string): CoordinatesResult => {
    const polygon = parsePolygon(strCoords);
    if (polygon) return { type: 'polygon', value: polygon };

    const formatted = strCoords.split(',').map((val) => +val);
    return { type: 'marker', value: { x: formatted[0], y: formatted[1], z: zoomNumber } as Cartesian3 };

    // TODO: add validation to format
};

export const isCartesian3 = (coordinates: any) => coordinates.x > 91 || coordinates.x < -91 || coordinates.y > 181 || coordinates.x < -181;

export const calculateCenterOfPolygon = (coordinates: Cartesian3[]): Cartesian3 => {
    if (coordinates.length === 0) return jerusalemCoordinates;

    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    coordinates.forEach((coordinate) => {
        const newCoordinate = !isCartesian3(coordinate) ? Cartesian3.fromDegrees(coordinate.x, coordinate.y, zoomNumber) : coordinate;
        sumX += newCoordinate.x;
        sumY += newCoordinate.y;
        sumZ += newCoordinate.z;
    });

    const { length } = coordinates;
    return new Cartesian3(sumX / length, sumY / length, sumZ / length);
};

export const resolveDestination = (
    drawingMode: 'polygon' | 'coordinate' | null,
    polygonPosition: Cartesian3[],
    markerPosition: Cartesian3 | null,
): Cartesian3 => {
    if (markerPosition !== null) return markerPosition;
    if (polygonPosition.length > 0) if (drawingMode === null) return { ...calculateCenterOfPolygon(polygonPosition) } as Cartesian3;
    return jerusalemCoordinates;
};

export const convertToDegrees = (point: Cartesian3): { longitude: number; latitude: number } => {
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(point);

    if (!cartographic) {
        console.error('Invalid Point');
    }

    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const latitude = CesiumMath.toDegrees(cartographic.latitude);

    return { longitude, latitude };
};

export const cartesian3ToString = (cartesian3: Cartesian3 | Cartesian3[], includePolygon = true): string => {
    if (!Array.isArray(cartesian3)) {
        const { longitude, latitude } = convertToDegrees(cartesian3);
        return `${longitude}, ${latitude}`;
    }

    const points = cartesian3.map((point) => {
        const { longitude, latitude } = convertToDegrees(point);
        return `${longitude} ${latitude}`;
    });
    return includePolygon ? `${polygonPrefix}${points.join(',')}${polygonSuffix}` : points.join(',');
};

// ugly af find better solution
export const bindPopupForMarker = (coordinates: LatLng) => {
    const { lat, lng } = coordinates;
    if (lat && lng) {
        return `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    return `Coordinates: ${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}`;
};

export const bindPopupForLine = (coordinates: LatLng[]) => {
    const distanceMeters = calculateDistance(coordinates);
    const distanceKm = distanceMeters / 1000;
    return `Distance: ${distanceKm.toFixed(2)} ${km}`;
};

export const bindPopupForPolygon = (coordinates: LatLng[]) => {
    const areaMeters = calculatePolygonArea(coordinates);
    const areaKm2 = areaMeters / 1_000_000;
    return `Area: ${areaKm2.toFixed(2)} ${squaredKm}`;
};

export const bindPopupForCircle = (radius: number) => {
    const areaMeters = Math.PI * radius * radius;
    const areaKm2 = areaMeters / 1_000_000;
    const radiusKm = radius / 1000;
    return `Area: ${areaKm2.toFixed(2)} ${squaredKm}, Radius: ${radiusKm.toFixed(2)} ${km}`;
};

export const extractLocationFieldsFromEntity = (entity: IEntity, entityTemplate: IEntityTemplatePopulated) => {
    const locationFields = Object.entries(entityTemplate.properties.properties)
        .filter(([, value]) => value.format === 'location')
        .map(([key]) => key);

    return Object.entries(entity.properties)
        .filter(([key]) => locationFields.includes(key))
        .map(([, value]) => value as string);
};

export const UpdateMapBounds = ({ bounds }: { bounds: L.LatLngBounds | null }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds?.isValid()) {
            map.fitBounds(bounds);
        }
    }, [bounds, map]);

    return null;
};
