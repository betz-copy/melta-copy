/* eslint-disable react-hooks/exhaustive-deps */
import L, { LatLngExpression } from 'leaflet';
import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useMutation } from 'react-query';
import LocationOn from '@mui/icons-material/LocationOn';
import CircleIcon from '@mui/icons-material/Circle';
import ReactDOMServer from 'react-dom/server';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { Circle, IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getEntitiesByLocation } from '../../../services/entitiesService';
import { stringToCoordinates, bindPopupForLine, bindPopupForCircle } from '../../../utils/map';
import { getEntityTemplateColor } from '../../../utils/colors';
import { useEntityWithLocationFields } from '../../../utils/hooks/useLocation';
import { environment } from '../../../globals';

const { maxRadius } = environment.map;

const markerIcon = (color: string) =>
    L.divIcon({
        className: 'custom-div-icon', // must have for some raeason otherwise looks bad
        html: ReactDOMServer.renderToString(<LocationOn style={{ color, fontSize: '1.5rem' }} />),
    });

const polygonCenterIcon = (color: string) =>
    L.divIcon({
        className: 'custom-div-icon',
        html: ReactDOMServer.renderToString(<CircleIcon style={{ color, fontSize: '1rem' }} />),
    });

type props = {
    featureGroupRef: React.RefObject<L.FeatureGroup<any>>;
    searchResultGroupRef: React.RefObject<L.FeatureGroup<any>>;
    searchedEntityGroupRef: React.RefObject<L.FeatureGroup<any>>;
    onSelectEntity: (element: { node: IEntity; matchingField: string }) => void;
    filteredTemplatesIds: string[];
    searchedEntity?: IEntity;
    entityTemplateMap: IEntityTemplateMap;
};

export const EditableMapControl = ({
    featureGroupRef,
    searchResultGroupRef,
    searchedEntityGroupRef,
    onSelectEntity,
    filteredTemplatesIds,
    searchedEntity,
    entityTemplateMap,
}: props) => {
    const map = useMap();
    const lastCircleRef = useRef<L.Circle | null>(null);

    const [circle, setCircle] = useState<Circle>();
    const [searchedEntityTemplate, setSearchedEntityTemplate] = useState<IMongoEntityTemplatePopulated>();

    const {
        bounds: searchedEntityBounds,
        markers: searchedEntityMarkers,
        polygons: searchedEntityPolygons,
    } = useEntityWithLocationFields({ entityTemplate: searchedEntityTemplate, entity: searchedEntity });

    const drawPolygonLayer = ({
        position,
        color,
        entityWithMatchingField,
        groupRef,
    }: {
        position: LatLngExpression[];
        color: string;
        entityWithMatchingField: { node: IEntity; matchingField: string };
        groupRef: React.RefObject<L.FeatureGroup<any>>;
    }) => {
        const polygonLayer = L.polygon(position).setStyle({ fill: false, color });
        groupRef?.current?.addLayer(polygonLayer);
        const centerMarker = L.marker(polygonLayer.getCenter(), { icon: polygonCenterIcon(color) });
        centerMarker.on('click', () => {
            onSelectEntity(entityWithMatchingField);
        });
        groupRef.current?.addLayer(centerMarker);
    };

    const drawMarkerLayer = ({
        position,
        color,
        entityWithMatchingField,
        groupRef,
    }: {
        position: LatLngExpression;
        color: string;
        entityWithMatchingField: { node: IEntity; matchingField: string };
        groupRef: React.RefObject<L.FeatureGroup<any>>;
    }) => {
        const markerLayer = L.marker(position, { icon: markerIcon(color) });
        markerLayer.on('click', () => {
            onSelectEntity(entityWithMatchingField);
        });
        groupRef.current?.addLayer(markerLayer);
    };

    const { mutateAsync } = useMutation(getEntitiesByLocation, {
        onSuccess: (response) => {
            response.forEach((item) => {
                const { matchingFields, node } = item;
                const entityTemplate = entityTemplateMap!.get(node.templateId)!;
                const entityTemplateColor = getEntityTemplateColor(entityTemplate);

                matchingFields.forEach((matchingField) => {
                    const { type, value } = stringToCoordinates(node.properties[matchingField]);

                    if (type === 'polygon') {
                        drawPolygonLayer({
                            position: value as LatLngExpression[],
                            color: entityTemplateColor,
                            entityWithMatchingField: { node, matchingField },
                            groupRef: searchResultGroupRef,
                        });
                    } else {
                        drawMarkerLayer({
                            position: value as LatLngExpression,
                            color: entityTemplateColor,
                            entityWithMatchingField: { node, matchingField },
                            groupRef: searchResultGroupRef,
                        });
                    }
                });
            });
        },
        onError: () => {
            toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
        },
    });

    useEffect(() => {
        searchResultGroupRef?.current?.clearLayers();
        if (circle) {
            for (const templateId of filteredTemplatesIds) {
                mutateAsync({ textSearch: '', templates: { [templateId]: { filter: {} } }, circle });
            }
        }
    }, [filteredTemplatesIds, circle]); // refetch every time circle or selected templates changes

    useEffect(() => {
        if (searchedEntity) {
            setSearchedEntityTemplate(entityTemplateMap!.get(searchedEntity.templateId)!);
        }
    }, [searchedEntity]);

    useEffect(() => {
        searchedEntityGroupRef.current?.clearLayers();
        if (searchedEntityBounds?.isValid()) {
            searchedEntityPolygons.forEach(({ key, position }) => {
                drawPolygonLayer({
                    position,
                    color: 'yellow',
                    entityWithMatchingField: { node: searchedEntity!, matchingField: key },
                    groupRef: searchedEntityGroupRef,
                });
            });
            searchedEntityMarkers.forEach(({ key, position }) => {
                drawMarkerLayer({
                    position,
                    color: 'yellow',
                    entityWithMatchingField: { node: searchedEntity!, matchingField: key },
                    groupRef: searchedEntityGroupRef,
                });
            });

            map.fitBounds(searchedEntityBounds);
        }
    }, [searchedEntityBounds, searchedEntityMarkers, searchedEntityPolygons, map]);

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
            onCreated={(e) => {
                const { layer } = e;
                if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                    layer.bindPopup(bindPopupForLine(layer.getLatLngs() as L.LatLng[])).openPopup();
                } else if (layer instanceof L.Circle) {
                    if (lastCircleRef.current) {
                        featureGroupRef?.current?.removeLayer(lastCircleRef.current);
                    }
                    lastCircleRef.current = layer;

                    setCircle({
                        coordinate: [layer.getLatLng().lng, layer.getLatLng().lat],
                        radius: layer.getRadius(),
                    });

                    const bounds = layer.getBounds();
                    map.fitBounds(bounds);

                    layer.bindPopup(bindPopupForCircle(layer.getRadius()));
                }
                featureGroupRef?.current?.addLayer(layer);
            }}
            onDeleted={(e) =>
                e.layers.eachLayer((layer) => {
                    if (layer instanceof L.Circle && layer === lastCircleRef.current) {
                        lastCircleRef.current.remove();
                    }
                    featureGroupRef?.current?.removeLayer(layer);
                })
            }
        />
    );
};
