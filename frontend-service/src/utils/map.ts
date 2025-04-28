import { GeometryUtil, LatLng, LatLngExpression } from 'leaflet';
import * as L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { IEntity, IEntityTemplatePopulated } from '@microservices/shared-interfaces';
import { environment } from '../globals';

const {
    polygon: { polygonPrefix, polygonSuffix },
    units: { km, squaredKm },
} = environment.map;

export const jerusalemCoordinates: LatLngExpression = [31.7683, 35.2137];

export const parsePolygon = (polygonStr: string): LatLng[] | undefined => {
    if (!polygonStr.startsWith(polygonPrefix) || !polygonStr.endsWith(polygonSuffix)) {
        return undefined;
    }

    const coordsStr = polygonStr.slice(polygonPrefix.length, -polygonSuffix.length);
    const coordPairs = coordsStr.split(',');

    const coordinates: LatLng[] = coordPairs.map((pair) => {
        const [latStr, lonStr] = pair.trim().split(/\s+/);
        return L.latLng(+latStr, +lonStr);
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
    value: LatLngExpression | LatLng[];
};

export const stringToCoordinates = (strCoords: string): CoordinatesResult => {
    const polygon = parsePolygon(strCoords);
    if (polygon) return { type: 'polygon', value: polygon };

    const formatted = strCoords.split(',').map((val) => +val);
    return { type: 'marker', value: formatted as LatLngExpression };

    // TODO: add validation to format
};

export const latLngToString = (latLng: LatLng | LatLng[], includePolygon = true) => {
    if (!Array.isArray(latLng)) {
        return `${latLng.lat}, ${latLng.lng}`;
    }

    const matchedPoints = latLng.toString().match(/LatLng\(([^)]+)\)/g);

    if (!matchedPoints) {
        return includePolygon ? `${polygonPrefix}${polygonSuffix}` : '';
    }

    const points = matchedPoints.map((point) =>
        point
            .replace(/LatLng|\(|\)/g, '')
            .replace(',', '')
            .trim(),
    );

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
