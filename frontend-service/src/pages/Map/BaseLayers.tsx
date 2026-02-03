import { WmtsLayer } from '@camptocamp/ogc-client';
import { LayersTwoTone } from '@mui/icons-material';
import { Box, Divider, FormControlLabel, Grid, IconButton, Radio, RadioGroup, Typography, useTheme } from '@mui/material';
import * as Cesium from 'cesium';
import i18next from 'i18next';
import React, { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { CesiumComponentRef } from 'resium';
import MeltaCheckbox from '../../common/MeltaDesigns/MeltaCheckbox';
import MeltaTooltip from '../../common/MeltaDesigns/MeltaTooltip';
import { BackendConfigState } from '../../services/backendConfigService';
import { getMatrixSet } from '../../utils/map';

export enum LayerProviderType {
    map = 'map',
    text = 'text',
}

export type LayerProvider = {
    id: string;
    url: string;
    cesiumUrl: string;
    type: LayerProviderType;
    displayName?: string;
};

export const BaseLayers: React.FC<{
    viewerRef: RefObject<CesiumComponentRef<Cesium.Viewer> | null>;
    config: BackendConfigState;
}> = ({ viewerRef, config: { mapLayers, textLayers, isOutsideDevelopment, getMapLayers } }) => {
    const theme = useTheme();

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const queryClient = useQueryClient();

    const layers = queryClient.getQueryData<(LayerProvider & WmtsLayer)[]>('getMapLayers');

    const providers = useMemo<((LayerProvider & WmtsLayer) | LayerProvider)[]>(() => {
        const buildLayerProvider = (outsideLayers: Record<string, string>, type: LayerProviderType) => {
            if (isOutsideDevelopment)
                return Object.entries(outsideLayers).map(([id, url]) => ({
                    id,
                    url,
                    type,
                    cesiumUrl: '',
                }));

            return layers?.filter((layer) => layer.type === type) ?? [];
        };

        return [...buildLayerProvider(mapLayers, LayerProviderType.map), ...buildLayerProvider(textLayers, LayerProviderType.text)];
    }, [mapLayers, textLayers, layers, isOutsideDevelopment]);

    const [activeMapLayer, setActiveMapLayer] = useState<string>(providers.find((p) => p.type === LayerProviderType.map)?.id || '');
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
            (layer) =>
                (layer.type === LayerProviderType.map && layer.id === activeMapLayer) ||
                (layer.type === LayerProviderType.text && activeTextLayers.has(layer.id)),
        );

        if (isOutsideDevelopment)
            activeLayers.forEach((layer) => {
                viewer.imageryLayers.addImageryProvider(
                    new Cesium.UrlTemplateImageryProvider({
                        url: layer.url,
                        tilingScheme: undefined,
                    }),
                );
            });
        else
            (activeLayers as (LayerProvider & WmtsLayer)[])?.forEach((layer) => {
                viewer.imageryLayers.addImageryProvider(
                    new Cesium.WebMapTileServiceImageryProvider({
                        url: new Cesium.Resource({ url: layer.cesiumUrl.split('?')[0], headers: { 'x-api-key': getMapLayers.token } }),
                        layer: layer.id,
                        style: layer.defaultStyle || 'default',
                        format: layer.resourceLinks.find((r) => r.format === 'image/jpeg')?.format ?? layer.resourceLinks[0].format,
                        tileMatrixSetID: getMatrixSet(layer.matrixSets).identifier,
                        tilingScheme: getMatrixSet(layer.matrixSets).tilingScheme,
                    }),
                );
            });
    }, [activeMapLayer, activeTextLayers, providers, viewerRef, isOutsideDevelopment, getMapLayers]);

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
                                        label={layer.displayName || layer.id}
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
                                    label={layer.displayName || layer.id}
                                    sx={{ display: 'flex', alignItems: 'center' }}
                                />
                            ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
};
