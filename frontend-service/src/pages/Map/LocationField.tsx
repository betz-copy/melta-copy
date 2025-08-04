/* eslint-disable react-hooks/exhaustive-deps */
import { Place, Polyline } from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import * as Cesium from 'cesium';
import { Cartesian3 } from 'cesium';
import i18next from 'i18next';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { CesiumMovementEvent, Viewer } from 'resium';
import MeltaTooltip from '../../common/MeltaDesigns/MeltaTooltip';
import { BackendConfigState } from '../../services/backendConfigService';
import { useDarkModeStore } from '../../stores/darkMode';
import {
    calculateCenterOfPolygon,
    getPolygonFarthestPoint,
    isValidPolygonPoint,
    jerusalemCoordinates,
    locationToWGS84String,
    stringToCoordinates,
} from '../../utils/map';
import { convertWGS94ToECEF, isValidWGS84 } from '../../utils/map/convert';
import { BaseLayers } from './BaseLayers';
import { MeltaCoordinate, MeltaPolygon } from './LocationPreview';
import { DeleteMapDataBtn } from './mapPage/MapFilters';

type Props = {
    defaultLocation?: string;
    field: string;
    updateValue: (newValue: string | undefined) => void;
};

const LocationField = ({ defaultLocation, field, updateValue }: Props) => {
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    const viewerRef = useRef<any>(null);

    const [drawingMode, setDrawingMode] = useState<'polygon' | 'coordinate' | null>(null);
    const [polygonPosition, setPolygonPosition] = useState<Cartesian3[]>([]);
    const [markerPosition, setMarkerPosition] = useState<Cartesian3 | null>(null);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    useEffect(() => {
        const initialCoordinates = defaultLocation ? stringToCoordinates(defaultLocation) : null;

        if (initialCoordinates?.type === 'marker') {
            const { value } = initialCoordinates;
            setMarkerPosition(isValidWGS84(value as Cartesian3) ? (convertWGS94ToECEF(value) as Cartesian3) : ({ ...value } as Cartesian3));
        }

        if (initialCoordinates?.type === 'polygon') {
            const positions = (initialCoordinates.value as Cartesian3[]).map((position) =>
                isValidWGS84(position) ? (convertWGS94ToECEF(position) as Cartesian3) : position,
            );
            setPolygonPosition(positions);
        }
    }, []);

    useEffect(() => {
        const animateCamera = () => {
            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;
            const { camera } = viewer;

            if (markerPosition !== null) {
                const radius = 30000;
                const boundingSphere = new Cesium.BoundingSphere(markerPosition, radius);

                camera.flyToBoundingSphere(boundingSphere, {
                    duration: 1.5,
                    offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), radius * 2.5),
                });
            } else if (polygonPosition.length > 0) {
                if (drawingMode == null) {
                    const center = calculateCenterOfPolygon(polygonPosition);
                    const radius = getPolygonFarthestPoint(center, polygonPosition);
                    const boundingSphere = new Cesium.BoundingSphere(center, radius);

                    camera.flyToBoundingSphere(boundingSphere, {
                        duration: 1.5,
                        offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), radius * 2.5),
                    });
                }
            } else {
                camera.flyTo({
                    destination: jerusalemCoordinates,
                    duration: 1.5,
                });
            }
        };

        const animationFrameId = requestAnimationFrame(animateCamera);
        return () => cancelAnimationFrame(animationFrameId);
    }, [markerPosition, polygonPosition]);

    const handleViewerClick = useCallback(
        (clickEvent: CesiumMovementEvent) => {
            if (drawingMode === null || !clickEvent.position) return;

            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const { scene } = viewer;
            const cartesian: Cartesian3 = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

            if (cartesian) {
                if (drawingMode === 'polygon') {
                    if (isValidPolygonPoint(polygonPosition, cartesian)) {
                        setPolygonPosition((prev) => [...prev, cartesian]);
                        const newPolygon = [...polygonPosition, cartesian];
                        updateValue(locationToWGS84String(newPolygon));
                    }
                } else if (drawingMode === 'coordinate') {
                    setMarkerPosition(cartesian);
                    setDrawingMode(null);
                    updateValue(locationToWGS84String(cartesian));
                }
            }
        },
        [drawingMode, viewerRef, polygonPosition, setPolygonPosition, setMarkerPosition, setDrawingMode, updateValue],
    );

    const onClear = () => {
        setPolygonPosition([]);
        setMarkerPosition(null);
        setDrawingMode(null);
        updateValue(undefined);
    };

    const handleDrawType = (_event: React.MouseEvent<HTMLElement>, newShape: 'polygon' | 'coordinate' | null) => {
        setDrawingMode(newShape);
    };

    return (
        <div style={{ position: 'relative', height: '800px', width: '600px' }}>
            <Viewer
                full
                ref={viewerRef}
                onClick={handleViewerClick}
                baseLayerPicker={false}
                animation={false}
                timeline={false}
                geocoder={false}
                homeButton={false}
                sceneModePicker={false}
                vrButton={false}
                fullscreenButton={false}
                navigationHelpButton={false}
            >
                {polygonPosition.length > 0 && <MeltaPolygon name={field} polygon={polygonPosition} />}
                {markerPosition && <MeltaCoordinate name={field} position={markerPosition} />}

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
                                    <Place sx={{ width: '20px', height: '20px', color: darkMode ? '#9398c2' : '#787c9e' }} />
                                </ToggleButton>
                            </MeltaTooltip>
                            <MeltaTooltip title={i18next.t('location.polygon')}>
                                <ToggleButton value="polygon" disabled={markerPosition !== null}>
                                    <Polyline sx={{ width: '20px', height: '20px', color: darkMode ? '#9398c2' : '#787c9e' }} />
                                </ToggleButton>
                            </MeltaTooltip>
                        </ToggleButtonGroup>
                    )}
                    <DeleteMapDataBtn onClick={onClear} darkMode={darkMode} />

                    {config && <BaseLayers viewerRef={viewerRef} config={config} />}
                </div>
            </Viewer>
        </div>
    );
};

export default LocationField;
