/* eslint-disable import/first */
window.CESIUM_BASE_URL = '/static/Cesium/';

import React, { useEffect, useRef, useState } from 'react';
import { Ion } from 'cesium';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { LocationOn, ShapeLine } from '@mui/icons-material';
import i18next from 'i18next';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import { IEntity } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';

type Props = {
    edit?: { defaultLocation?: string; updateValue: (newValue: string) => void };
    preview?: { entity: IEntity; entityTemplate: IMongoEntityTemplatePopulated };
};

const LocationField = ({ edit, preview }: Props) => {
    Ion.defaultAccessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjZWI5M2EyNC1lODE3LTQwYTQtYTUxZi00NDlhODAyZDM0NTMiLCJpZCI6MjcwNDM5LCJpYXQiOjE3Mzc0NDk3MzN9.WLi4Zcm4D_PMstHcM3YNMJsw1xPhiNGuJyizwg_4nbg';

    const cesiumContainerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Cesium.Viewer | null>(null);

    const [drawingMode, setDrawingMode] = useState<'polygon' | 'coordinate' | null>(null);
    const [activeShapePoints, setActiveShapePoints] = useState<Cesium.Cartesian3[]>([]);
    const [activeShape, setActiveShape] = useState<Cesium.Entity | null>(null);
    const [floatingPoint, setFloatingPoint] = useState<Cesium.Entity | null>(null); // mouse position
    console.log({ activeShapePoints, activeShape, floatingPoint });
    const coordinateDisabled = activeShapePoints.length > 0;

    const drawShape = (positionData: Cesium.PolygonHierarchy | Cesium.CallbackProperty) => {
        if (!viewerRef.current) return null;

        let shape;
        if (drawingMode === 'polygon') {
            shape = viewerRef.current.entities.add({
                polygon: {
                    hierarchy: positionData,
                    material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.7)),
                },
            });
        }
        console.log('draw shape', { shape, positionData });

        return shape;
    };

    const terminateShape = () => {
        if (activeShapePoints.length > 0) drawShape(new Cesium.PolygonHierarchy(activeShapePoints.slice(0, -1)));
        if (floatingPoint) viewerRef.current?.entities.remove(floatingPoint);
        if (activeShape) viewerRef.current?.entities.remove(activeShape);

        setFloatingPoint(null);
        setActiveShape(null);
        setActiveShapePoints([]);
    };

    const handleDrawType = (_event: React.MouseEvent<HTMLElement>, newShape: 'polygon' | 'coordinate' | null) => {
        setDrawingMode(newShape);
        if (newShape === null) return;
        terminateShape();
    };

    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (cesiumContainerRef.current) {
            viewerRef.current = new Cesium.Viewer(cesiumContainerRef.current, {
                selectionIndicator: false,
                infoBox: false,
                terrain: Cesium.Terrain.fromWorldTerrain(),
            });

            viewerRef.current.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

            const viewer = viewerRef.current;

            const createPoint = (worldPosition: Cesium.Cartesian3) => {
                console.log('createPoint', { worldPosition });

                return viewer.entities.add({
                    position: worldPosition,
                    point: {
                        color: Cesium.Color.WHITE,
                        pixelSize: 10,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    },
                });
            };

            const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

            handler.setInputAction((event) => {
                if (drawingMode === null) return;
                if (coordinateDisabled && drawingMode === 'coordinate') return; // not working
                const ray = viewer.camera.getPickRay(event.position);
                const earthPosition = viewer.scene.globe.pick(ray!, viewer.scene);

                if (Cesium.defined(earthPosition)) {
                    if (activeShapePoints.length === 0) {
                        const newFloatingPoint = createPoint(earthPosition);
                        setFloatingPoint(newFloatingPoint);
                        setActiveShapePoints((prevPoints) => [...prevPoints, earthPosition]);

                        const dynamicPositions = new Cesium.CallbackProperty(() => {
                            if (drawingMode === 'polygon') return new Cesium.PolygonHierarchy([...activeShapePoints, earthPosition]);

                            return activeShapePoints;
                        }, false);
                        console.log({ dynamicPositions });

                        setActiveShape(drawShape(dynamicPositions));
                    }
                    setActiveShapePoints((prevPoints) => [...prevPoints, earthPosition]);
                    createPoint(earthPosition);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            handler.setInputAction((event) => {
                if (floatingPoint && floatingPoint.position instanceof Cesium.ConstantPositionProperty) {
                    const ray = viewer.camera.getPickRay(event.endPosition);
                    const newPosition = viewer.scene.globe.pick(ray!, viewer.scene);

                    if (Cesium.defined(newPosition)) {
                        floatingPoint.position.setValue(newPosition);
                        setActiveShapePoints((prevPoints) => {
                            const newPoints = [...prevPoints];
                            newPoints.pop();
                            newPoints.push(newPosition);
                            return newPoints;
                        });
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            handler.setInputAction(() => {
                terminateShape();
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

            return () => {
                if (viewer && !viewer.isDestroyed()) {
                    viewer.destroy();
                }
            };
        }
    }, [drawingMode]);
    //  activeShape, floatingPoint

    return (
        <div style={{ position: 'relative', height: '800px', width: '600px' }}>
            <div ref={cesiumContainerRef} style={{ height: '100%', width: '100%' }} />
            <div
                id="toolbar"
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    padding: '10px',
                    zIndex: 10,
                }}
            >
                <ToggleButtonGroup value={drawingMode} exclusive onChange={handleDrawType} style={{ background: 'white' }}>
                    <MeltaTooltip title={i18next.t('location.coordinate')}>
                        <ToggleButton value="coordinate" disabled={coordinateDisabled}>
                            <LocationOn />
                        </ToggleButton>
                    </MeltaTooltip>
                    <MeltaTooltip title={i18next.t('location.polygon')}>
                        <ToggleButton value="polygon">
                            <ShapeLine />
                        </ToggleButton>
                    </MeltaTooltip>
                </ToggleButtonGroup>
            </div>
        </div>
    );
};

export default LocationField;
