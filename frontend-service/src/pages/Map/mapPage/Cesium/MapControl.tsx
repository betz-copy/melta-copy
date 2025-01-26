import * as Cesium from 'cesium';
import React, { useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Circle, LinearScale } from '@mui/icons-material';
import i18next from 'i18next';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';

const EditableMapControl = ({ viewer, handler, setHandler }: { viewer: Cesium.Viewer; handler; setHandler }) => {
    const [drawingMode, setDrawingMode] = useState<'circle' | 'line' | null>(null);
    const [center, setCenter] = useState<Cesium.Cartesian3 | null>(null);
    const [previewCircle, setPreviewCircle] = useState<Cesium.Entity | null>(null);

    const startDrawingCircle = () => {
        console.log('Circle drawing started');
        setDrawingMode('circle');

        if (handler) {
            handler.destroy();
        }

        const newHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        setHandler(newHandler);

        newHandler.setInputAction((event) => {
            console.log('Left click event triggered:', event);
            console.log({ center, newHandler, event });

            const ray = viewer.camera.getPickRay(event.position);
            const earthPosition = viewer.scene.globe.pick(ray!, viewer.scene);

            if (Cesium.defined(earthPosition)) {
                console.log({ center });

                if (!center) {
                    setCenter(earthPosition);
                    console.log('Center set:', earthPosition);
                } else {
                    const radius = Cesium.Cartesian3.distance(center, earthPosition);
                    console.log('Radius calculated:', radius);

                    viewer.entities.add({
                        position: center,
                        ellipse: {
                            semiMajorAxis: radius,
                            semiMinorAxis: radius,
                            material: Cesium.Color.BLUE.withAlpha(0.5),
                        },
                    });
                    console.log('setting null');

                    setCenter(null);
                    if (previewCircle) {
                        viewer.entities.remove(previewCircle);
                        setPreviewCircle(null);
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        newHandler.setInputAction((event) => {
            if (center) {
                const ray = viewer.camera.getPickRay(event.endPosition);
                const earthPosition = viewer.scene.globe.pick(ray!, viewer.scene);

                if (Cesium.defined(earthPosition)) {
                    const radius = Cesium.Cartesian3.distance(center, earthPosition);

                    if (previewCircle) {
                        viewer.entities.remove(previewCircle);
                    }

                    const newPreviewCircle = viewer.entities.add({
                        position: center,
                        ellipse: {
                            semiMajorAxis: radius,
                            semiMinorAxis: radius,
                            material: Cesium.Color.YELLOW.withAlpha(0.3),
                        },
                    });

                    setPreviewCircle(newPreviewCircle);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    };

    const handleDrawType = (_event: React.MouseEvent<HTMLElement>, newShape: 'circle' | 'line' | null) => {
        setDrawingMode(newShape);
        if (newShape === 'circle') startDrawingCircle();
    };

    return (
        <ToggleButtonGroup
            sx={{ height: '35px' }}
            value={drawingMode}
            exclusive
            onChange={handleDrawType}
            size="small"
            style={{ background: 'white' }}
        >
            <MeltaTooltip title={i18next.t('location.circle')}>
                <ToggleButton value="circle">
                    <Circle sx={{ width: '20px', height: '20px' }} />
                </ToggleButton>
            </MeltaTooltip>
            <MeltaTooltip title={i18next.t('location.line')}>
                <ToggleButton value="line">
                    <LinearScale sx={{ width: '20px', height: '20px' }} />
                </ToggleButton>
            </MeltaTooltip>
        </ToggleButtonGroup>
    );
};

export default EditableMapControl;
