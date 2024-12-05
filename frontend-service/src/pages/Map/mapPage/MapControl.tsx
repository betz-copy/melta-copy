import L, { LatLngExpression, LatLng } from 'leaflet';
import React, { useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useQueryClient, useMutation } from 'react-query';
import { Circle, ISearchEntitiesByLocationTemplatesBody, Polygon } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { getEntitiesByLocation } from '../../../services/entitiesService';
import { stringToCoordinates, bindPopupForLine, bindPopupForCircle } from '../../../utils/map';

const MAX_RADIUS = 30000; // 10 kilometers in meters

type props = {
    featureGroupRef: React.RefObject<L.FeatureGroup<any>>;
    searchResultGroupRef: React.RefObject<L.FeatureGroup<any>>;
    lastCircleRef: React.RefObject<L.Circle<any>>;
    onSelectEntity: (element) => void;
    filteredTemplatesIds: string[];
};

export const EditableMapControl = ({ featureGroupRef, searchResultGroupRef, lastCircleRef, onSelectEntity, filteredTemplatesIds }: props) => {
    const map = useMap();
    const queryClient = useQueryClient();
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);

    const { mutate } = useMutation(getEntitiesByLocation, {
        onSuccess: (response) => {
            searchResultGroupRef?.current?.clearLayers();

            response.forEach((item) => {
                const { matchingFields, node } = item;

                matchingFields.forEach((field) => {
                    const { type, value } = stringToCoordinates(node.properties[field]);

                    let layer;
                    if (type === 'polygon') {
                        layer = L.polygon(value as LatLngExpression[]).setStyle({ fill: false });
                    } else {
                        layer = L.marker(value as LatLngExpression);
                    }

                    if (layer) {
                        layer.on('click', () => {
                            onSelectEntity({ node, field });
                        });
                        searchResultGroupRef?.current?.addLayer(layer);
                    }
                });
            });
        },
        onError: (error) => {
            console.log('error', error);
        },
    });

    const generateTemplateObject: ISearchEntitiesByLocationTemplatesBody | null = useMemo(() => {
        return entityTemplateMap ? Array.from(entityTemplateMap.keys()).reduce((acc, elem) => ({ ...acc, [elem]: { filter: {} } }), {}) : null;
    }, [entityTemplateMap]);

    const generateFilteredTemplateObject = () => {
        if (!entityTemplateMap) return null;

        return filteredTemplatesIds.reduce((acc, templateId) => {
            if (entityTemplateMap.has(templateId)) {
                return { ...acc, [templateId]: { filter: {} } };
            }
            return acc;
        }, {});
    };

    const handleFetchLocationRequest = (location: { circle?: Circle; polygon?: Polygon }) => {
        const generateTemplateObject2 = generateFilteredTemplateObject();

        console.log(generateTemplateObject);
        console.log(generateTemplateObject2);

        if (generateTemplateObject) {
            const payload = {
                textSearch: '',
                templates: generateTemplateObject,
                ...location,
            };
            mutate(payload);
        }
    };

    const handlePolylineLayer = (layer) => {
        layer.bindPopup(bindPopupForLine(layer.getLatLngs() as L.LatLng[])).openPopup();
    };

    const handleCircleLayer = (layer) => {
        if (layer.getRadius() > MAX_RADIUS) {
            layer.setRadius(MAX_RADIUS);
        }

        if (lastCircleRef.current) {
            featureGroupRef?.current?.removeLayer(lastCircleRef.current);
        }
        lastCircleRef.current = layer;

        const circle: Circle = {
            coordinate: [layer.getLatLng().lng, layer.getLatLng().lat],
            radius: layer.getRadius(),
        };

        handleFetchLocationRequest({ circle });

        const bounds = layer.getBounds();
        map.fitBounds(bounds);

        layer.bindPopup(bindPopupForCircle(layer.getRadius()));
        layer.on('click', () => {
            map.fitBounds(bounds);
        });
    };

    const handleCreateLayer = (e) => {
        const { layer } = e;
        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
            handlePolylineLayer(layer);
        } else if (layer instanceof L.Circle) {
            handleCircleLayer(layer);
        }
        featureGroupRef?.current?.addLayer(layer);
    };

    const handleDeleteLayer = (e) => {
        e.layers.eachLayer((layer) => {
            if (layer instanceof L.Circle && layer === lastCircleRef.current) {
                lastCircleRef.current = null;
            }
            featureGroupRef?.current?.removeLayer(layer);
        });
    };

    return (
        <EditControl
            position="topright"
            draw={{
                rectangle: false,
                circlemarker: false,
                polygon: false,
                marker: false,
                circle: {
                    shapeOptions: {
                        color: 'red',
                        fill: false,
                    },
                },
                polyline: {
                    shapeOptions: {
                        color: 'red',
                    },
                },
            }}
            edit={{
                featureGroup: featureGroupRef.current,
                edit: false,
                remove: true,
            }}
            onCreated={handleCreateLayer}
            onDeleted={handleDeleteLayer}
        />
    );
};
