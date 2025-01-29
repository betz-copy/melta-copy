/* eslint-disable react-hooks/exhaustive-deps */
// import { Viewer, GeoJsonDataSource } from 'resium';
// import { Ion } from 'cesium';

// import React from 'react';

// const ResiumMap = () => {
//     Ion.defaultAccessToken =
//         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjZWI5M2EyNC1lODE3LTQwYTQtYTUxZi00NDlhODAyZDM0NTMiLCJpZCI6MjcwNDM5LCJpYXQiOjE3Mzc0NDk3MzN9.WLi4Zcm4D_PMstHcM3YNMJsw1xPhiNGuJyizwg_4nbg';

//     return (
//         <Viewer full>
//             <GeoJsonDataSource data={data} />
//         </Viewer>
//     );
// };

// export default ResiumMap;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Cartesian3, Color, Ion } from 'cesium';
import {
    Viewer,
    Entity,
    EllipseGraphics,
    PolylineGraphics,
    CesiumMovementEvent,
    PolygonGraphics,
    PointGraphics,
    ImageryLayer,
    BillboardGraphics,
} from 'resium';
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
import { BackendConfigState } from '../../../services/backendConfigService';
import MapPageEntityDialog from './MapPageEntityDialog';

const { maxRadius } = environment.map;

export const BaseLayers: React.FC = () => {
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    if (!config) return <>{i18next.t('location.noLayers')}</>;

    const { mapLayers, textLayers } = config;

    return (
        <>
            {Object.entries(mapLayers).map(([layerName, url]) => (
                <ImageryLayer
                    key={layerName}
                    imageryProvider={
                        new Cesium.UrlTemplateImageryProvider({
                            url,
                        })
                    }
                />
            ))}
            {Object.entries(textLayers).map(([layerName, url]) => (
                <ImageryLayer
                    key={layerName}
                    imageryProvider={
                        new Cesium.UrlTemplateImageryProvider({
                            url,
                        })
                    }
                />
            ))}
        </>
    );
};

