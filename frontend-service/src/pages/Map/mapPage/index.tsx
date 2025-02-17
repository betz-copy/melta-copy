/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cartesian3, Color } from 'cesium';
import { Viewer, Entity, EllipseGraphics, PolylineGraphics, CesiumMovementEvent, PointGraphics } from 'resium';
import * as Cesium from 'cesium';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Circle, LinearScale } from '@mui/icons-material';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import MapFilters from './MapFilters';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';
import { getEntitiesByLocation } from '../../../services/entitiesService';
import { cartesian3ToString, convertToDegrees, jerusalemCoordinates, stringToCoordinates } from '../../../utils/map';
import { useDarkModeStore } from '../../../stores/darkMode';
import { environment } from '../../../globals';
import { useEntityWithLocationFields } from '../../../utils/hooks/useLocation';
import MapPageEntityDialog from './EntityMapDialog';
import { MeltaCoordinate, MeltaPolygon } from '../LocationPreview';
import { BaseLayers } from '../BaseLayers';

const { maxRadius } = environment.map;

const MapPage = () => {
    const queryClient = useQueryClient();
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const viewerRef = useRef<any>(null);

    const [drawingMode, setDrawingMode] = useState<'circle' | 'line' | null>(null);
    const [circleData, setCircleData] = useState<{ center: Cartesian3 | null; radius: number | null; mouseRadius: number | null }>({
        center: null,
        radius: null,
        mouseRadius: null,
    });
    const [lineData, setLineData] = useState<Cartesian3[]>([]);

    const [selectedTemplates, setSelectedTemplates] = useState<IMongoEntityTemplatePopulated[]>([]);
    
    const [searchedEntity, setSearchedEntity] = useState<IEntity | undefined>(undefined);
    const [searchedEntityTemplate, setSearchedEntityTemplate] = useState<IMongoEntityTemplatePopulated | undefined>(undefined);
    const [selectedEntity, setSelectedEntity] = useState<{ node: IEntity; matchingField: string } | null>(null);

    const [searchedPolygons, setSearchedPolygons] = useState<{ key: string; name: string; node: IEntity; position: Cartesian3[] }[]>([]);
    const [searchedMarkers, setSearchedMarkers] = useState<{ key: string; name: string; node: IEntity; position: Cartesian3 }[]>([]);

    const [cameraFocus, setCameraFocus] = useState<'search' | 'circle'>();

    const filteredTemplatesIds = useMemo(() => selectedTemplates.map(({ _id }) => _id), [selectedTemplates]);    

    const {
        bounds: searchedEntityBounds,
        markers: searchedEntityMarkers,
        polygons: searchedEntityPolygons,
        propertyDefinitions: searchedPropertyDefinitions,
    } = useEntityWithLocationFields({ entityTemplate: searchedEntityTemplate, entity: searchedEntity });
   
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

            if(cameraFocus === 'search'){
            if (searchedEntityPolygons.length > 0 || searchedEntityMarkers.length > 0) {
                if (searchedEntityBounds?.center && searchedEntityBounds?.radius) {
                    const boundingSphere = new Cesium.BoundingSphere(searchedEntityBounds.center, searchedEntityBounds.radius);
    
                    camera.flyToBoundingSphere(boundingSphere, {
                        duration: 1.5,
                        offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), searchedEntityBounds.radius * 5),
                    });
                }
            }}
            else {
                if(circleData.center && !circleData.radius) { 
                    const boundingSphere = new Cesium.BoundingSphere(circleData.center, circleData.mouseRadius || 500);
        
                    camera.flyToBoundingSphere(boundingSphere, {
                        duration: 1.5,
                        offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), (circleData.mouseRadius || 1000) * 5 ),
                    });
                }
    
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
    

    const handleViewerClick = useCallback(
        (clickEvent: CesiumMovementEvent) => {
            if (drawingMode === null || !clickEvent.position) return;
    
            const viewer = viewerRef.current?.cesiumElement;
    
            if (!viewer) return;
            const { scene } = viewer;
            const cartesian: Cartesian3 = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);
    
            if (cartesian) {
                if (drawingMode === 'circle') {
                    setCameraFocus('circle');
                    if (circleData.center === null || (circleData.center !== null && circleData.radius !== null)) {
                        setCircleData({ center: cartesian, radius: null, mouseRadius: null });
                    } else {
                        const radius = Cartesian3.distance(circleData.center, cartesian);
                        if (radius > maxRadius) toast.warn(i18next.t('location.radiusMaxLimit'));
                        setCircleData({ center: circleData.center, radius: radius > maxRadius ? maxRadius : radius, mouseRadius: null });
                        setDrawingMode(null);
                    }
                } else if (drawingMode === 'line') {
                    setLineData((prev) => [...prev, cartesian]);
                }
            }
        },
        [drawingMode, viewerRef, circleData, maxRadius, setCircleData, setDrawingMode, setLineData]
    );

    const handleMouseMove = useCallback(
        (moveEvent: CesiumMovementEvent) => {
            if (drawingMode === 'circle' && circleData.center !== null && circleData.radius === null) {
                const viewer = viewerRef.current?.cesiumElement;
                if (!viewer) return;
    
                const { scene } = viewer;
                const cartesian = scene.camera.pickEllipsoid(moveEvent.endPosition, scene.globe.ellipsoid);
    
                if (cartesian) {
                    const radius = Cartesian3.distance(circleData.center, cartesian);
                    setCircleData({ center: circleData.center, radius: null, mouseRadius: radius });
                }
            }
        },
        [drawingMode, circleData, viewerRef, setCircleData]
    );

    const { mutateAsync } = useMutation(getEntitiesByLocation, {
        onSuccess: (response) => {
            response.forEach((item) => {
                const { matchingFields, node } = item;
                const entityTemplate = entityTemplateMap!.get(node.templateId)!;

                matchingFields.forEach((matchingField) => {
                    const { type, value } = stringToCoordinates(node.properties[matchingField]);
                    const name = entityTemplate.properties.properties[matchingField].title;

                    if (type === 'polygon') {
                        setSearchedPolygons((prev) => [
                            ...prev,
                            {
                                key: `${matchingField}-${node.properties._id}`,
                                name,
                                node,
                                position: value as Cartesian3[],
                            },
                        ]);
                        return;
                    }
                    setSearchedMarkers((prev) => [...prev, { key: `${matchingField}-${node.properties._id}`, name, node, position: value as Cartesian3 }]);
                });
            });
        },
        onError: () => {
            toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            if (circleData.center && circleData.radius) {
                const { longitude, latitude } = convertToDegrees(circleData.center);

                await Promise.all(
                    filteredTemplatesIds.map(async (templateId) =>
                        mutateAsync({
                            textSearch: '',
                            templates: { [templateId]: { filter: {} } },
                            circle: { coordinate: [latitude, longitude], radius: circleData.radius! },
                        }),
                    ),
                );
            }
        };

        fetchData();
    }, [filteredTemplatesIds, circleData]);

    const clearAutocompleteSearch = () => {
        setSearchedEntity(undefined);
        setSearchedEntityTemplate(undefined);
    }

    const onClear = () => {
        setCircleData({ center: null, radius: null, mouseRadius: null });
        setLineData([]);
        setDrawingMode(null);
        setSearchedMarkers([]);
        setSearchedPolygons([]);
        clearAutocompleteSearch();
    };

    const handleDrawType = (_event: React.MouseEvent<HTMLElement>, newShape: 'circle' | 'line' | null) => {
        setDrawingMode(newShape);
    };

    return (
        <div style={{ height: '100vh', width: '100%' }}>
         <Viewer
            full
            ref={viewerRef}
            onClick={handleViewerClick}
            onMouseMove={handleMouseMove}
            baseLayerPicker={false}
            animation={false}
            timeline={false}
            geocoder={false}
            homeButton={false}
            sceneModePicker={false}
            vrButton={false}
            fullscreenButton={false}
            >
                {circleData.center && (circleData.radius || circleData.mouseRadius) && (
                    <Entity
                        name={i18next.t('location.circle')}
                        description={`${cartesian3ToString(circleData.center)}, ${circleData.radius}`}
                        position={circleData.center}
                    >
                        <EllipseGraphics
                            semiMajorAxis={circleData.radius ?? circleData.mouseRadius!}
                            semiMinorAxis={circleData.radius ?? circleData.mouseRadius!}
                            fill={false}
                            outline
                            outlineColor={Color.fromAlpha(Color.RED, 0.7)}
                            outlineWidth={10}
                        />
                        {circleData.mouseRadius && <PointGraphics color={Color.RED} pixelSize={10} />}
                    </Entity>
                )}

                {lineData.length > 1 && (
                    <Entity name={i18next.t('location.line')} description={`${Cartesian3.distance(lineData[0], lineData[lineData.length - 1])} km`}>
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
                            setSelectedEntity({ matchingField: key, node: searchedEntity! });
                        }}
                    />
                ))}

                {searchedEntityMarkers.map(({ key, position }) => (
                    <MeltaCoordinate
                        key={key}
                        name={searchedPropertyDefinitions[key].title}
                        position={Cartesian3.fromDegrees(position.x, position.y)}
                        onClick={() => {
                            setSelectedEntity({ matchingField: key, node: searchedEntity! });
                        }}
                    />
                ))}

                {searchedPolygons.map(({ key, name, position: polygon, node }) => (
                    <MeltaPolygon
                        key={key}
                        name={name}
                        polygon={polygon}
                        onClick={() => {
                            setSelectedEntity({ matchingField: key, node });
                        }}
                    />
                ))}

                {searchedMarkers.map(({ key, name, position, node }) => (
                    <MeltaCoordinate
                        key={key}
                        name={name}
                        position={Cartesian3.fromDegrees(position.x, position.y)}
                        onClick={() => {
                            setSelectedEntity({ matchingField: key, node });
                        }}
                    />
                ))}
            </Viewer>

            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '15px' }}>
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
                />

                <ToggleButtonGroup
                    value={drawingMode}
                    exclusive
                    onChange={handleDrawType}
                    size="small"
                    style={{ background: darkMode ? '#121212' : 'white', height: '35px' }}
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

                <BaseLayers viewerRef={viewerRef} />
            </div>
            {selectedEntity && (
                <MapPageEntityDialog open={!!selectedEntity} entityWithMatchingField={selectedEntity} onClose={() => setSelectedEntity(null)} />
            )}
        </div>
    );
};

export default MapPage;
