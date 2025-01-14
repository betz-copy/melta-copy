import React from 'react';
import { MapContainer, Marker, Polygon, LayersControl, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { CRS } from 'leaflet';
import { IMongoEntityTemplatePopulated } from '@microservices/shared-interfaces';
import EntityLocationPopup from './EntityLocationPopup';
import { jerusalemCoordinates, UpdateMapBounds } from '../../utils/map';
import { useEntityWithLocationFields } from '../../utils/hooks/useLocation';
import { useDarkModeStore } from '../../stores/darkMode';
import { BaseLayers } from './mapPage';

type Props = {
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    styles?: React.CSSProperties;
};

const LocationPreview = ({ styles, entity, entityTemplate }: Props) => {
    const { bounds, polygons, propertyDefinitions, markers } = useEntityWithLocationFields({ entityTemplate, entity });
    const darkMode = useDarkModeStore((state) => state.darkMode);

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
            crs={CRS.EPSG3857}
        >
            {(polygons.length > 0 || markers.length > 0) && <UpdateMapBounds bounds={bounds} />}

            <LayersControl position="topright">
                <BaseLayers />

                {/* Overlay Layers */}
                <LayersControl.Overlay checked name="Polygons">
                    <LayerGroup>
                        {polygons.map(({ key, position }) => (
                            <Polygon key={key} positions={position}>
                                <EntityLocationPopup header={propertyDefinitions[key].title} value={entity.properties[key]} darkMode={darkMode} />
                            </Polygon>
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Markers">
                    <LayerGroup>
                        {markers.map(({ key, position }) => (
                            <Marker key={key} position={position}>
                                <EntityLocationPopup header={propertyDefinitions[key].title} value={entity.properties[key]} darkMode={darkMode} />
                            </Marker>
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>
            </LayersControl>
        </MapContainer>
    );
};

export default LocationPreview;
