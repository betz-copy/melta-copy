import React, { useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer, Polygon } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPopup } from './CustomMapPopup';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { parsePolygon, polygonStyle } from '../../utils/map';

type Props = {
    properties: Record<string, any>;
    entityTemplate: IMongoEntityTemplatePopulated;
    darkMode: boolean;
    styles?: React.CSSProperties;
};

const jerusalemCoordinates: LatLngExpression = [31.7683, 35.2137]; // default coordinates

const Map = ({ styles, properties, entityTemplate, darkMode }: Props) => {
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
                    const position = properties[key].split(',').map((val: string) => +val);
                    markerList.push({ key, position });
                    latLngList.push(position as LatLngExpression);
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
            maxBoundsViscosity={1}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {polygons.map(({ key, positions }) => (
                <Polygon key={key} positions={positions} pathOptions={polygonStyle(darkMode)} />
            ))}
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
                    <MapPopup header={propertyDefinitions[key].title} properties={properties} entityTemplate={entityTemplate} darkMode={darkMode} />
                </Marker>
            ))}
        </MapContainer>
    );
};

export default Map;
