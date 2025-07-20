import { useEffect, useMemo, useState } from 'react';
import { Cartesian3, Math as CesiumMath } from 'cesium';
import * as Cesium from 'cesium';
import { useCesium } from 'resium';
import { parsePolygon, stringToCoordinates } from '../map';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IEntity } from '../../interfaces/entities';
import { environment } from '../../globals';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';

const { squareLength } = environment.map;

type entityWithLocationsProps = {
    entityProperties?: IEntity['properties'];
    entityTemplate?: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated;
};

export const createSquareAroundPoint = (center: Cartesian3, sideLength: number): Cartesian3[] => {
    const halfSide = sideLength / 2 / 111000;

    const [centerLat, centerLng] = [center.x, center.y];

    const topLeft = Cesium.Cartesian3.fromDegrees(centerLat + halfSide, centerLng - halfSide);
    const topRight = Cesium.Cartesian3.fromDegrees(centerLat + halfSide, centerLng + halfSide);
    const bottomRight = Cesium.Cartesian3.fromDegrees(centerLat - halfSide, centerLng + halfSide);
    const bottomLeft = Cesium.Cartesian3.fromDegrees(centerLat - halfSide, centerLng - halfSide);

    return [topLeft, topRight, bottomRight, bottomLeft, topLeft];
};

export const useEntityWithLocationFields = ({ entityTemplate, entityProperties }: entityWithLocationsProps) => {
    const [propertyDefinitions, setPropertyDefinitions] = useState<Record<string, IEntitySingleProperty>>({});
    const [properties, setProperties] = useState<Record<string, any>>({});

    const { viewer } = useCesium();

    useEffect(() => {
        if (entityTemplate && entityProperties) {
            setPropertyDefinitions(entityTemplate.properties.properties);
            setProperties(entityProperties);
        } else {
            setPropertyDefinitions({});
            setProperties({});
        }
    }, [entityTemplate, entityProperties]);

    const { markers, polygons, allCoordinates } = useMemo(() => {
        const markerList: { key: string; position: Cartesian3 }[] = [];
        const polygonList: { key: string; position: Cartesian3[] }[] = [];
        const coordinatesList: Cartesian3[] = [];

        Object.entries(propertyDefinitions).forEach(([key, definition]) => {
            if (definition.format === 'location' && properties[key]) {
                const parsedPolygon = parsePolygon(properties[key].location);
                if (parsedPolygon) {
                    polygonList.push({ key, position: parsedPolygon });
                    coordinatesList.push(...parsedPolygon);
                } else {
                    const position = stringToCoordinates(properties[key].location);
                    const markerPosition = position.value as Cartesian3;
                    markerList.push({ key, position: markerPosition });
                    coordinatesList.push(...createSquareAroundPoint(markerPosition, squareLength));
                }
            }
        });

        return { markers: markerList, polygons: polygonList, allCoordinates: coordinatesList };
    }, [propertyDefinitions, properties]);

    const bounds = useMemo(() => {
        return allCoordinates.length > 0 ? Cesium.BoundingSphere.fromPoints(allCoordinates) : null;
    }, [allCoordinates]);

    useEffect(() => {
        if (viewer && bounds) {
            viewer.camera.viewBoundingSphere(bounds, new Cesium.HeadingPitchRange(0, -CesiumMath.PI_OVER_TWO, 0));
        }
    }, [bounds, viewer]);

    return { propertyDefinitions, allCoordinates, markers, polygons, bounds };
};
