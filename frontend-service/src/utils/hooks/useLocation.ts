import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { IEntity, IMongoEntityTemplatePopulated, IEntitySingleProperty } from '@microservices/shared-interfaces';
import { parsePolygon, stringToCoordinates } from '../map';
import { environment } from '../../globals';

const { squareLength } = environment.map;

type entityWithLocationsProps = {
    entity?: IEntity;
    entityTemplate?: IMongoEntityTemplatePopulated;
};

export const createSquareAroundPoint = (center: L.LatLngExpression, sideLength: number): L.LatLngExpression[] => {
    // eslint-disable-next-line no-nested-ternary
    const [centerLat, centerLng] = center instanceof L.LatLng ? [center.lat, center.lng] : Array.isArray(center) ? center : [center.lat, center.lng];

    const halfSide = sideLength / 2 / 111000;
    const topLeft: L.LatLngExpression = [centerLat + halfSide, centerLng - halfSide];
    const topRight: L.LatLngExpression = [centerLat + halfSide, centerLng + halfSide];
    const bottomRight: L.LatLngExpression = [centerLat - halfSide, centerLng + halfSide];
    const bottomLeft: L.LatLngExpression = [centerLat - halfSide, centerLng - halfSide];

    return [topLeft, topRight, bottomRight, bottomLeft, topLeft];
};

export const useEntityWithLocationFields = ({ entityTemplate, entity }: entityWithLocationsProps) => {
    const [propertyDefinitions, setPropertyDefinitions] = useState<Record<string, IEntitySingleProperty>>({});
    const [properties, setProperties] = useState<Record<string, any>>({});

    useEffect(() => {
        if (entityTemplate && entity) {
            setPropertyDefinitions(entityTemplate.properties.properties);
            setProperties(entity.properties);
        }
    }, [entityTemplate, entity]);

    const { markers, polygons, allLatLngs } = useMemo(() => {
        const markerList: { key: string; position: L.LatLngExpression }[] = [];
        const polygonList: { key: string; position: L.LatLngExpression[] }[] = [];
        const latLngList: L.LatLngExpression[] = [];

        Object.entries(propertyDefinitions).forEach(([key, definition]) => {
            if (definition.format === 'location' && properties[key]) {
                const parsedPolygon = parsePolygon(properties[key]);
                if (parsedPolygon) {
                    polygonList.push({ key, position: parsedPolygon });
                    latLngList.push(...parsedPolygon);
                } else {
                    const position = stringToCoordinates(properties[key]);
                    markerList.push({ key, position: position.value as L.LatLngExpression });
                    latLngList.push(...createSquareAroundPoint(position.value as L.LatLngExpression, squareLength));
                }
            }
        });

        return { markers: markerList, polygons: polygonList, allLatLngs: latLngList };
    }, [propertyDefinitions, properties]);

    const bounds = useMemo(() => {
        if (allLatLngs.length > 0) {
            return L.latLngBounds(allLatLngs);
        }
        return null;
    }, [allLatLngs]);

    return { propertyDefinitions, allLatLngs, markers, polygons, bounds };
};
