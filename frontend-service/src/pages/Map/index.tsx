import React, { useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPopup } from './CustomMapPopup';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

type props = {
    properties: Record<string, any>;
    entityTemplate: IMongoEntityTemplatePopulated;
    darkMode: boolean;
    styles?: React.CSSProperties;
};

const jerusalemCoordinates: LatLngExpression = [31.7683, 35.2137]; // default coordinates

const Map = ({ styles, properties, entityTemplate, darkMode }: props) => {
    const markerRefs = useRef<{ [key: string]: L.Marker }>({});

    const locationsObject: Record<string, LatLngExpression> = useMemo(
        () =>
            properties
                ? Object.keys(properties)
                      .filter((key) => key.includes('location'))
                      .reduce(
                          (acc, key) => ({
                              ...acc,
                              [key]: properties[key].split(',').map((val) => +val),
                          }),
                          {},
                      )
                : {},
        [properties],
    );

    const bounds = useMemo(() => L.latLngBounds(Object.values(locationsObject)), [locationsObject]);

    return (
        <MapContainer
            style={{ width: '100%', height: '100vh', ...styles }}
            bounds={bounds.isValid() ? bounds : undefined}
            center={bounds.isValid() ? undefined : jerusalemCoordinates}
            zoom={bounds.isValid() ? undefined : 8}
            maxBoundsViscosity={1}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {entityTemplate &&
                Object.entries(locationsObject).map(([key, value]) => (
                    <Marker
                        key={key}
                        position={value}
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
                            header={entityTemplate.properties.properties[key].title}
                            properties={properties}
                            entityTemplate={entityTemplate}
                            darkMode={darkMode}
                        />
                    </Marker>
                ))}
        </MapContainer>
    );
};

export default Map;
