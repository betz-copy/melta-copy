import React, { useMemo, useRef } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useMutation, useQueryClient } from 'react-query';
import { bindPopupForCircle, bindPopupForLine, bindPopupForMarker, bindPopupForPolygon, jerusalemCoordinates } from '../../utils/map';
import { getEntitiesByLocation } from '../../services/entitiesService';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { Circle, ISearchEntitiesByLocationTemplatesBody } from '../../interfaces/entities';

const EditableMapControl = ({ featureGroupRef }) => {
    const map = useMap();
    const queryClient = useQueryClient();
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);

    const { mutate } = useMutation(getEntitiesByLocation, {
        onSuccess: (response) => {
            // test
            const locationField = response[0]?.properties.test_marker;

            const marker = L.marker([locationField.x, locationField.y]);

            // Add the marker to the map
            marker.addTo(map);
        },
        onError: (error) => {
            console.log('error', error);
        },
    });

    const generateTemplateObject: ISearchEntitiesByLocationTemplatesBody | null = useMemo(() => {
        return entityTemplateMap ? Array.from(entityTemplateMap.keys()).reduce((acc, elem) => ({ ...acc, [elem]: { filter: {} } }), {}) : null;
    }, [entityTemplateMap]);

    const handleFetchCircleRequest = (circle: Circle) => {
        if (generateTemplateObject)
            mutate({
                textSearch: '',
                templates: generateTemplateObject,
                circle,
            });
    };

    const handleCreateLayer = (e) => {
        const { layer } = e;

        if (layer instanceof L.Marker) {
            layer.bindPopup(bindPopupForMarker(layer.getLatLng())).openPopup();
        } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
            layer.bindPopup(bindPopupForLine(layer.getLatLngs() as L.LatLng[])).openPopup();
        } else if (layer instanceof L.Polygon) {
            const bounds = layer.getBounds();
            map.fitBounds(bounds);
            layer.bindPopup(bindPopupForPolygon(layer.getLatLngs()[0] as L.LatLng[])).openPopup();
            layer.on('click', () => {
                map.fitBounds(bounds);
            });
        } else if (layer instanceof L.Circle) {
            handleFetchCircleRequest({ coordinate: [layer.getLatLng().lat, layer.getLatLng().lng], radius: layer.getRadius() * 1000 });
            const bounds = layer.getBounds();
            map.fitBounds(bounds);
            layer.bindPopup(bindPopupForCircle(layer.getRadius())).openPopup();
            layer.on('click', () => {
                map.fitBounds(bounds);
            });
        }

        featureGroupRef.current.addLayer(layer);
    };

    const handleEditLayer = (e) => {
        e.layers.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                layer.bindPopup(bindPopupForMarker(layer.getLatLng())).openPopup();
            } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                layer.bindPopup(bindPopupForLine(layer.getLatLngs() as L.LatLng[])).openPopup();
            } else if (layer instanceof L.Polygon) {
                map.fitBounds(layer.getBounds());
                layer.bindPopup(bindPopupForPolygon(layer.getLatLngs()[0] as L.LatLng[])).openPopup();
            } else if (layer instanceof L.Circle) {
                map.fitBounds(layer.getBounds());
                layer.bindPopup(bindPopupForCircle(layer.getRadius())).openPopup();
            }
        });
    };

    const handleDeleteLayer = (e) => {
        e.layers.eachLayer((layer) => {
            featureGroupRef.current.removeLayer(layer);
        });
    };

    return (
        <EditControl
            position="topright"
            draw={{
                rectangle: false,
                circlemarker: false,
                marker: true,
                circle: {
                    shapeOptions: {
                        color: 'red',
                    },
                },
                polygon: {
                    shapeOptions: {
                        color: 'green',
                    },
                },
                polyline: {
                    shapeOptions: {
                        color: 'yellow',
                    },
                },
            }}
            edit={{
                featureGroup: featureGroupRef.current,
                edit: {},
                remove: true,
            }}
            onCreated={handleCreateLayer}
            onEdited={handleEditLayer}
            onDeleted={handleDeleteLayer}
        />
    );
};

const MapPage = () => {
    const featureGroupRef = useRef<L.FeatureGroup>(null);

    return (
        <MapContainer
            style={{ width: '100%', height: '100vh' }}
            center={jerusalemCoordinates}
            zoom={8}
            maxBounds={[
                [-90, -180],
                [90, 180],
            ]}
            maxBoundsViscosity={1}
        >
            <LayersControl position="topright">
                {/* Base Layers */}
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Esri World Imagery">
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="OpenTopoMap">
                    <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
                </LayersControl.BaseLayer>
            </LayersControl>

            {/* Feature Group for Draw Controls */}
            <FeatureGroup ref={featureGroupRef}>
                <EditableMapControl featureGroupRef={featureGroupRef} />
            </FeatureGroup>
        </MapContainer>
    );
};

export default MapPage;
