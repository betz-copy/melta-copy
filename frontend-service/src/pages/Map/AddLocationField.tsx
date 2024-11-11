import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, LayerGroup, FeatureGroup, Marker, Popup, Polygon } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L, { LatLng, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { stringToCoordinates } from '../../utils/map';

type Props = {
    defaultLocation?: string;
    styles?: React.CSSProperties;
    updateValue: (newValue: string) => void;
};

const jerusalemCoordinates: LatLngExpression = [31.7683, 35.2137];

const AddLocationField = ({ defaultLocation, styles, updateValue }: Props) => {
    const [markerPosition, setMarkerPosition] = useState<LatLngExpression | null>(null);
    const [polygonPosition, setPolygonPosition] = useState<LatLng[] | null>(null);

    useEffect(() => {
        const initialCoordinates = defaultLocation ? stringToCoordinates(defaultLocation) : null;
        if (initialCoordinates?.type === 'marker') {
            setMarkerPosition(initialCoordinates.value as LatLngExpression);
        }
        if (initialCoordinates?.type === 'polygon') {
            setPolygonPosition(initialCoordinates.value as LatLng[]);
        }
    }, []);

    const handleMarkerCreate = (e: L.DrawEvents.Created) => {
        const { layer } = e;
        if (layer instanceof L.Marker) {
            const { lat, lng } = layer.getLatLng();
            setMarkerPosition([lat, lng]);
            updateValue([[lat, lng]].toString());
        }
    };

    const handleMarkerEdit = (e: L.DrawEvents.Edited) => {
        e.layers.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                const { lat, lng } = layer.getLatLng();
                setMarkerPosition([lat, lng]);
                updateValue([[lat, lng]].toString());
            }
        });
    };

    const handlePolygonCreate = (e: L.DrawEvents.Created) => {
        const { layer } = e;
        if (layer instanceof L.Polygon) {
            const latLngs = (layer.getLatLngs()[0] as LatLng[]).map((latLng) => [latLng.lat, latLng.lng] as unknown as LatLng);
            setPolygonPosition(latLngs);
            const coordinatesString = latLngs.map((location) => `${location[0].toFixed(5)} ${location[1].toFixed(5)}`).join(',');
            updateValue(`POLYGON((${coordinatesString}))`);
        }
    };

    const handlePolygonEdit = (e: L.DrawEvents.Edited) => {
        e.layers.eachLayer((layer) => {
            if (layer instanceof L.Polygon) {
                const latLngs = (layer.getLatLngs()[0] as LatLng[]).map((latLng) => [latLng.lat, latLng.lng] as unknown as LatLng);
                setPolygonPosition(latLngs);
                const coordinatesString = latLngs.map((location) => `${location[0].toFixed(5)} ${location[1].toFixed(5)}`).join(',');
                updateValue(`POLYGON((${coordinatesString}))`);
            }
        });
    };

    return (
        <MapContainer
            style={{ width: '100%', height: '100vh', ...styles }}
            center={markerPosition || jerusalemCoordinates}
            zoom={8}
            maxBounds={[
                [-90, -180],
                [90, 180],
            ]}
            maxBoundsViscosity={1}
        >
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Esri World Imagery">
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="OpenTopoMap">
                    <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
                </LayersControl.BaseLayer>

                <LayerGroup>
                    <FeatureGroup>
                        {markerPosition && (
                            <Marker position={markerPosition}>
                                <Popup>
                                    Coordinates: {markerPosition[0].toFixed(5)}, {markerPosition[1].toFixed(5)}
                                </Popup>
                            </Marker>
                        )}

                        {polygonPosition && (
                            <Polygon positions={polygonPosition}>
                                <Popup>
                                    Coordinates:{' '}
                                    {polygonPosition.map((location) => `[${location[0].toFixed(5)},${location[1].toFixed(5)}]`).join(', ')}
                                </Popup>
                            </Polygon>
                        )}

                        <EditControl
                            position="topright"
                            draw={{
                                rectangle: false,
                                circlemarker: false,
                                circle: false,
                                polygon: !markerPosition,
                                polyline: false,
                                marker: !polygonPosition, // Allow adding a marker only if one is not already set
                            }}
                            edit={{
                                edit: defaultLocation ? {} : false, // Enable editing of existing markers
                                remove: false,
                            }}
                            onCreated={(e) => {
                                const { layer } = e;
                                if (layer instanceof L.Marker) {
                                    handleMarkerCreate(e);
                                } else if (layer instanceof L.Polygon) {
                                    handlePolygonCreate(e);
                                }
                            }}
                            onEdited={(e) => {
                                e.layers.eachLayer((layer) => {
                                    if (layer instanceof L.Marker) {
                                        handleMarkerEdit(e);
                                    } else if (layer instanceof L.Polygon) {
                                        handlePolygonEdit(e);
                                    }
                                });
                            }}
                        />
                    </FeatureGroup>
                </LayerGroup>
            </LayersControl>
        </MapContainer>
    );
};

export default AddLocationField;
