import React, { useState } from 'react';
import { MapContainer, TileLayer, LayersControl, LayerGroup, FeatureGroup, Marker, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { stringToCoordinates } from '../../utils/map';

type Props = {
    defaultLocation?: string;
    styles?: React.CSSProperties;
    updateValue: (newValue: string) => void;
};

const jerusalemCoordinates: LatLngExpression = [31.7683, 35.2137];

const AddMapField = ({ defaultLocation, styles, updateValue }: Props) => {
    const initialCoordinates = defaultLocation ? stringToCoordinates(defaultLocation) : null;
    const [markerPosition, setMarkerPosition] = useState<LatLngExpression | null>(initialCoordinates);

    const handleMarkerEdit = (e: L.DrawEvents.Edited) => {
        e.layers.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                const { lat, lng } = layer.getLatLng();
                setMarkerPosition([lat, lng]);
                updateValue([[lat, lng]].toString());
            }
        });
    };

    const handleMarkerCreate = (e: L.DrawEvents.Created) => {
        const { layer } = e;
        if (layer instanceof L.Marker) {
            const { lat, lng } = layer.getLatLng();
            setMarkerPosition([lat, lng]);
            updateValue([[lat, lng]].toString());
        }
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

                        <EditControl
                            position="topright"
                            draw={{
                                rectangle: false,
                                circlemarker: false,
                                circle: false,
                                polygon: false,
                                polyline: false,
                                marker: !markerPosition, // Allow adding a marker only if one is not already set
                            }}
                            edit={{
                                edit: defaultLocation ? {} : false, // Enable editing of existing markers
                                remove: false,
                            }}
                            onCreated={handleMarkerCreate}
                            onEdited={handleMarkerEdit}
                        />
                    </FeatureGroup>
                </LayerGroup>
            </LayersControl>
        </MapContainer>
    );
};

export default AddMapField;
