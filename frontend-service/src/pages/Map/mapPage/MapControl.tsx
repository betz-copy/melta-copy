import L, { LatLngExpression } from 'leaflet';
import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useQueryClient, useMutation } from 'react-query';
import LocationOn from '@mui/icons-material/LocationOn';
import CircleIcon from '@mui/icons-material/Circle';
import ReactDOMServer from 'react-dom/server';
import { Circle } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { getEntitiesByLocation } from '../../../services/entitiesService';
import { stringToCoordinates, bindPopupForLine, bindPopupForCircle } from '../../../utils/map';
import { getEntityTemplateColor } from '../../../utils/colors';

type props = {
    featureGroupRef: React.RefObject<L.FeatureGroup<any>>;
    searchResultGroupRef: React.RefObject<L.FeatureGroup<any>>;
    onSelectEntity: (element) => void;
    filteredTemplatesIds: string[];
};

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

export const EditableMapControl = ({ featureGroupRef, searchResultGroupRef, onSelectEntity, filteredTemplatesIds }: props) => {
    const queryClient = useQueryClient();
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);

    const map = useMap();
    const [circle, setCircle] = useState<Circle>();
    const lastCircleRef = useRef<L.Circle | null>(null);

    const { mutate } = useMutation(getEntitiesByLocation, {
        onSuccess: (response) => {
            response.forEach((item) => {
                const { matchingFields, node } = item;
                const entityTemplate = entityTemplateMap!.get(node.templateId)!;
                const entityTemplateColor = getEntityTemplateColor(entityTemplate);

                matchingFields.forEach((field) => {
                    const { type, value } = stringToCoordinates(node.properties[field]);

                    if (type === 'polygon') {
                        // Create the polygon layer
                        const polygonLayer = L.polygon(value as LatLngExpression[]).setStyle({ fill: false, color: entityTemplateColor });
                        searchResultGroupRef?.current?.addLayer(polygonLayer);

                        // Create a marker at the polygon's center
                        const centerMarker = L.marker(polygonLayer.getCenter(), { icon: polygonCenterIcon(entityTemplateColor) });

                        // When the center marker is clicked, call onSelectEntity
                        centerMarker.on('click', () => {
                            onSelectEntity({ node, field });
                        });

                        // Add both the polygon and the center marker to the search result group
                        searchResultGroupRef?.current?.addLayer(centerMarker);
                    } else {
                        const markerLayer = L.marker(value as LatLngExpression, { icon: markerIcon(entityTemplateColor) });
                        markerLayer.on('click', () => {
                            onSelectEntity({ node, field });
                        });
                        searchResultGroupRef?.current?.addLayer(markerLayer);
                    }
                });
            });
        },

        onError: (error) => {
            console.log('error', error);
        },
    });

    // Fetching all template at once
    // const handleFetchLocationRequest = () => {
    //     const templatesObject = filteredTemplatesIds.reduce((acc, templateId) => {
    //         if (entityTemplateMap!.has(templateId)) {
    //             return { ...acc, [templateId]: { filter: {} } };
    //         }
    //         return acc;
    //     }, {});
    //     if (templatesObject && circle) {
    //         mutate({ textSearch: '', templates: templatesObject, circle });
    //     }
    // };

    const handleFetchLocationRequest = async () => {
        if (circle) {
            for (const templateId of filteredTemplatesIds) {
                mutate({ textSearch: '', templates: { [templateId]: { filter: {} } }, circle });
            }
        }
    };

    const handleCreateLayer = (e) => {
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
            layer.on('click', () => {
                map.fitBounds(bounds);
            });
        }
        featureGroupRef?.current?.addLayer(layer);
    };

    const handleDeleteLayer = (e) => {
        e.layers.eachLayer((layer) => {
            if (layer instanceof L.Circle && layer === lastCircleRef.current) {
                lastCircleRef.current.remove();
            }
            featureGroupRef?.current?.removeLayer(layer);
        });
    };

    useEffect(() => {
        searchResultGroupRef?.current?.clearLayers();
        handleFetchLocationRequest();
    }, [filteredTemplatesIds, circle]);

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
