/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, LayersControl, LayerGroup, FeatureGroup, Marker, Popup, Polygon } from 'react-leaflet';
import L, { CRS, LatLng } from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';
import { bindPopupForMarker, bindPopupForPolygon, jerusalemCoordinates, latLngToString, stringToCoordinates, UpdateMapBounds } from '../../utils/map';
import { BaseLayers } from './mapPage';
import { createSquareAroundPoint } from '../../utils/hooks/useLocation';
import { environment } from '../../globals';

const { squareLength } = environment.map;

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

    const handleLayerDelete = (e: L.DrawEvents.Deleted) => {
        e.layers.eachLayer((layer) => {
            let latlng;
            if (layer instanceof L.Marker) latlng = layer.getLatLng();
            else if (layer instanceof L.Polygon) {
                const bounds = layer.getBounds();
                latlng = [bounds.getCenter().lat, bounds.getCenter().lng];
            }

            if (markerPosition && latlng.lat === markerPosition.lat && latlng.lng === markerPosition.lng) setMarkerPosition(null);
            if (polygonPosition && polygonPosition.some((pos) => pos.lat === latlng[0] && pos.lng === latlng[1])) setPolygonPosition(null);

            layer.remove();
        });
        updateValue('');
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
        if (polygonPosition) return L.latLngBounds(polygonPosition);
        if (markerPosition) return L.latLngBounds(createSquareAroundPoint(markerPosition as L.LatLngExpression, squareLength));

        return null;
    }, [polygonPosition, markerPosition]);

    return (
        <MapContainer
            style={{ width: '100%', height: '100vh', ...styles }}
            bounds={bounds?.isValid() ? bounds : undefined}
            center={!bounds?.isValid() ? markerPosition || jerusalemCoordinates : undefined}
            zoom={!bounds?.isValid() ? 8 : undefined}
            maxBoundsViscosity={1}
            maxBounds={[
                [-90, -180],
                [90, 180],
            ]}
            crs={CRS.EPSG3857}
        >
            <UpdateMapBounds bounds={bounds} />

            <LayersControl position="topright">
                <BaseLayers />
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
                            key={`${markerPosition ? 'marker' : ''}-${polygonPosition ? 'polygon' : ''}`}
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
                                remove: true,
                            }}
                            onCreated={handleLayerCreate}
                            onEdited={handleLayerEdit}
                            onDeleted={handleLayerDelete}
                        />
                    </FeatureGroup>
                </LayerGroup>
            </LayersControl>
        </MapContainer>
    );
};

export default LocationField;
