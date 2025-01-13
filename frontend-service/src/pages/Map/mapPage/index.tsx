import React, { useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L, { CRS } from 'leaflet';
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

export const BaseLayers: React.FC = () => {
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    if (!config) return <>{i18next.t('location.noLayers')}</>;

    const { mapLayers, textLayers } = config;

    return (
        <>
            {Object.entries(mapLayers).map(([name, url], index) => (
                <LayersControl.BaseLayer checked={index === 0} name={name} key={name}>
                    <TileLayer url={url} />
                </LayersControl.BaseLayer>
            ))}

            {Object.entries(textLayers).map(([name, url]) => (
                <LayersControl.Overlay checked name={`${name}`} key={`${name}`}>
                    <TileLayer url={url} />
                </LayersControl.Overlay>
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

    const filteredTemplatesIds = useMemo(() => selectedTemplates.map(({ _id }) => _id), [selectedTemplates]);
    const onClear = () => {
        featureGroupRef.current?.eachLayer((layer) => layer.remove());
        searchResultGroupRef.current?.eachLayer((layer) => layer.remove());
        searchedEntityGroupRef.current?.eachLayer((layer) => layer.remove());
    };

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
                crs={CRS.EPSG3857}
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
                        filteredTemplatesIds={filteredTemplatesIds}
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
                    onClear={onClear}
                />
            </MapContainer>
            {selectedEntity && (
                <MapPageEntityDialog open={!!selectedEntity} entityWithMatchingField={selectedEntity} onClose={() => setSelectedEntity(null)} />
            )}
        </Box>
    );
};

export default MapPage;
