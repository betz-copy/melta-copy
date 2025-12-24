import { LayersTwoTone } from '@mui/icons-material';
import { Box, Divider, FormControlLabel, Grid, IconButton, Radio, RadioGroup, Typography, useTheme } from '@mui/material';
import * as Cesium from 'cesium';
import i18next from 'i18next';
import React, { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { CesiumComponentRef } from 'resium';
import MeltaCheckbox from '../../common/MeltaDesigns/MeltaCheckbox';
import MeltaTooltip from '../../common/MeltaDesigns/MeltaTooltip';
import { BackendConfigState } from '../../services/backendConfigService';
import { useQuery } from 'react-query';
import { getMapLayer } from '../../services/mapService';

type LayerProvider = {
    id: string;
    url: string;
    type: 'map' | 'text';
};

export const BaseLayers: React.FC<{
    viewerRef: RefObject<CesiumComponentRef<Cesium.Viewer> | null>;
    config: BackendConfigState;
}> = ({ viewerRef, config }) => {
    const theme = useTheme();

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const { mapLayers, textLayers } = config;

    const providers = useMemo<LayerProvider[]>(() => {
        const mapLayerArray = Object.entries(mapLayers).map(([name, url]) => ({
            id: name,
            url,
            type: 'map' as const,
        }));
        const textLayerArray = Object.entries(textLayers).map(([name, url]) => ({
            id: name,
            url,
            type: 'text' as const,
        }));
        return [...mapLayerArray, ...textLayerArray];
    }, [mapLayers, textLayers]);

    const [activeMapLayer, setActiveMapLayer] = useState<string>(providers.find((p) => p.type === 'map')?.id || '');
    const [activeTextLayers, setActiveTextLayers] = useState<Set<string>>(new Set());

    const handleTextLayerToggle = useCallback((layerId: string) => {
        setActiveTextLayers((prev) => {
            const next = new Set(prev);
            if (next.has(layerId)) {
                next.delete(layerId);
            } else {
                next.add(layerId);
            }
            return next;
        });
    }, []);

    useEffect(() => {
        const viewer = viewerRef.current?.cesiumElement;
        if (!viewer) return;

        viewer.imageryLayers.removeAll();

        const activeLayers = providers.filter(
            (layer) => (layer.type === 'map' && layer.id === activeMapLayer) || (layer.type === 'text' && activeTextLayers.has(layer.id)),
        );

        activeLayers.forEach((layer) => {
            viewer.imageryLayers.addImageryProvider(
                new Cesium.UrlTemplateImageryProvider({
                    url: layer.url,
                    tilingScheme: config.isOutsideDevelopment ? undefined : new Cesium.GeographicTilingScheme(),
                }),
            );
        });
    }, [activeMapLayer, activeTextLayers, providers, viewerRef, config.isOutsideDevelopment]);

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 35,
                minHeight: 34,
                borderRadius: 1,
                bgcolor: 'background.paper',
            }}
        >
            <MeltaTooltip title={i18next.t('location.layers.map')}>
                <IconButton size="small" onClick={() => setIsOpen((prev) => !prev)} sx={{ zIndex: 1001 }}>
                    <LayersTwoTone
                        sx={{
                            height: 20,
                            borderRadius: 7,
                            color: theme.palette.primary.main,
                        }}
                    />
                </IconButton>
            </MeltaTooltip>

            {isOpen && (
                <Box
                    component={Grid}
                    container
                    gap={2}
                    direction="column"
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        marginTop: 1,
                        minWidth: 250,
                        maxWidth: 300,
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        boxShadow: 2,
                        zIndex: 1000,
                        right: 0,
                    }}
                >
                    <Grid>
                        <Typography variant="subtitle1">{i18next.t('location.layers.map')}</Typography>
                        <RadioGroup value={activeMapLayer} onChange={(e) => setActiveMapLayer(e.target.value)}>
                            {providers
                                .filter((provider) => provider.type === 'map')
                                .map((layer) => (
                                    <FormControlLabel
                                        key={layer.id}
                                        control={<Radio checked={activeMapLayer === layer.id} value={layer.id} />}
                                        label={layer.id}
                                        sx={{ display: 'flex', alignItems: 'center' }}
                                    />
                                ))}
                        </RadioGroup>
                    </Grid>
                    <Divider />
                    <Grid>
                        <Typography variant="subtitle1">{i18next.t('location.layers.overlay')}</Typography>
                        {providers
                            .filter((provider) => provider.type === 'text')
                            .map((layer) => (
                                <FormControlLabel
                                    key={layer.id}
                                    control={
                                        <MeltaCheckbox checked={activeTextLayers.has(layer.id)} onChange={() => handleTextLayerToggle(layer.id)} />
                                    }
                                    label={layer.id}
                                    sx={{ display: 'flex', alignItems: 'center' }}
                                />
                            ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
};
