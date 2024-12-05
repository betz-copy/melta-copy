import React, { useRef, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import { Box } from '@mui/material';
import { jerusalemCoordinates } from '../../../utils/map';
import { IEntity } from '../../../interfaces/entities';
import MapPageEntityDialog from './MapPageEntityDialog';
import { EditableMapControl } from './MapControl';
import MapFilters from './MapFilters';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

const MapPage = () => {
    const featureGroupRef = useRef<L.FeatureGroup | null>(null);
    const searchResultGroupRef = useRef<L.FeatureGroup | null>(null);
    const lastCircleRef = useRef<L.Circle | null>(null);

    const [selectedEntity, setSelectedEntity] = useState<{ node: IEntity; field: string } | null>(null);

    const [selectedTemplates, setSelectedTemplates] = useState<IMongoEntityTemplatePopulated[]>([]);
    const [searchValue, setSearchValue] = useState('');

    return (
        <Box position="relative" width="100%" height="100vh">
            <MapContainer
                style={{ width: '100%', height: '100vh' }}
                center={jerusalemCoordinates}
                zoom={8}
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
                </LayersControl>

                {/* Feature Group for Draw Controls */}
                <FeatureGroup ref={featureGroupRef}>
                    <EditableMapControl
                        featureGroupRef={featureGroupRef}
                        searchResultGroupRef={searchResultGroupRef}
                        lastCircleRef={lastCircleRef}
                        onSelectEntity={setSelectedEntity}
                        filteredTemplatesIds={selectedTemplates.map(({ _id }) => _id)}
                    />
                </FeatureGroup>

                <FeatureGroup ref={searchResultGroupRef} />

                <MapFilters
                    searchValue={searchValue}
                    selectedTemplates={selectedTemplates}
                    setSearchValue={setSearchValue}
                    setSelectedTemplates={setSelectedTemplates}
                />
            </MapContainer>
            {selectedEntity && (
                <MapPageEntityDialog open={!!selectedEntity} entityWithMatchingField={selectedEntity} onClose={() => setSelectedEntity(null)} />
            )}
        </Box>
    );
};

export default MapPage;
