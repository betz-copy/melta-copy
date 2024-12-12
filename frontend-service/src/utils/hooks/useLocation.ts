import { useEffect, useMemo, useState } from 'react';
import * as L from 'leaflet';
import { parsePolygon, stringToCoordinates } from '../map';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IEntity } from '../../interfaces/entities';

type entityWithLocationsProps = {
    entity?: IEntity;
    entityTemplate?: IMongoEntityTemplatePopulated;
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
                    latLngList.push(position.value as L.LatLngExpression);
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
