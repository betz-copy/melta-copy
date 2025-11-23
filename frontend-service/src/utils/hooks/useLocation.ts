import * as Cesium from 'cesium';
import { Cartesian3, Math as CesiumMath } from 'cesium';
import { useEffect, useMemo } from 'react';
import { useCesium } from 'resium';
import { environment } from '../../globals';
import { IEntity } from '../../interfaces/entities';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { parsePolygon, stringToCoordinates } from '../map';
import { ICoordinateSearchResult, IPolygonSearchResult } from '../../interfaces/location';

const { squareLength } = environment.map;

export const createSquareAroundPoint = (center: Cartesian3, sideLength: number): Cartesian3[] => {
    const halfSide = sideLength / 2 / 111000;

    const [centerLat, centerLng] = [center.x, center.y];

    const topLeft = Cesium.Cartesian3.fromDegrees(centerLat + halfSide, centerLng - halfSide);
    const topRight = Cesium.Cartesian3.fromDegrees(centerLat + halfSide, centerLng + halfSide);
    const bottomRight = Cesium.Cartesian3.fromDegrees(centerLat - halfSide, centerLng + halfSide);
    const bottomLeft = Cesium.Cartesian3.fromDegrees(centerLat - halfSide, centerLng - halfSide);

    return [topLeft, topRight, bottomRight, bottomLeft, topLeft];
};

export const useEntitiesWithLocationFields = ({ entities, entityTemplateMap }: { entities: IEntity[]; entityTemplateMap: IEntityTemplateMap }) => {
    const { viewer } = useCesium();

    const { markers, polygons, allCoordinates } = useMemo(() => {
        const markerList: ICoordinateSearchResult[] = [];
        const polygonList: IPolygonSearchResult[] = [];
        const coordinatesList: Cartesian3[] = [];

        const entitiesByTemplate = new Map<string, IEntity[]>();
        entities.forEach((entity) => {
            const templateEntities = entitiesByTemplate.get(entity.templateId) || [];
            templateEntities.push(entity);
            entitiesByTemplate.set(entity.templateId, templateEntities);
        });

        entitiesByTemplate.forEach((templateEntities, templateId) => {
            const template = entityTemplateMap.get(templateId)!;

            const locationProperties = Object.entries(template.properties.properties).filter(([_, value]) => value.format === 'location');

            templateEntities.forEach((entity) => {
                locationProperties.forEach(([propertyName, { title }]) => {
                    if (entity.properties[propertyName]) {
                        const parsedPolygon = parsePolygon(entity.properties[propertyName].location);
                        const key = `${propertyName}-${entity.properties._id}`;

                        if (parsedPolygon) {
                            polygonList.push({ key, name: title, node: entity, position: parsedPolygon });
                            coordinatesList.push(...parsedPolygon);
                        } else {
                            const position = stringToCoordinates(entity.properties[propertyName].location);
                            const markerPosition = position.value as Cartesian3;
                            markerList.push({ key, name: title, node: entity, position: markerPosition });
                            coordinatesList.push(...createSquareAroundPoint(markerPosition, squareLength));
                        }
                    }
                });
            });
        });

        return { markers: markerList, polygons: polygonList, allCoordinates: coordinatesList };
    }, [entities, entityTemplateMap]);

    const bounds = useMemo(() => (allCoordinates.length > 0 ? Cesium.BoundingSphere.fromPoints(allCoordinates) : null), [allCoordinates]);

    useEffect(() => {
        if (viewer && bounds) viewer.camera.viewBoundingSphere(bounds, new Cesium.HeadingPitchRange(0, -CesiumMath.PI_OVER_TWO, 0));
    }, [bounds, viewer]);

    return { allCoordinates, markers, polygons, bounds };
};
