import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, LayerGroup, FeatureGroup, Marker, Popup, Polygon } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';
import { bindPopupForMarker, bindPopupForPolygon, jerusalemCoordinates, latLngToString, stringToCoordinates } from '../../utils/map';

type Props = {
    defaultLocation?: string;
    styles?: React.CSSProperties;
    updateValue: (newValue: string) => void;
};

const LocationField = ({ defaultLocation, styles, updateValue }: Props) => {
    const [markerPosition, setMarkerPosition] = useState<LatLng | null>(null);
    const [polygonPosition, setPolygonPosition] = useState<LatLng[] | null>(null);

    useEffect(() => {
        const initialCoordinates = defaultLocation ? stringToCoordinates(defaultLocation) : null;
        if (initialCoordinates?.type === 'marker') {
            setMarkerPosition(initialCoordinates.value as LatLng);
        }
        if (initialCoordinates?.type === 'polygon') {
            setPolygonPosition(initialCoordinates.value as LatLng[]);
        }
    }, []);

    const handleLayerCreate = (e: L.DrawEvents.Created) => {
        const { layer } = e;
        if (layer instanceof L.Marker) {
            const latLng = layer.getLatLng();
            setMarkerPosition(latLng);
            updateValue(latLngToString(latLng));
        } else if (layer instanceof L.Polygon) {
            const latLngs = layer.getLatLngs()[0] as LatLng[];
            setPolygonPosition(latLngs);
            updateValue(latLngToString(latLngs));
        }
    };

    const handleLayerEdit = (e: L.DrawEvents.Edited) => {
        e.layers.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                const latLng = layer.getLatLng();
                setMarkerPosition(latLng);
                updateValue(latLngToString(latLng));
            } else if (layer instanceof L.Polygon) {
                const latLngs = layer.getLatLngs()[0] as LatLng[];
                setPolygonPosition(latLngs);
                updateValue(latLngToString(latLngs));
            }
        });
    };

    const bounds = useMemo(() => {
        if (polygonPosition) {
            return L.latLngBounds(polygonPosition);
        }
        return null;
    }, [polygonPosition]);

    return (
        <MapContainer
            style={{ width: '100%', height: '100vh', ...styles }}
            bounds={bounds?.isValid() ? bounds : undefined}
            center={!bounds?.isValid() ? markerPosition || jerusalemCoordinates : undefined}
            zoom={!bounds?.isValid() ? 8 : undefined}
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
                                <Popup>{bindPopupForMarker(markerPosition)}</Popup>
                            </Marker>
                        )}

                        {polygonPosition && (
                            <Polygon positions={polygonPosition}>
                                <Popup>{bindPopupForPolygon(polygonPosition)}</Popup>
                            </Polygon>
                        )}

                        <EditControl
                            position="topright"
                            draw={{
                                rectangle: false,
                                circlemarker: false,
                                circle: false,
                                polyline: false,
                                polygon: !markerPosition && !polygonPosition, // enabling creation of layers only if none exist
                                marker: !markerPosition && !polygonPosition,
                            }}
                            edit={{
                                edit: defaultLocation ? {} : false, // Enable editing of existing layers only if exist
                                remove: false,
                            }}
                            onCreated={handleLayerCreate}
                            onEdited={handleLayerEdit}
                        />
                    </FeatureGroup>
                </LayerGroup>
            </LayersControl>
        </MapContainer>
    );
};

export default LocationField;
