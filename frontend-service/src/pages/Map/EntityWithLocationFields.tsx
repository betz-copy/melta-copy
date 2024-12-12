import React from 'react';
import { MapContainer, Marker, TileLayer, Polygon, LayersControl, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import EntityPopup from './EntityPopup';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { jerusalemCoordinates, UpdateMapBounds } from '../../utils/map';
import { IEntity } from '../../interfaces/entities';
import { useEntityWithLocationFields } from '../../utils/hooks/useLocation';

type Props = {
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    darkMode: boolean;
    styles?: React.CSSProperties;
};

const EntityWithLocationFields = ({ styles, entity, entityTemplate, darkMode }: Props) => {
    const { bounds, polygons, propertyDefinitions, markers } = useEntityWithLocationFields({ entityTemplate, entity });

    return (
        <MapContainer
            style={{ width: '100%', height: '100vh', ...styles }}
            bounds={bounds?.isValid() ? bounds : undefined}
            center={!bounds?.isValid() ? jerusalemCoordinates : undefined}
            zoom={!bounds?.isValid() ? 8 : undefined}
            maxBoundsViscosity={1}
            maxBounds={[
                [-90, -180],
                [90, 180],
            ]}
        >
            <UpdateMapBounds bounds={bounds} />

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
                        {polygons.map(({ key, position }) => (
                            <Polygon key={key} positions={position}>
                                <EntityPopup
                                    header={propertyDefinitions[key].title}
                                    properties={entity.properties}
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
                            <Marker key={key} position={position}>
                                <EntityPopup
                                    header={propertyDefinitions[key].title}
                                    properties={entity.properties}
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
