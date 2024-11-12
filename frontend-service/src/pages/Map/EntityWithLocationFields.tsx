import React, { useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer, Polygon, LayersControl, LayerGroup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css'; // Import Leaflet.Draw CSS
import EntityPopup from './EntityPopup';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { jerusalemCoordinates, parsePolygon, stringToCoordinates } from '../../utils/map';

type Props = {
    properties: Record<string, any>;
    entityTemplate: IMongoEntityTemplatePopulated;
    darkMode: boolean;
    styles?: React.CSSProperties;
};

const EntityWithLocationFields = ({ styles, properties, entityTemplate, darkMode }: Props) => {
    const markerRefs = useRef<{ [key: string]: L.Marker }>({});
    const propertyDefinitions = entityTemplate.properties.properties;

    const { markers, polygons, allLatLngs } = useMemo(() => {
        const markerList: { key: string; position: LatLngExpression }[] = [];
        const polygonList: { key: string; positions: LatLngExpression[] }[] = [];
        const latLngList: LatLngExpression[] = [];

        Object.entries(propertyDefinitions).forEach(([key, definition]) => {
            if (definition.format === 'location' && properties[key]) {
                const parsedPolygon = parsePolygon(properties[key]);
                if (parsedPolygon) {
                    polygonList.push({ key, positions: parsedPolygon });
                    latLngList.push(...parsedPolygon);
                } else {
                    const position = stringToCoordinates(properties[key]);
                    markerList.push({ key, position: position.value as LatLngExpression });
                    latLngList.push(position.value as LatLngExpression);
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

    return (
        <MapContainer
            style={{ width: '100%', height: '100vh', ...styles }}
            bounds={bounds?.isValid() ? bounds : undefined}
            center={!bounds?.isValid() ? jerusalemCoordinates : undefined}
            zoom={!bounds?.isValid() ? 8 : undefined}
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

                {/* Overlay Layers */}
                <LayersControl.Overlay checked name="Polygons">
                    <LayerGroup>
                        {polygons.map(({ key, positions }) => (
                            <Polygon key={key} positions={positions}>
                                <EntityPopup
                                    header={propertyDefinitions[key].title}
                                    properties={properties}
                                    entityTemplate={entityTemplate}
                                    darkMode={darkMode}
                                />
                            </Polygon>
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Markers">
                    <LayerGroup>
                        {markers.map(({ key, position }) => (
                            <Marker
                                key={key}
                                position={position}
                                ref={(element) => {
                                    if (element) markerRefs.current[key] = element;
                                }}
                                eventHandlers={{
                                    mouseover: () => {
                                        if (markerRefs.current[key]) markerRefs.current[key].openPopup();
                                    },
                                    mouseout: () => {
                                        if (markerRefs.current[key]) markerRefs.current[key].closePopup();
                                    },
                                }}
                            >
                                <EntityPopup
                                    header={propertyDefinitions[key].title}
                                    properties={properties}
                                    entityTemplate={entityTemplate}
                                    darkMode={darkMode}
                                />
                            </Marker>
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>
            </LayersControl>
        </MapContainer>
    );
};

export default EntityWithLocationFields;
