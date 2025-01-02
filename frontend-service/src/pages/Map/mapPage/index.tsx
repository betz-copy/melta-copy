import React, { useRef, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import { Box } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { jerusalemCoordinates } from '../../../utils/map';
import { IEntity } from '../../../interfaces/entities';
import MapPageEntityDialog from './MapPageEntityDialog';
import { EditableMapControl } from './MapControl';
import MapFilters from './MapFilters';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { BackendConfigState } from '../../../services/backendConfigService';

export const BaseLayers = () => {
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    if (!config) return <>{i18next.t('location.noLayers')}</>;

    const { mapLayers } = config;

    return (
        <>
            {Object.entries(mapLayers).map(([name, url]) => (
                <LayersControl.BaseLayer checked name={name} key={name}>
                    <TileLayer url={url} />
                </LayersControl.BaseLayer>
            ))}
        </>
    );
};

const MapPage = () => {
    const queryClient = useQueryClient();
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);

    const featureGroupRef = useRef<L.FeatureGroup | null>(null);
    const searchResultGroupRef = useRef<L.FeatureGroup | null>(null);
    const searchedEntityGroupRef = useRef<L.FeatureGroup | null>(null);

    const [selectedEntity, setSelectedEntity] = useState<{ node: IEntity; matchingField: string } | null>(null);
    const [selectedTemplates, setSelectedTemplates] = useState<IMongoEntityTemplatePopulated[]>([]);

    const [searchedEntity, setSearchedEntity] = useState<IEntity>();

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
                    <BaseLayers />
                </LayersControl>

                {/* Feature Group for Draw Controls */}
                <FeatureGroup ref={featureGroupRef}>
                    <EditableMapControl
                        featureGroupRef={featureGroupRef}
                        searchResultGroupRef={searchResultGroupRef}
                        searchedEntityGroupRef={searchedEntityGroupRef}
                        onSelectEntity={setSelectedEntity}
                        filteredTemplatesIds={selectedTemplates.map(({ _id }) => _id)}
                        searchedEntity={searchedEntity}
                        entityTemplateMap={entityTemplateMap!}
                    />
                </FeatureGroup>

                <FeatureGroup ref={searchResultGroupRef} />

                <FeatureGroup ref={searchedEntityGroupRef} />

                <MapFilters
                    selectedTemplates={selectedTemplates}
                    setSelectedTemplates={setSelectedTemplates}
                    moveToEntityLocations={(entity: IEntity) => setSearchedEntity(entity)}
                    entityTemplateMap={entityTemplateMap!}
                />
            </MapContainer>
            {selectedEntity && (
                <MapPageEntityDialog open={!!selectedEntity} entityWithMatchingField={selectedEntity} onClose={() => setSelectedEntity(null)} />
            )}
        </Box>
    );
};

export default MapPage;