const MapPage = () => {
    Ion.defaultAccessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjZWI5M2EyNC1lODE3LTQwYTQtYTUxZi00NDlhODAyZDM0NTMiLCJpZCI6MjcwNDM5LCJpYXQiOjE3Mzc0NDk3MzN9.WLi4Zcm4D_PMstHcM3YNMJsw1xPhiNGuJyizwg_4nbg';

    const queryClient = useQueryClient();
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [drawingMode, setDrawingMode] = useState<'circle' | 'line' | null>(null);
    const [selectedTemplates, setSelectedTemplates] = useState<IMongoEntityTemplatePopulated[]>([]);
    const [searchedEntity, setSearchedEntity] = useState<IEntity>();
    const [searchedEntityTemplate, setSearchedEntityTemplate] = useState<IMongoEntityTemplatePopulated>();
    const [selectedEntity, setSelectedEntity] = useState<{ node: IEntity; matchingField: string } | null>(null);

    const filteredTemplatesIds = useMemo(() => selectedTemplates.map(({ _id }) => _id), [selectedTemplates]);

    const viewerRef = useRef<any>(null);

    const [circleData, setCircleData] = useState<{ center: Cartesian3 | null; radius: number | null; mouseRadius: number | null }>({
        center: null,
        radius: null,
        mouseRadius: null,
    });
    const [lineData, setLineData] = useState<Cartesian3[]>([]);

    const {
        bounds: searchedEntityBounds,
        markers: searchedEntityMarkers,
        polygons: searchedEntityPolygons,
        propertyDefinitions: searchedPropertyDefinitions,
    } = useEntityWithLocationFields({ entityTemplate: searchedEntityTemplate, entity: searchedEntity });

    useEffect(() => {
        setTimeout(() => {
            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;
            const { camera } = viewer;
            if (circleData.center !== null && circleData.radius !== null) {
                const boundingSphere = new Cesium.BoundingSphere(circleData.center, circleData.radius);

                camera.flyToBoundingSphere(boundingSphere, {
                    duration: 1.5,
                    offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), circleData.radius * 2.5),
                });
            } else if (searchedEntityPolygons.length > 0 || searchedEntityMarkers.length > 0) {
                const boundingSphere = new Cesium.BoundingSphere(searchedEntityBounds?.center, searchedEntityBounds?.radius);

                camera.flyToBoundingSphere(boundingSphere, {
                    duration: 1.5,
                    offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), searchedEntityBounds!.radius * 5),
                });
            } else if (circleData.center === null && circleData.radius === null) {
                camera.flyTo({
                    destination: jerusalemCoordinates,
                    duration: 1.5,
                });
            }
        }, 1);
    }, [circleData, searchedEntityPolygons, searchedEntityMarkers]);

    useEffect(() => {
        if (searchedEntity) {
            setSearchedEntityTemplate(entityTemplateMap!.get(searchedEntity.templateId)!);
        }
    }, [searchedEntity]);

    const handleViewerClick = (clickEvent: CesiumMovementEvent) => {
        if (drawingMode === null || !clickEvent.position) return;

        const viewer = viewerRef.current?.cesiumElement;

        if (!viewer) return;
        const { scene } = viewer;
        const cartesian: Cartesian3 = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

        if (cartesian) {
            if (drawingMode === 'circle') {
                if (circleData.center === null || (circleData.center !== null && circleData.radius !== null)) {
                    setCircleData({ center: cartesian, radius: null, mouseRadius: null });
                } else {
                    const radius = Cartesian3.distance(circleData.center, cartesian);
                    setCircleData({ center: circleData.center, radius: radius > maxRadius ? maxRadius : radius, mouseRadius: null });
                    setDrawingMode(null);
                }
            } else if (drawingMode === 'line') {
                setLineData((prev) => [...prev, cartesian]);
            }
        }
    };

    const handleMouseMove = (moveEvent: CesiumMovementEvent) => {
        if (drawingMode === 'circle' && circleData.center !== null && circleData.radius === null) {
            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;
            const { scene } = viewer;
            const cartesian: Cartesian3 = scene.camera.pickEllipsoid(moveEvent.endPosition, scene.globe.ellipsoid);
            const radius = Cartesian3.distance(circleData.center, cartesian);
            setCircleData({ center: circleData.center, radius: null, mouseRadius: radius });
        }
    };

    const { mutateAsync } = useMutation(getEntitiesByLocation, {
        onSuccess: (response) => {
            response.forEach((item) => {
                const { matchingFields, node } = item;
                const entityTemplate = entityTemplateMap!.get(node.templateId)!;

                matchingFields.forEach((matchingField) => {
                    const { type, value } = stringToCoordinates(node.properties[matchingField]);

                    if (type === 'polygon') {
                        return (
                            <Entity
                                name={entityTemplate.displayName}
                                description={cartesian3ToString(value)}
                                onClick={() => {
                                    setSelectedEntity({ matchingField, node });
                                }}
                            >
                                <PolygonGraphics hierarchy={value as Cartesian3[]} material={Color.fromAlpha(Color.BLUE, 0.5)} />
                            </Entity>
                        );
                    }
                    return (
                        <Entity
                            name={entityTemplate.displayName}
                            description={cartesian3ToString(value)}
                            position={value as Cartesian3}
                            onClick={() => {
                                setSelectedEntity({ matchingField, node });
                            }}
                        >
                            <BillboardGraphics image="/public/icons/location.svg" scale={1} verticalOrigin={Cesium.VerticalOrigin.BOTTOM} />
                        </Entity>
                    );
                });
            });
        },
        onError: () => {
            toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
        },
    });

    useEffect(() => {
        // searchResultGroupRef?.current?.clearLayers();
        if (circleData.center !== null && circleData.radius !== null) {
            for (const templateId of filteredTemplatesIds) {
                const { longitude, latitude } = convertToDegrees(circleData.center);

                mutateAsync({
                    textSearch: '',
                    templates: { [templateId]: { filter: {} } },
                    circle: { coordinate: [longitude, latitude], radius: circleData.radius },
                });
            }
        }
    }, [filteredTemplatesIds, circleData]);

    const clearPolygon = () => {
        setCircleData({ center: null, radius: null, mouseRadius: null });
        setLineData([]);
        setDrawingMode(null);
    };

    const handleDrawType = (_event: React.MouseEvent<HTMLElement>, newShape: 'circle' | 'line' | null) => {
        setDrawingMode(newShape);
    };

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <Viewer full ref={viewerRef} id="cesiumContainer" onClick={handleViewerClick} onMouseMove={handleMouseMove}>
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
                    <Entity
                        key={key}
                        name={searchedPropertyDefinitions[key].title}
                        description={cartesian3ToString(polygon)}
                        onClick={() => {
                            setSelectedEntity({ matchingField: key, node: searchedEntity! });
                        }}
                    >
                        <PolylineGraphics positions={[...polygon, polygon[0]]} material={Color.fromCssColorString('#11695a')} width={3} />
                        {polygon.length >= 3 && <PolygonGraphics hierarchy={polygon} material={Color.fromAlpha(Color.GRAY, 0.3)} />}
                        {polygon.map((position) => (
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
                ))}

                {searchedEntityMarkers.map(({ key, position }) => (
                    <Entity
                        key={key}
                        name={searchedPropertyDefinitions[key].title}
                        description={cartesian3ToString(position)}
                        position={Cartesian3.fromDegrees(position.x, position.y, 0)}
                        onClick={() => {
                            setSelectedEntity({ matchingField: key, node: searchedEntity! });
                        }}
                    >
                        <BillboardGraphics image="/public/icons/location.svg" scale={1} verticalOrigin={Cesium.VerticalOrigin.BOTTOM} />
                    </Entity>
                ))}
            </Viewer>

            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '15px' }}>
                <MapFilters
                    selectedTemplates={selectedTemplates}
                    setSelectedTemplates={setSelectedTemplates}
                    moveToEntityLocations={(entity: IEntity) => setSearchedEntity(entity)}
                    entityTemplateMap={entityTemplateMap!}
                    onClear={clearPolygon}
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
            </div>
            {selectedEntity && (
                <MapPageEntityDialog open={!!selectedEntity} entityWithMatchingField={selectedEntity} onClose={() => setSelectedEntity(null)} />
            )}
        </div>
    );
};

export default MapPage;
