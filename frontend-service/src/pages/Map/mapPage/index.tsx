/* eslint-disable react-hooks/exhaustive-deps */
import { CircleTwoTone as CircleIcon, StraightenTwoTone as DistanceIcon, PentagonTwoTone as PolygonIcon } from '@mui/icons-material';
import { Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';
import * as Cesium from 'cesium';
import { Cartesian3, Color } from 'cesium';
import i18next from 'i18next';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { CesiumMovementEvent, EllipseGraphics, Entity, PointGraphics, PolylineGraphics, Viewer } from 'resium';
import { TablePageType } from '../../../common/EntitiesTableOfTemplate';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { EntitiesTable } from '../../../common/wizards/excel/excelSteps/EntitiesTable';
import { environment } from '../../../globals';
import { IEntity, ISearchEntitiesByLocationBody } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { BackendConfigState } from '../../../services/backendConfigService';
import { getEntitiesByLocation } from '../../../services/entitiesService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useWorkspaceStore } from '../../../stores/workspace';
import { useEntityWithLocationFields } from '../../../utils/hooks/useLocation';
import { jerusalemCoordinates, LatLng, locationToWGS84String, stringToCoordinates } from '../../../utils/map';
import { convertECEFToWGS84, convertWGS94ToECEF } from '../../../utils/map/convert';
import { BaseLayers } from '../BaseLayers';
import { MeltaCoordinate, MeltaPolygon } from '../LocationPreview';
import MapPageEntityDialog from './EntityMapDialog';
import MapFilters, { DeleteMapDataBtn } from './MapFilters';

const { maxRadius } = environment.map;

enum ShapeType {
    Circle = 'circle',
    Polygon = 'polygon',
    Line = 'line',
}

enum CameraFocusType {
    Circle = 'circle',
    Polygon = 'polygon',
    Search = 'search',
}

const MapPage: React.FC<{ isSideBarOpen: boolean }> = ({ isSideBarOpen }) => {
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);
    const childEntityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getChildEntityTemplates']);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const viewerRef = useRef<any>(null);

    const [drawingMode, setDrawingMode] = useState<ShapeType | null>(null);
    const [drawingCircle, setDrawingCircle] = useState(false);
    const [circleData, setCircleData] = useState<{ center: Cartesian3 | null; radius: number | null; mouseRadius: number | null }>({
        center: null,
        radius: null,
        mouseRadius: null,
    });
    const [polygonData, setPolygonData] = useState<Cartesian3[]>([]);
    const [drawingPolygon, setDrawingPolygon] = useState(false);
    const [polygonComplete, setPolygonComplete] = useState(false);

    const [lineData, setLineData] = useState<Cartesian3[]>([]);

    const [selectedTemplates, setSelectedTemplates] = useState<IMongoEntityTemplatePopulated[]>([]);

    const [searchedEntity, setSearchedEntity] = useState<IEntity | undefined>(undefined);
    const [searchedEntityTemplate, setSearchedEntityTemplate] = useState<IMongoEntityTemplatePopulated | undefined>(undefined);
    const [selectedEntity, setSelectedEntity] = useState<{ matchingField: string; node: IEntity } | null>(null);

    const [searchedPolygons, setSearchedPolygons] = useState<{ key: string; name: string; node: IEntity; position: Cartesian3[] }[]>([]);
    const [searchedMarkers, setSearchedMarkers] = useState<{ key: string; name: string; node: IEntity; position: Cartesian3 }[]>([]);

    const [cameraFocus, setCameraFocus] = useState<CameraFocusType | null>(null);

    const filteredTemplatesIds = useMemo(() => selectedTemplates.map(({ _id }) => _id), [selectedTemplates]);

    const { metadata } = useWorkspaceStore((state) => state.workspace);
    const { sourceTemplateId, destTemplateId, sourceFieldForColor } = metadata.mapPage;

    const sourceTemplate = childEntityTemplateMap?.get(sourceTemplateId) ?? entityTemplateMap?.get(sourceTemplateId);
    const sourceSearchResults = [...searchedMarkers, ...searchedPolygons]
        .filter(({ node }) => node.templateId === sourceTemplate?._id)
        .map(({ node }) => node);

    const sourceTemplateColors = sourceTemplate?.enumPropertiesColors?.[sourceFieldForColor];

    const {
        bounds: searchedEntityBounds,
        markers: searchedEntityMarkers,
        polygons: searchedEntityPolygons,
        propertyDefinitions: searchedPropertyDefinitions,
    } = useEntityWithLocationFields({ entityTemplate: searchedEntityTemplate, entityProperties: searchedEntity?.properties });

    useEffect(() => {
        const animateCamera = () => {
            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;
            const { camera } = viewer;

            const flyToBoundingSphere = (boundingSphere: Cesium.BoundingSphere) => {
                const offset = new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), boundingSphere.radius * 5);
                camera.flyToBoundingSphere(boundingSphere, { duration: 1.5, offset });
            };

            switch (cameraFocus) {
                case CameraFocusType.Circle: {
                    if (circleData.center && circleData.radius) {
                        const boundingSphere = new Cesium.BoundingSphere(circleData.center, circleData.radius);
                        flyToBoundingSphere(boundingSphere);
                    }
                    break;
                }

                case CameraFocusType.Polygon: {
                    if (polygonData.length > 0 && polygonComplete) {
                        const boundingSphere = Cesium.BoundingSphere.fromPoints(polygonData);
                        flyToBoundingSphere(boundingSphere);
                    }
                    break;
                }

                case CameraFocusType.Search: {
                    if (
                        (searchedEntityPolygons.length > 0 || searchedEntityMarkers.length > 0) &&
                        searchedEntityBounds?.center &&
                        searchedEntityBounds?.radius
                    ) {
                        const boundingSphere = new Cesium.BoundingSphere(searchedEntityBounds.center, searchedEntityBounds.radius);
                        flyToBoundingSphere(boundingSphere);
                    }
                    break;
                }

                default: {
                    if (!circleData.center && !circleData.radius && polygonData.length === 0) {
                        camera.flyTo({
                            destination: jerusalemCoordinates,
                            duration: 1.5,
                        });
                    }
                }
            }
        };

        const animationFrameId = requestAnimationFrame(animateCamera);
        return () => cancelAnimationFrame(animationFrameId);
    }, [circleData, polygonComplete, searchedEntityPolygons, searchedEntityMarkers]);

    useEffect(() => {
        if (searchedEntity && entityTemplateMap) setSearchedEntityTemplate(entityTemplateMap.get(searchedEntity.templateId)!);
    }, [searchedEntity, entityTemplateMap]);

    const handleViewerClick = useCallback(
        (clickEvent: CesiumMovementEvent) => {
            if (!clickEvent.position) return;

            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const { scene } = viewer;
            const cartesian: Cartesian3 = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

            if (!cartesian) return;

            if (drawingMode === ShapeType.Line) setLineData((prev) => [...prev, cartesian]);

            if (drawingMode === ShapeType.Polygon) {
                if (!drawingPolygon) {
                    setCameraFocus(CameraFocusType.Polygon);

                    setDrawingPolygon(true);
                    setPolygonComplete(false);
                    setPolygonData([cartesian]);
                    setSearchedMarkers([]);
                    setSearchedPolygons([]);
                } else setPolygonData((prev) => [...prev, cartesian]);
            }
        },
        [drawingMode, drawingPolygon, viewerRef, setLineData, setPolygonData],
    );

    const handleMouseDown = useCallback(
        (clickEvent) => {
            if (drawingMode !== ShapeType.Circle || !clickEvent.position) return;
            setSearchedMarkers([]);
            setSearchedPolygons([]);

            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const { scene } = viewer;
            const cartesian: Cartesian3 = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

            if (!cartesian) return;
            setCircleData({ center: cartesian, radius: null, mouseRadius: null });
            setDrawingCircle(true);

            scene.screenSpaceCameraController.enableRotate = false;
            setCameraFocus(CameraFocusType.Circle);
        },
        [drawingMode, viewerRef, setCircleData, setDrawingCircle],
    );

    const handleMouseMove = useCallback(
        (moveEvent: CesiumMovementEvent) => {
            if (!drawingCircle || drawingMode !== ShapeType.Circle || circleData.center === null || circleData.radius !== null) return;

            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const { scene } = viewer;
            const cartesian = scene.camera.pickEllipsoid(moveEvent.endPosition, scene.globe.ellipsoid);

            if (!cartesian) return;

            const radius = Cartesian3.distance(circleData.center, cartesian);
            if (radius > maxRadius) return;
            setCircleData((prev) => ({
                ...prev,
                mouseRadius: radius,
            }));
        },
        [drawingMode, drawingCircle, circleData, viewerRef, setCircleData],
    );

    const handleMouseUp = useCallback(
        (clickEvent) => {
            if (drawingMode !== ShapeType.Circle || circleData.center === null || circleData.radius !== null) return;

            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const { scene } = viewer;
            const cartesian = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

            if (!cartesian) return;
            const radius = Cartesian3.distance(circleData.center, cartesian);
            if (radius > maxRadius) toast.warn(i18next.t('location.radiusMaxLimit'));

            setDrawingCircle(false);
            setCircleData({
                center: circleData.center,
                radius: radius > maxRadius ? maxRadius : radius,
                mouseRadius: null,
            });

            viewer.scene.screenSpaceCameraController.enableRotate = true;
            setDrawingMode(null);
        },
        [drawingMode, viewerRef, circleData, setDrawingCircle, setCircleData],
    );

    const handleViewerDoubleClick = useCallback(() => {
        if (drawingMode === ShapeType.Polygon && drawingPolygon && polygonData.length >= 3) {
            setDrawingPolygon(false);
            setPolygonComplete(true);
            setDrawingMode(null);
        }
    }, [drawingMode, drawingPolygon, polygonData]);

    const { mutateAsync } = useMutation(getEntitiesByLocation, {
        onSuccess: (response) => {
            response.forEach(({ matchingFields, node }) => {
                const entityTemplate = entityTemplateMap!.get(node.templateId)!;

                matchingFields.forEach((matchingField) => {
                    const { type, value } = stringToCoordinates(node.properties[matchingField].location);
                    const name = entityTemplate.properties.properties[matchingField].title;

                    if (type === 'polygon') {
                        setSearchedPolygons((prev) => [
                            ...prev,
                            {
                                key: matchingField,
                                name,
                                node,
                                position: value as Cartesian3[],
                            },
                        ]);
                        return;
                    }
                    setSearchedMarkers((prev) => [...prev, { key: matchingField, name, node, position: value as Cartesian3 }]);
                });
            });
        },
        onError: () => {
            toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            const templatesPayload = filteredTemplatesIds.reduce((acc, id) => {
                acc[id] = {};
                return acc;
            }, {} as Record<string, {}>);

            const payload: ISearchEntitiesByLocationBody = { textSearch: '', templates: templatesPayload };

            if (polygonComplete && polygonData.length > 0)
                payload.polygon = polygonData.map((point) => {
                    const { latitude, longitude } = convertECEFToWGS84(point);
                    return [longitude, latitude];
                });

            if (circleData.center && circleData.radius) {
                const { longitude, latitude } = convertECEFToWGS84(circleData.center) as LatLng;
                payload.circle = { coordinate: [latitude, longitude], radius: circleData.radius };
            }

            if (payload.polygon || payload.circle) await mutateAsync(payload);
        };

        fetchData();
    }, [filteredTemplatesIds, circleData, polygonComplete, polygonData]);

    const clearAutocompleteSearch = () => {
        setSearchedEntity(undefined);
        setSearchedEntityTemplate(undefined);
    };

    const resetDrawing = () => {
        setCircleData({ center: null, radius: null, mouseRadius: null });
        setDrawingCircle(false);

        setPolygonData([]);
        setDrawingPolygon(false);
        setPolygonComplete(false);

        setLineData([]);

        setSearchedMarkers([]);
        setSearchedPolygons([]);
    };

    const onClear = () => {
        resetDrawing();
        setDrawingMode(null);
        setCameraFocus(null);
    };

    const handleDrawType = (_event: React.MouseEvent<HTMLElement>, newShape: ShapeType | null) => {
        resetDrawing();
        setDrawingMode(newShape);

        if (newShape === ShapeType.Circle) setCameraFocus(CameraFocusType.Circle);
        else if (newShape === ShapeType.Polygon) setCameraFocus(CameraFocusType.Polygon);
    };

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <Grid container item flexDirection="column" flexWrap="nowrap" height="100%" alignItems="center">
                <Grid height="100%" item alignSelf="flex-start">
                    <Viewer
                        full
                        ref={viewerRef}
                        onClick={handleViewerClick}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onDoubleClick={handleViewerDoubleClick}
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
                        {circleData.center && (circleData.radius || circleData.mouseRadius) && (
                            <Entity
                                name={i18next.t('location.circle')}
                                description={`${locationToWGS84String(circleData.center)}, ${circleData.radius}`}
                                position={circleData.center}
                            >
                                <EllipseGraphics
                                    semiMajorAxis={circleData.radius ?? circleData.mouseRadius!}
                                    semiMinorAxis={circleData.radius ?? circleData.mouseRadius!}
                                    fill={false}
                                    outline
                                    outlineColor={Color.fromAlpha(Color.RED, 0.7)}
                                    outlineWidth={15}
                                />
                                {circleData.mouseRadius && <PointGraphics color={Color.RED} pixelSize={10} />}
                            </Entity>
                        )}

                        <MeltaPolygon polygon={polygonData} name="polygon" outlineColor={Color.RED} fill={false} showCenteredPoint={false} />

                        {lineData.length && (
                            <Entity
                                name={i18next.t('location.line')}
                                description={`${Cartesian3.distance(lineData[0], lineData[lineData.length - 1])} km`}
                            >
                                <PolylineGraphics positions={lineData} material={Color.fromCssColorString('#11695a')} width={3} />
                                {lineData.map((position) => (
                                    <Entity key={`${position.x}, ${position.y}`} position={position}>
                                        <PointGraphics
                                            color={Color.BLACK}
                                            outlineColor={Color.fromCssColorString('#11695a')}
                                            pixelSize={10}
                                            outlineWidth={2}
                                        />
                                    </Entity>
                                ))}
                            </Entity>
                        )}

                        {searchedEntityPolygons.map(({ key, position: polygon }) => (
                            <MeltaPolygon
                                key={key}
                                name={searchedPropertyDefinitions[key].title}
                                polygon={polygon}
                                onClick={() => {
                                    setSelectedEntity({ matchingField: `${key}-${searchedEntity!.properties._id}`, node: searchedEntity! });
                                }}
                            />
                        ))}

                        {searchedEntityMarkers.map(({ key, position }) => (
                            <MeltaCoordinate
                                key={key}
                                name={searchedPropertyDefinitions[key].title}
                                position={convertWGS94ToECEF(position) as Cartesian3}
                                onClick={() => {
                                    setSelectedEntity({ matchingField: `${key}-${searchedEntity!.properties._id}`, node: searchedEntity! });
                                }}
                            />
                        ))}

                        {searchedPolygons.map(({ key, name, position: polygon, node }) => (
                            <MeltaPolygon
                                key={key}
                                name={name}
                                polygon={polygon}
                                onClick={() => {
                                    setSelectedEntity({ matchingField: `${key}-${node.properties._id}`, node });
                                }}
                                color={sourceTemplateColors?.[node.properties[sourceFieldForColor]]}
                            />
                        ))}

                        {searchedMarkers.map(({ key, name, position, node }) => (
                            <MeltaCoordinate
                                key={key}
                                name={name}
                                position={convertWGS94ToECEF(position) as Cartesian3}
                                onClick={() => {
                                    setSelectedEntity({ matchingField: `${key}-${node.properties._id}`, node });
                                }}
                                color={sourceTemplateColors?.[node.properties[sourceFieldForColor]]}
                            />
                        ))}

                        <div
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: isSideBarOpen ? '14%' : '5%',
                                display: 'flex',
                                gap: '15px',
                                transition: 'right 0.3s ease-in-out',
                            }}
                        >
                            <MapFilters
                                selectedTemplates={selectedTemplates}
                                setSelectedTemplates={setSelectedTemplates}
                                moveToEntityLocations={(entity: IEntity) => {
                                    setSearchedEntity(entity);
                                    setCameraFocus(CameraFocusType.Search);
                                }}
                                entityTemplateMap={entityTemplateMap!}
                                darkMode={darkMode}
                                clearAutocompleteSearch={clearAutocompleteSearch}
                            />

                            {config && <BaseLayers viewerRef={viewerRef} config={config} />}
                            <ToggleButtonGroup
                                value={drawingMode}
                                exclusive
                                onChange={handleDrawType}
                                size="small"
                                style={{ background: darkMode ? '#121212' : 'white', height: '35px' }}
                            >
                                <MeltaTooltip title={i18next.t('location.circle')}>
                                    <ToggleButton value="circle">
                                        <CircleIcon sx={{ width: '20px', height: '20px', color: darkMode ? '#9398c2' : '#1E2775' }} />
                                    </ToggleButton>
                                </MeltaTooltip>
                                <MeltaTooltip title={i18next.t('location.searchByPolygon')}>
                                    <ToggleButton value="polygon">
                                        <PolygonIcon sx={{ width: '20px', height: '20px', color: darkMode ? '#9398c2' : '#1E2775' }} />
                                    </ToggleButton>
                                </MeltaTooltip>
                                <MeltaTooltip title={i18next.t('location.line')}>
                                    <ToggleButton value="line">
                                        <DistanceIcon sx={{ width: '20px', height: '20px', color: darkMode ? '#9398c2' : '#1E2775' }} />
                                    </ToggleButton>
                                </MeltaTooltip>
                            </ToggleButtonGroup>
                            <DeleteMapDataBtn onClick={onClear} darkMode={darkMode} />
                        </div>
                        {selectedEntity && (
                            <MapPageEntityDialog
                                open={!!selectedEntity}
                                entityWithMatchingField={selectedEntity}
                                onClose={() => setSelectedEntity(null)}
                                key={selectedEntity.matchingField}
                            />
                        )}
                    </Viewer>
                </Grid>

                {sourceSearchResults.length > 0 && (
                    <Grid item width="98%">
                        <EntitiesTable
                            rowData={sourceSearchResults}
                            rowModelType="clientSide"
                            template={sourceTemplate!}
                            defaultExpanded
                            title={i18next.t('location.searchResults')}
                            infiniteModeWithoutExpand
                            relatedTemplateProperties={destTemplateId}
                            overrideSx={{ '&.MuiPaper-root': { borderRadius: '20px 20px 0 0' } }}
                            pageType={TablePageType.map}
                        />
                    </Grid>
                )}
            </Grid>
        </div>
    );
};

export default MapPage;
