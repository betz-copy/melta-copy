import React, { useRef, useState } from 'react';
import { Cartesian3, Color } from 'cesium';
import { Viewer, Entity, PolygonGraphics, PointGraphics, CesiumMovementEvent, GeoJsonDataSource } from 'resium';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Delete, LocationOn, ShapeLine } from '@mui/icons-material';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IEntity } from '../../../../interfaces/entities';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import IconButtonWithPopover from '../../../../common/IconButtonWithPopover';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { cartesian3ToString } from '../../../../utils/map';

type Props = {
    edit?: { defaultLocation?: string; field: string; updateValue: (newValue: string) => void };
    preview?: { entity: IEntity; entityTemplate: IMongoEntityTemplatePopulated };
};

const LocationField = ({ edit, preview }: Props) => {
    const [polygonPosition, setPolygonPosition] = useState<Cartesian3[]>([]);
    const [markerPosition, setMarkerPosition] = useState<Cartesian3 | null>(null);
    const [drawingMode, setDrawingMode] = useState<'polygon' | 'coordinate' | null>(null);
    const viewerRef = useRef<any>(null);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const handleViewerClick = (clickEvent: CesiumMovementEvent) => {
        if (!edit) return;
        if (drawingMode === null || !clickEvent.position) return;

        const viewer = viewerRef.current?.cesiumElement;

        if (!viewer) return;
        const { scene } = viewer;
        const cartesian = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

        if (cartesian) {
            if (drawingMode === 'polygon') {
                setPolygonPosition((prev) => [...prev, cartesian]);
                const newPolygon = [...polygonPosition, cartesian];
                edit.updateValue(cartesian3ToString(newPolygon));
            } else if (drawingMode === 'coordinate') {
                setMarkerPosition(cartesian);
                setDrawingMode(null);
                edit.updateValue(cartesian3ToString(cartesian));
            }
        }
    };

    const clearPolygon = () => {
        setPolygonPosition([]);
        setMarkerPosition(null);
        setDrawingMode(null);
    };

    const handleDrawType = (_event: React.MouseEvent<HTMLElement>, newShape: 'polygon' | 'coordinate' | null) => {
        setDrawingMode(newShape);
    };

    return (
        <div style={{ position: 'relative', height: '800px', width: '600px' }}>
            <Viewer full ref={viewerRef} id="cesiumContainer" onClick={handleViewerClick}>
                {polygonPosition.length >= 3 && (
                    <Entity
                        name={edit ? edit.field : preview!.entityTemplate.displayName}
                        description={`${i18next.t('location.polygon')}: ${polygonPosition}`}
                    >
                        <PolygonGraphics hierarchy={polygonPosition} material={Color.fromAlpha(Color.BLUE, 0.5)} />
                    </Entity>
                )}

                {markerPosition && (
                    <Entity
                        name={edit ? edit.field : preview!.entityTemplate.displayName}
                        description={`${i18next.t('location.coordinate')}: ${markerPosition}`}
                        position={markerPosition}
                    >
                        {/* <GeoJsonDataSource
                            data={{
                                type: 'Feature',
                                properties: preview?.entity.properties,
                                geometry: { type: 'Point', coordinates: [markerPosition.x, markerPosition.y] },
                            }}
                        /> */}
                        <PointGraphics color={Color.RED} pixelSize={10} />
                    </Entity>
                )}
            </Viewer>
            {edit && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '10px' }}>
                    {polygonPosition.length === 0 && markerPosition === null && (
                        <ToggleButtonGroup value={drawingMode} exclusive onChange={handleDrawType} style={{ background: 'white', height: '34px' }}>
                            <MeltaTooltip title={i18next.t('location.coordinate')}>
                                <ToggleButton value="coordinate" disabled={polygonPosition.length > 0}>
                                    <LocationOn sx={{ width: '20px', height: '20px' }} />
                                </ToggleButton>
                            </MeltaTooltip>
                            <MeltaTooltip title={i18next.t('location.polygon')}>
                                <ToggleButton value="polygon" disabled={markerPosition !== null}>
                                    <ShapeLine sx={{ width: '20px', height: '20px' }} />
                                </ToggleButton>
                            </MeltaTooltip>
                        </ToggleButtonGroup>
                    )}

                    <IconButtonWithPopover
                        popoverText={i18next.t('location.clear')}
                        iconButtonProps={{
                            onClick: clearPolygon,
                        }}
                        style={{
                            background: darkMode ? '#131313' : '#FFFFFF',
                            borderRadius: '7px',
                            height: '34px',
                            opacity: 1,
                        }}
                    >
                        <Delete htmlColor={darkMode ? '#9398c2' : '#787c9e'} />
                    </IconButtonWithPopover>
                </div>
            )}
        </div>
    );
};

export default LocationField;
