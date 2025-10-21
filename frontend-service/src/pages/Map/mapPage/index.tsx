/* eslint-disable react-hooks/exhaustive-deps */
import { CircleTwoTone as CircleIcon, Close, StraightenTwoTone as DistanceIcon, PentagonTwoTone as PolygonIcon } from '@mui/icons-material';
import { Grid, ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';
import * as Cesium from 'cesium';
import { Cartesian3, Color } from 'cesium';
import i18next from 'i18next';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { CesiumMovementEvent, EllipseGraphics, Entity, PointGraphics, PolylineGraphics, Viewer } from 'resium';
import { TablePageType } from '../../../common/EntitiesTableOfTemplate';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { EntitiesTable } from '../../../common/wizards/excel/excelSteps/EntitiesTable';
import { environment } from '../../../globals';
import { FilterLogicalOperator, IEntity, IFilterOfField, ISearchEntitiesByLocationBody } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { BackendConfigState } from '../../../services/backendConfigService';
import { getEntitiesByLocation } from '../../../services/entitiesService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useWorkspaceStore } from '../../../stores/workspace';
import { useEntitiesWithLocationFields } from '../../../utils/hooks/useLocation';
import { jerusalemCoordinates, LatLng, locationToWGS84String, stringToCoordinates } from '../../../utils/map';
import { convertECEFToWGS84, convertWGS94ToECEF } from '../../../utils/map/convert';
import { BaseLayers } from '../BaseLayers';
import { MeltaCoordinate, MeltaPolygon } from '../LocationEntities';
import MapPageEntityDialog from './EntityMapDialog';
import MapFilters from './MapFilters';

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

const emptyCircle = { center: null, radius: null, mouseRadius: null };

const MapPage: React.FC<{ isSideBarOpen: boolean }> = ({ isSideBarOpen }) => {
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig')!;
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates'])!;
    const childEntityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getChildEntityTemplates'])!;

    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const viewerRef = useRef<any>(null);

    const [{ autoSearch, listFields }, setFilters] = useState<{ autoSearch: string; listFields: Record<string, IFilterOfField['$in']> }>({
        autoSearch: '',
        listFields: {},
    });

    const [shapeType, setShapeType] = useState<ShapeType | null>(null);
    const [drawingMode, setDrawingMode] = useState<ShapeType.Circle | ShapeType.Polygon | null>(null);

    const [{ circle, polygon, line }, setSearchShape] = useState<{
        circle: { center: Cartesian3 | null; radius: number | null; mouseRadius: number | null };
        polygon: Cartesian3[];
        line: Cartesian3[];
    }>({
        circle: emptyCircle,
        polygon: [],
        line: [],
    });

    const [filterResult, setFilterResult] = useState<IEntity[]>([]);

    const [selectedEntityDialog, setSelectedEntityDialog] = useState<{ matchingField: string; node: IEntity } | null>(null);

    const [{ polygons, coordinates }, setSearchResults] = useState<{
        coordinates: { key: string; name: string; node: IEntity; position: Cartesian3 }[];
        polygons: { key: string; name: string; node: IEntity; position: Cartesian3[] }[];
    }>({ coordinates: [], polygons: [] });

    const [{ coordinates: filteredCoordinates, polygons: filteredPolygons }, setFilteredResults] = useState<{
        coordinates: { key: string; name: string; node: IEntity; position: Cartesian3 }[];
        polygons: { key: string; name: string; node: IEntity; position: Cartesian3[] }[];
    }>({ coordinates, polygons });

    const [cameraFocus, setCameraFocus] = useState<CameraFocusType | null>(null);

    const { metadata } = useWorkspaceStore((state) => state.workspace);
    const { sourceTemplateId, destTemplateId, sourceFieldForColor } = metadata.mapPage;

    const isSearchShape = Boolean(circle.radius || polygon.length);

    const applyFilterWithShapeSearch = ({ autoSearch, listFields }: { autoSearch: string; listFields: Record<string, IFilterOfField['$in']> }) => {
        const allItems = [...polygons, ...coordinates];

        const filtered = allItems.filter(
            ({ node }) =>
                Object.values(node.properties).some((value) => value != null && String(value).includes(autoSearch)) &&
                node.templateId === sourceTemplateId &&
                Object.entries(listFields).every(
                    ([field, allowedValues]) => !allowedValues || allowedValues.length === 0 || allowedValues.includes(node.properties[field] as any),
                ),
        );

        setFilteredResults({
            polygons: filtered.filter(
                (
                    item,
                ): item is {
                    key: string;
                    name: string;
                    node: IEntity;
                    position: Cartesian3[];
                } => Array.isArray(item.position),
            ),
            coordinates: filtered.filter(
                (
                    item,
                ): item is {
                    key: string;
                    name: string;
                    node: IEntity;
                    position: Cartesian3;
                } => !Array.isArray(item.position),
            ),
        });
    };

    useEffect(() => applyFilterWithShapeSearch({ autoSearch, listFields }), [polygons, coordinates]);

    const sourceTemplate = childEntityTemplateMap?.get(sourceTemplateId) ?? entityTemplateMap?.get(sourceTemplateId);

    const sourceTemplateColors = sourceTemplate?.enumPropertiesColors?.[sourceFieldForColor];

    const {
        bounds: searchedEntitiesBounds,
        markers: searchedEntitiesMarkers,
        polygons: searchedEntitiesPolygons,
    } = useEntitiesWithLocationFields({
        entities: filterResult,
        entityTemplateMap: new Map(
            Array.from(entityTemplateMap.entries()).filter(([_, value]) =>
                Object.values(value.properties.properties).some((obj) => obj.format === 'location'),
            ),
        ),
    });

    const sourceSearchResults = [...filteredCoordinates, ...searchedEntitiesMarkers, ...filteredPolygons, ...searchedEntitiesPolygons]
        .filter(({ node }) => node.templateId === sourceTemplate?._id)
        .map(({ node }) => node);

    const viewedCount = isSearchShape
        ? filteredCoordinates.length + filteredPolygons.length
        : searchedEntitiesMarkers.length + searchedEntitiesPolygons.length;

    const totalCount = coordinates.length + polygons.length;

    useEffect(() => {
        const animateCamera = () => {
            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;
            const { camera } = viewer;

            viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

            const flyToBoundingSphere = (boundingSphere: Cesium.BoundingSphere) => {
                const offset = new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), boundingSphere.radius * 5);
                camera.flyToBoundingSphere(boundingSphere, { duration: 1.5, offset });
            };
            console.log({ cameraFocus });

            switch (cameraFocus) {
                case CameraFocusType.Circle: {
                    if (circle.center && circle.radius) {
                        const boundingSphere = new Cesium.BoundingSphere(circle.center, circle.radius);
                        flyToBoundingSphere(boundingSphere);
                    }
                    break;
                }

                case CameraFocusType.Polygon: {
                    if (polygon.length && polygon && !drawingMode) {
                        const boundingSphere = Cesium.BoundingSphere.fromPoints(polygon);
                        flyToBoundingSphere(boundingSphere);
                    }
                    break;
                }

                case CameraFocusType.Search: {
                    if (
                        (searchedEntitiesPolygons.length || searchedEntitiesMarkers.length) &&
                        searchedEntitiesBounds?.center &&
                        searchedEntitiesBounds?.radius
                    ) {
                        const boundingSphere = new Cesium.BoundingSphere(searchedEntitiesBounds.center, searchedEntitiesBounds.radius);
                        flyToBoundingSphere(boundingSphere);
                    }
                    break;
                }

                default:
                    if (!circle.center && !circle.radius && !polygon.length) camera.flyTo({ destination: jerusalemCoordinates, duration: 1.5 });
            }
        };

        const animationFrameId = requestAnimationFrame(animateCamera);
        return () => cancelAnimationFrame(animationFrameId);
    }, [circle, polygon, line, drawingMode, searchedEntitiesPolygons, searchedEntitiesMarkers]);

    const handleViewerClick = useCallback(
        (clickEvent: CesiumMovementEvent) => {
            if (!clickEvent.position) return;

            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const { scene } = viewer;
            const cartesian: Cartesian3 = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

            if (!cartesian) return;

            if (shapeType === ShapeType.Line) setSearchShape((prev) => ({ ...prev, line: [...prev.line, cartesian] }));

            if (shapeType === ShapeType.Polygon) {
                if (drawingMode !== ShapeType.Polygon) {
                    setCameraFocus(CameraFocusType.Polygon);

                    setDrawingMode(ShapeType.Polygon);
                    setSearchShape((prev) => ({ ...prev, polygon: [cartesian], circle: emptyCircle }));
                    setSearchResults({ coordinates: [], polygons: [] });
                } else setSearchShape((prev) => ({ ...prev, polygon: [...prev.polygon, cartesian], circle: emptyCircle }));
            }
        },
        [shapeType, drawingMode, viewerRef, setSearchShape],
    );

    const handleMouseDown = useCallback(
        (clickEvent: CesiumMovementEvent) => {
            if (shapeType !== ShapeType.Circle || !clickEvent.position) return;
            setSearchResults({ coordinates: [], polygons: [] });

            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const { scene } = viewer;
            const cartesian: Cartesian3 = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

            if (!cartesian) return;
            setSearchShape((prev) => ({ ...prev, polygon: [], circle: { ...emptyCircle, center: cartesian } }));
            setDrawingMode(ShapeType.Circle);

            scene.screenSpaceCameraController.enableRotate = false;
            setCameraFocus(CameraFocusType.Circle);
        },
        [shapeType, viewerRef, setDrawingMode],
    );

    const handleMouseMove = useCallback(
        (moveEvent: CesiumMovementEvent) => {
            if (drawingMode !== ShapeType.Circle || shapeType !== ShapeType.Circle || circle.center === null || circle.radius !== null) return;

            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const { scene } = viewer;
            const cartesian = scene.camera.pickEllipsoid(moveEvent.endPosition, scene.globe.ellipsoid);

            if (!cartesian) return;

            const radius = Cartesian3.distance(circle.center, cartesian);
            if (radius > maxRadius) return;
            setSearchShape((prev) => ({
                ...prev,
                polygon: [],
                circle: { ...prev.circle, mouseRadius: radius },
            }));
        },
        [shapeType, drawingMode, circle, viewerRef, setSearchShape],
    );

    const handleMouseUp = useCallback(
        (clickEvent: CesiumMovementEvent) => {
            if (shapeType !== ShapeType.Circle || circle.center === null || circle.radius !== null) return;

            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const { scene } = viewer;
            const cartesian = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

            if (!cartesian) return;
            const radius = Cartesian3.distance(circle.center, cartesian);
            if (radius > maxRadius) toast.warn(i18next.t('location.radiusMaxLimit'));

            setDrawingMode(null);
            setSearchShape((prev) => ({
                ...prev,
                polygon: [],
                circle: { center: circle.center, radius: radius > maxRadius ? maxRadius : radius, mouseRadius: null },
            }));

            viewer.scene.screenSpaceCameraController.enableRotate = true;
            setShapeType(null);
        },
        [shapeType, viewerRef, circle, setDrawingMode, setSearchShape],
    );

    const handleViewerDoubleClick = useCallback(() => {
        if (shapeType !== ShapeType.Polygon || drawingMode !== ShapeType.Polygon || polygon.length < 3) return;

        setDrawingMode(null);
        setShapeType(null);
    }, [shapeType, drawingMode, polygon]);

    const { mutateAsync } = useMutation(getEntitiesByLocation, {
        onSuccess: (response) => {
            response.forEach(({ matchingFields, node }) => {
                const entityTemplate = entityTemplateMap.get(node.templateId)!;

                matchingFields.forEach((matchingField) => {
                    const { type, value } = stringToCoordinates(node.properties[matchingField].location);
                    const name = entityTemplate.properties.properties[matchingField].title;

                    setSearchResults((prev) => ({
                        ...prev,
                        [`${type}s`]: [
                            ...prev[`${type}s`],
                            {
                                key: matchingField,
                                name,
                                node,
                                position: value,
                            },
                        ],
                    }));

                    applyFilterWithShapeSearch({ autoSearch, listFields });
                });
            });
        },
        onError: () => {
            toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            const templatesPayload = Array.from(entityTemplateMap.entries())
                .filter(([_, value]) => Object.values(value.properties.properties).some((obj) => obj.format === 'location'))
                .reduce(
                    (acc, [key]) => {
                        acc[key] = {};
                        return acc;
                    },
                    {} as Record<string, {}>,
                );

            templatesPayload[sourceTemplateId] = {
                filter: {
                    [FilterLogicalOperator.AND]: Object.entries(listFields).map(([field, values]) => ({
                        [field]: { $in: values },
                    })),
                },
            };

            const payload: ISearchEntitiesByLocationBody = { textSearch: '', templates: templatesPayload };

            if (polygon && !drawingMode && polygon.length)
                payload.polygon = polygon.map((point) => {
                    const { latitude, longitude } = convertECEFToWGS84(point);
                    return [longitude, latitude];
                });

            if (circle.center && circle.radius) {
                const { longitude, latitude } = convertECEFToWGS84(circle.center) as LatLng;
                payload.circle = { coordinate: [latitude, longitude], radius: circle.radius };
            }

            if (payload.polygon || payload.circle) await mutateAsync(payload);
        };

        fetchData();
    }, [circle, drawingMode, polygon]);

    const resetDrawing = () => {
        setSearchShape({ circle: emptyCircle, polygon: [], line: [] });
        setDrawingMode(null);

        setSearchResults({ coordinates: [], polygons: [] });
        setFilterResult([]);
    };

    const onClear = () => {
        resetDrawing();
        setShapeType(null);
        setCameraFocus(null);
        setSearchShape({ circle: emptyCircle, polygon: [], line: [] });
    };

    const isDrawingShape = (shape: ShapeType | null) => shape === ShapeType.Circle || shape === ShapeType.Polygon;

    const handleDrawType = (_event: React.MouseEvent<HTMLElement>, newShape: ShapeType | null) => {
        if (isDrawingShape(newShape) && isDrawingShape(shapeType) && shapeType !== newShape) resetDrawing();
        setFilterResult([]);

        setShapeType(newShape);
    };

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <Grid container flexDirection="column" flexWrap="nowrap" height="100%" alignItems="center">
                <Grid height="100%" alignSelf="flex-start">
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
                        {circle.center && (circle.radius || circle.mouseRadius) && (
                            <Entity
                                name={i18next.t('location.circle')}
                                description={`${locationToWGS84String(circle.center)}, ${circle.radius}`}
                                position={circle.center}
                            >
                                <EllipseGraphics
                                    semiMajorAxis={circle.radius ?? circle.mouseRadius!}
                                    semiMinorAxis={circle.radius ?? circle.mouseRadius!}
                                    fill={false}
                                    outline
                                    outlineColor={Color.fromAlpha(Color.RED, 0.7)}
                                    outlineWidth={15}
                                />
                                {circle.mouseRadius && <PointGraphics color={Color.RED} pixelSize={10} />}
                            </Entity>
                        )}

                        <MeltaPolygon polygon={polygon} name="polygon" outlineColor={Color.RED} fill={false} showCenteredPoint={false} />

                        {line.length && (
                            <Entity name={i18next.t('location.line')} description={`${Cartesian3.distance(line[0], line[line.length - 1])} km`}>
                                <PolylineGraphics positions={line} material={Color.fromCssColorString('#11695a')} width={3} />
                                {line.map((position) => (
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

                        {[...searchedEntitiesPolygons, ...filteredPolygons].map(({ key, name, position: polygon, node }) => (
                            <MeltaPolygon
                                key={key}
                                name={name}
                                polygon={polygon}
                                onClick={() => setSelectedEntityDialog({ matchingField: `${key}-${node.properties._id}`, node })}
                                color={sourceTemplateColors?.[node.properties[sourceFieldForColor]]}
                            />
                        ))}

                        {[...searchedEntitiesMarkers, ...filteredCoordinates].map(({ key, name, position, node }) => (
                            <MeltaCoordinate
                                key={key}
                                name={name}
                                position={convertWGS94ToECEF(position) as Cartesian3}
                                onClick={() => setSelectedEntityDialog({ matchingField: `${key}-${node.properties._id}`, node })}
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
                                moveToEntityLocations={(entities: IEntity[]) => {
                                    setFilterResult(entities);
                                    setCameraFocus(CameraFocusType.Search);
                                }}
                                entityTemplateMap={entityTemplateMap}
                                darkMode={darkMode}
                                clearAutocompleteSearch={() => {
                                    setFilterResult([]);
                                    setCameraFocus(null);
                                }}
                                sourceTemplate={sourceTemplate}
                                filters={{ value: { autoSearch, listFields }, set: setFilters }}
                                isSearchShape={isSearchShape}
                                applyFilterWithShapeSearch={applyFilterWithShapeSearch}
                                numOfViewedEntitiesText={i18next.t(
                                    isSearchShape ? 'location.showingEntitiesOfTotal' : 'location.showingEntitiesCount',
                                    {
                                        count: viewedCount,
                                        ...(isSearchShape && { total: totalCount }),
                                    },
                                )}
                            />

                            {config && <BaseLayers viewerRef={viewerRef} config={config} />}
                            <ToggleButtonGroup
                                value={shapeType}
                                exclusive
                                onChange={handleDrawType}
                                size="small"
                                style={{ background: darkMode ? '#121212' : 'white', height: '35px', borderRadius: 7 }}
                            >
                                <MeltaTooltip title={i18next.t('location.circle')}>
                                    <ToggleButton value="circle">
                                        <CircleIcon
                                            sx={{ width: '20px', height: '20px', color: darkMode ? '#9398c2' : '#1E2775', borderRadius: 7 }}
                                        />
                                    </ToggleButton>
                                </MeltaTooltip>
                                <MeltaTooltip title={i18next.t('location.searchByPolygon')}>
                                    <ToggleButton value="polygon">
                                        <PolygonIcon
                                            sx={{ width: '20px', height: '20px', color: darkMode ? '#9398c2' : '#1E2775', borderRadius: 7 }}
                                        />
                                    </ToggleButton>
                                </MeltaTooltip>
                                <MeltaTooltip title={i18next.t('location.line')}>
                                    <ToggleButton value="line">
                                        <DistanceIcon
                                            sx={{ width: '20px', height: '20px', color: darkMode ? '#9398c2' : '#1E2775', borderRadius: 7 }}
                                        />
                                    </ToggleButton>
                                </MeltaTooltip>
                            </ToggleButtonGroup>

                            <IconButtonWithPopover
                                popoverText={i18next.t('location.clear')}
                                iconButtonProps={{
                                    onClick: onClear,
                                }}
                                style={{
                                    background: darkMode ? '#131313' : '#FFFFFF',
                                    borderRadius: '7px',
                                    height: '34px',
                                    opacity: 1,
                                }}
                            >
                                <Close htmlColor={theme.palette.primary.main} />
                            </IconButtonWithPopover>
                        </div>
                        {selectedEntityDialog && (
                            <MapPageEntityDialog
                                open={!!selectedEntityDialog}
                                entityWithMatchingField={selectedEntityDialog}
                                onClose={() => setSelectedEntityDialog(null)}
                                key={selectedEntityDialog.matchingField}
                            />
                        )}
                    </Viewer>
                </Grid>

                {sourceSearchResults.length > 0 && (
                    <Grid width="98%">
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
