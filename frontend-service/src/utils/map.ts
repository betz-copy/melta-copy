import { GeometryUtil, LatLng, LatLngExpression } from 'leaflet';
import * as L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { Cartesian3 } from 'cesium';
import { IEntity } from '../interfaces/entities';
import { IEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { environment } from '../globals';

const {
    polygon: { polygonPrefix, polygonSuffix },
    units: { km, squaredKm },
} = environment.map;

export const jerusalemCoordinates: LatLngExpression = [31.7683, 35.2137];

export const parsePolygon = (polygonStr: string): Cartesian3[] | undefined => {
    if (!polygonStr.startsWith(polygonPrefix) || !polygonStr.endsWith(polygonSuffix)) {
        return undefined;
    }

    const coordsStr = polygonStr.slice(polygonPrefix.length, -polygonSuffix.length);
    const coordPairs = coordsStr.split(',');
    console.log({ coordsStr, coordPairs });

    const coordinates: Cartesian3[] = coordPairs.map((pair) => {
        const [xStr, yStr] = pair.trim().split(/\s+/);
        return { x: +xStr, y: +yStr, z: 0 };
    });

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
    return { type: 'marker', value: { x: formatted[0], y: formatted[1], z: 0 } };

    // TODO: add validation to format
};

export const cartesian3ToString = (cartesian3: Cartesian3 | Cartesian3[], includePolygon = true) => {
    if (!Array.isArray(cartesian3)) {
        return `${cartesian3.x}, ${cartesian3.y}`;
    }

    const points = cartesian3.map((point) => `${point.x} ${point.y}`);

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
