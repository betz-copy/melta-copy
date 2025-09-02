/* eslint-disable react-hooks/exhaustive-deps */
import { CircleTwoTone, LinearScaleTwoTone, PolylineTwoTone } from '@mui/icons-material';
import { Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';
import * as Cesium from 'cesium';
import { Cartesian3, Color } from 'cesium';
import i18next from 'i18next';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { CesiumMovementEvent, EllipseGraphics, Entity, PointGraphics, PolygonGraphics, PolylineGraphics, Viewer } from 'resium';
import { TablePageType } from '../../../common/EntitiesTableOfTemplate';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { EntitiesTable } from '../../../common/wizards/excel/excelSteps/EntitiesTable';
import { environment } from '../../../globals';
import { IEntity } from '../../../interfaces/entities';
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

const MapPage = () => {
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);
    const childEntityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getChildEntityTemplates']);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const viewerRef = useRef<any>(null);

    const [drawingMode, setDrawingMode] = useState<'circle' | 'line' | 'polygon' | null>(null);
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

    const [cameraFocus, setCameraFocus] = useState<'search' | 'circle'>();

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

            if (!circleData.center && !circleData.radius) {
                camera.flyTo({
                    destination: jerusalemCoordinates,
                    duration: 1.5,
                });
            }

            if (cameraFocus === 'search') {
                if (searchedEntityPolygons.length > 0 || searchedEntityMarkers.length > 0) {
                    if (searchedEntityBounds?.center && searchedEntityBounds?.radius) {
                        const boundingSphere = new Cesium.BoundingSphere(searchedEntityBounds.center, searchedEntityBounds.radius);

                        camera.flyToBoundingSphere(boundingSphere, {
                            duration: 1.5,
                            offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), searchedEntityBounds.radius * 5),
                        });
                    }
                }
            } else {
                // eslint-disable-next-line no-lonely-if
                if (circleData.center && circleData.radius) {
                    const boundingSphere = new Cesium.BoundingSphere(circleData.center, circleData.radius);

                    camera.flyToBoundingSphere(boundingSphere, {
                        duration: 1.5,
                        offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), circleData.radius * 5),
                    });
                }
            }
        };

        const animationFrameId = requestAnimationFrame(animateCamera);
        return () => cancelAnimationFrame(animationFrameId);
    }, [circleData, searchedEntityPolygons, searchedEntityMarkers]);

    useEffect(() => {
        if (searchedEntity && entityTemplateMap) {
            setSearchedEntityTemplate(entityTemplateMap.get(searchedEntity.templateId)!);
        }
    }, [searchedEntity, entityTemplateMap]);
    console.log({ polygonData, circleData });

    const handleViewerClick = useCallback(
        (clickEvent: CesiumMovementEvent) => {
            if (!clickEvent.position) return;

            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const { scene } = viewer;
            const cartesian: Cartesian3 = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

            if (!cartesian) return;

            // Handle line drawing (your existing code)
            if (drawingMode === 'line') {
                setLineData((prev) => [...prev, cartesian]);
            }

            // Handle polygon drawing (new code)
            if (drawingMode === 'polygon') {
                if (!drawingPolygon) {
                    // Start drawing polygon
                    setDrawingPolygon(true);
                    setPolygonComplete(false);
                    setPolygonData([cartesian]);
                    setSearchedMarkers([]);
                    setSearchedPolygons([]);
                } else {
                    // Add point to polygon
                    setPolygonData((prev) => [...prev, cartesian]);
                }
            }
        },
        [drawingMode, drawingPolygon, viewerRef, setLineData, setPolygonData],
    );

    const handleMouseDown = useCallback(
        (clickEvent) => {
            if (drawingMode !== 'circle' || !clickEvent.position) return;
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
        },
        [drawingMode, viewerRef, setCircleData, setDrawingCircle],
    );

    const handleMouseMove = useCallback(
        (moveEvent: CesiumMovementEvent) => {
            if (!drawingCircle || drawingMode !== 'circle' || circleData.center === null || circleData.radius !== null) {
                return;
            }

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
            if (drawingMode !== 'circle' || circleData.center === null || circleData.radius !== null) return;

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
    const handleViewerDoubleClick = useCallback(
        (clickEvent: CesiumMovementEvent) => {
            if (drawingMode === 'polygon' && drawingPolygon && polygonData.length >= 3) {
                // Finish polygon drawing
                setDrawingPolygon(false);
                setPolygonComplete(true);
                setDrawingMode(null);
                // Perform search here if needed
                // performPolygonSearch(polygonData);
                console.log('here');
            }
        },
        [drawingMode, drawingPolygon, polygonData],
    );

    const { mutateAsync } = useMutation(getEntitiesByLocation, {
        onSuccess: (response) => {
            response.forEach((item) => {
                const { matchingFields, node } = item;
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
            if (polygonComplete && polygonData) {
                console.log('Polygon complete:', polygonData);

                const polygonDataWGS84: [number, number][] = polygonData.map((point) => {
                    const { latitude, longitude } = convertECEFToWGS84(point);
                    return [longitude, latitude];
                });

                const templatesPayload = filteredTemplatesIds.reduce((acc, id) => {
                    acc[id] = {};
                    return acc;
                }, {} as Record<string, {}>);

                await mutateAsync({
                    textSearch: '',
                    templates: templatesPayload,
                    polygon: polygonDataWGS84,
                });

                console.log('Polygon WGS84:', polygonDataWGS84);
            }
            if (circleData.center && circleData.radius) {
                const { longitude, latitude } = convertECEFToWGS84(circleData.center) as LatLng;

                const templatesPayload = filteredTemplatesIds.reduce((acc, id) => {
                    acc[id] = {};
                    return acc;
                }, {} as Record<string, {}>);

                await mutateAsync({
                    textSearch: '',
                    templates: templatesPayload,
                    circle: { coordinate: [latitude, longitude], radius: circleData.radius! },
                });
            }
        };

        fetchData();
    }, [filteredTemplatesIds, circleData, polygonComplete, polygonData]);

    const clearAutocompleteSearch = () => {
        setSearchedEntity(undefined);
        setSearchedEntityTemplate(undefined);
    };

    const onClear = () => {
        setCircleData({ center: null, radius: null, mouseRadius: null });
        setLineData([]);
        setDrawingMode(null);
        setSearchedMarkers([]);
        setSearchedPolygons([]);
    };

    const handleDrawType = (_event: React.MouseEvent<HTMLElement>, newShape: 'circle' | 'line' | 'polygon' | null) => setDrawingMode(newShape);

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <Grid container item flexDirection="column" flexWrap="nowrap" height="100%" alignItems="center">
                <Grid height="100%" item alignSelf="flex-start">
                    <Viewer
                        full
                        ref={viewerRef}
                        //for line
                        onClick={handleViewerClick}
                        //for circle
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onDoubleClick={handleViewerDoubleClick} // Add this for polygon finishing
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

                        {polygonData.length >= 2 && (
                            <Entity name={i18next.t('location.polygon')}>
                                {polygonData.length >= 3 && (
                                    <PolygonGraphics
                                        hierarchy={new Cesium.PolygonHierarchy(polygonData)}
                                        // material={polygonComplete ? Color.fromAlpha(Color.BLUE, 0.3) : Color.fromAlpha(Color.YELLOW, 0.3)}
                                        // outline={true}
                                        // outlineColor={polygonComplete ? Color.BLUE : Color.YELLOW}
                                        // outlineWidth={3}
                                        fill={false}
                                        outline
                                        outlineColor={Color.fromAlpha(Color.RED, 0.7)}
                                        outlineWidth={5}
                                    />
                                )}
                                {/* Show polygon points */}
                                {/* {polygonData.map((position, index) => (
                                    <Entity key={`polygon-point-${index}`} position={position}>
                                        <PointGraphics
                                            //  color={Color.WHITE} outlineColor={Color.BLUE}
                                            outlineColor={Color.fromAlpha(Color.RED, 0.7)}
                                            pixelSize={8}
                                            outlineWidth={2}
                                        />
                                    </Entity>
                                ))} */}
                                {/* Show lines between points while drawing */}
                                {polygonData.length >= 2 && !polygonComplete && <PolylineGraphics positions={polygonData} width={2} />}
                            </Entity>
                        )}

                        {lineData.length > 1 && (
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

                        <div style={{ position: 'absolute', top: '10px', right: '5%', display: 'flex', gap: '15px' }}>
                            <MapFilters
                                selectedTemplates={selectedTemplates}
                                setSelectedTemplates={setSelectedTemplates}
                                moveToEntityLocations={(entity: IEntity) => {
                                    setSearchedEntity(entity);
                                    setCameraFocus('search');
                                }}
                                entityTemplateMap={entityTemplateMap!}
                                onClear={onClear}
                                darkMode={darkMode}
                                clearAutocompleteSearch={clearAutocompleteSearch}
                                sourceTemplate={sourceTemplate}
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
                                        <CircleTwoTone
                                            sx={{
                                                width: '20px',
                                                height: '20px',
                                                color: darkMode ? '#9398c2' : '#1E2775',
                                                '--CircleTwoToneIcon-secondary-color': darkMode ? '#787c9e' : '#CCCFE6',
                                            }}
                                        />
                                    </ToggleButton>
                                </MeltaTooltip>
                                <MeltaTooltip title={i18next.t('location.polygon')}>
                                    <ToggleButton value="polygon">
                                        <PolylineTwoTone
                                            sx={{
                                                width: '20px',
                                                height: '20px',
                                                color: darkMode ? '#9398c2' : '#1E2775',
                                                '--CircleTwoToneIcon-secondary-color': darkMode ? '#787c9e' : '#CCCFE6',
                                            }}
                                        />
                                    </ToggleButton>
                                </MeltaTooltip>
                                <MeltaTooltip title={i18next.t('location.line')}>
                                    <ToggleButton value="line">
                                        <LinearScaleTwoTone
                                            sx={{
                                                width: '20px',
                                                height: '20px',
                                                color: darkMode ? '#9398c2' : '#1E2775',
                                                '--CircleTwoToneIcon-secondary-color': darkMode ? '#787c9e' : '#CCCFE6',
                                            }}
                                        />
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
