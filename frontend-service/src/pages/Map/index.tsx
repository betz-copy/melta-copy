import React, { useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer, Polygon, LayersControl, LayerGroup, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw'; // Import EditControl
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css'; // Import Leaflet.Draw CSS
import { MapPopup } from './CustomMapPopup';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { calculateDistance, calculatePolygonArea, parsePolygon, stringToCoordinates } from '../../utils/map';

type Props = {
    properties: Record<string, any>;
    entityTemplate: IMongoEntityTemplatePopulated;
    darkMode: boolean;
    styles?: React.CSSProperties;
};

const jerusalemCoordinates: LatLngExpression = [31.7683, 35.2137]; // default coordinates

const Map = ({ styles, properties, entityTemplate, darkMode }: Props) => {
    const markerRefs = useRef<{ [key: string]: L.Marker }>({});
    const featureGroupRef = useRef<L.FeatureGroup>(null);

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
                                <MapPopup
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
                                <MapPopup
                                    header={propertyDefinitions[key].title}
                                    properties={properties}
                                    entityTemplate={entityTemplate}
                                    darkMode={darkMode}
                                />
                            </Marker>
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>
                {/* Feature Group for Draw Controls */}
                <LayersControl.Overlay checked name="Measure Distance">
                    <LayerGroup>
                        <FeatureGroup ref={featureGroupRef}>
                            <EditControl
                                position="topright"
                                draw={{
                                    rectangle: false,
                                    circlemarker: false,
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
                                    marker: true, // Markers don’t have a color option
                                    polyline: {
                                        shapeOptions: {
                                            color: 'yellow',
                                        },
                                    },
                                }}
                                edit={{
                                    featureGroup: featureGroupRef.current,
                                    edit: false,
                                    remove: true,
                                }}
                                onDeleted={(e: L.DrawEvents.Deleted) => {
                                    if (featureGroupRef.current) {
                                        e.layers.eachLayer((layer) => {
                                            featureGroupRef.current!.removeLayer(layer);
                                        });
                                    }
                                }}
                                onCreated={(e: L.DrawEvents.Created) => {
                                    if (featureGroupRef.current) {
                                        const { layer } = e;
                                        if (layer instanceof L.Marker) {
                                            const { lat, lng } = layer.getLatLng();
                                            layer.bindPopup(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`).openPopup();
                                        }
                                        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                                            const latlngs = layer.getLatLngs() as L.LatLng[];
                                            const distanceMeters = calculateDistance(latlngs);
                                            const distanceKm = distanceMeters / 1000; // Convert to kilometers
                                            layer.bindPopup(`Distance: ${distanceKm.toFixed(2)} km`).openPopup();
                                        } else if (layer instanceof L.Polygon) {
                                            const latlngs = layer.getLatLngs()[0] as L.LatLng[];
                                            const areaMeters = calculatePolygonArea(latlngs);
                                            const areaKm2 = areaMeters / 1_000_000; // Convert to square kilometers
                                            layer.bindPopup(`Area: ${areaKm2.toFixed(2)} km²`).openPopup();
                                        } else if (layer instanceof L.Circle) {
                                            const radius = layer.getRadius();
                                            const areaMeters = Math.PI * radius * radius;
                                            const areaKm2 = areaMeters / 1_000_000; // Convert to square kilometers
                                            layer.bindPopup(`Area: ${areaKm2.toFixed(2)} km²`).openPopup();
                                        }

                                        featureGroupRef.current.addLayer(layer);
                                    }
                                }}
                            />
                        </FeatureGroup>
                    </LayerGroup>
                </LayersControl.Overlay>
            </LayersControl>
        </MapContainer>
    );
};

export default Map;
