import React, { useEffect, useRef, useState } from 'react';
import { Cartesian3, Color, Ion } from 'cesium';
import { Viewer, Entity, PolygonGraphics, PointGraphics, CesiumMovementEvent, CameraFlyTo } from 'resium';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Delete, LocationOn, ShapeLine } from '@mui/icons-material';
import i18next from 'i18next';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import IconButtonWithPopover from '../../../../common/IconButtonWithPopover';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { cartesian3ToString, isCartesian3, resolveDestination, stringToCoordinates } from '../../../../utils/map';

type Props = {
    defaultLocation?: string;
    field: string;
    updateValue: (newValue: string) => void;
};

const LocationField = ({ defaultLocation, field, updateValue }: Props) => {
    Ion.defaultAccessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjZWI5M2EyNC1lODE3LTQwYTQtYTUxZi00NDlhODAyZDM0NTMiLCJpZCI6MjcwNDM5LCJpYXQiOjE3Mzc0NDk3MzN9.WLi4Zcm4D_PMstHcM3YNMJsw1xPhiNGuJyizwg_4nbg';

    const [polygonPosition, setPolygonPosition] = useState<Cartesian3[]>([]);
    const [markerPosition, setMarkerPosition] = useState<Cartesian3 | null>(null);
    const [drawingMode, setDrawingMode] = useState<'polygon' | 'coordinate' | null>(null);
    const viewerRef = useRef<any>(null);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    useEffect(() => {
        const initialCoordinates = defaultLocation ? stringToCoordinates(defaultLocation) : null;
        if (initialCoordinates?.type === 'marker') {
            const { value } = initialCoordinates;
            setMarkerPosition(
                !isCartesian3(value)
                    ? Cartesian3.fromDegrees((value as Cartesian3).x, (value as Cartesian3).y, 0)
                    : ({ ...value, z: 0 } as Cartesian3),
            );
        }
        if (initialCoordinates?.type === 'polygon') {
            const positions = (initialCoordinates.value as Cartesian3[]).map((position) =>
                !isCartesian3(position) ? Cartesian3.fromDegrees(position.x, position.y, position.x) : position,
            );
            setPolygonPosition(positions);
        }
    }, []);

    const handleViewerClick = (clickEvent: CesiumMovementEvent) => {
        if (drawingMode === null || !clickEvent.position) return;

        const viewer = viewerRef.current?.cesiumElement;

        if (!viewer) return;
        const { scene } = viewer;
        const cartesian = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

        if (cartesian) {
            if (drawingMode === 'polygon') {
                setPolygonPosition((prev) => [...prev, cartesian]);
                const newPolygon = [...polygonPosition, cartesian];
                updateValue(cartesian3ToString(newPolygon));
            } else if (drawingMode === 'coordinate') {
                setMarkerPosition(cartesian);
                setDrawingMode(null);
                updateValue(cartesian3ToString(cartesian));
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
                <CameraFlyTo duration={0} destination={resolveDestination(drawingMode, polygonPosition, markerPosition)} />
                {polygonPosition.length >= 3 && (
                    <Entity name={field} description={`${i18next.t('location.polygon')}: ${polygonPosition}`}>
                        <PolygonGraphics hierarchy={polygonPosition} material={Color.fromAlpha(Color.BLUE, 0.5)} />
                    </Entity>
                )}

                {markerPosition && (
                    <Entity
                        name={field}
                        description={`${i18next.t('location.coordinate')}: ${cartesian3ToString(markerPosition)}`}
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
            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '10px' }}>
                {polygonPosition.length === 0 && markerPosition === null && (
                    <ToggleButtonGroup
                        value={drawingMode}
                        exclusive
                        onChange={handleDrawType}
                        style={{ background: darkMode ? '#121212' : 'white', height: '34px' }}
                    >
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
        </div>
    );
};

export default LocationField;
