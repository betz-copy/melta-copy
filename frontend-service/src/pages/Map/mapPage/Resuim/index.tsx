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
import { Cartesian3, Color } from 'cesium';
import { Viewer, Entity, EllipseGraphics, PolylineGraphics, CesiumMovementEvent, PolygonGraphics, EntityDescription, PointGraphics } from 'resium';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Circle, LinearScale } from '@mui/icons-material';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import MapFilters from '../MapFilters';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IEntity } from '../../../../interfaces/entities';
import { getEntitiesByLocation } from '../../../../services/entitiesService';
import { getEntityTemplateColor } from '../../../../utils/colors';
import { stringToCoordinates } from '../../../../utils/map';
import { EntityProperties } from '../../../../common/EntityProperties';

const ResiumMap = () => {
    const queryClient = useQueryClient();
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);

    const [drawingMode, setDrawingMode] = useState<'circle' | 'line' | null>(null);
    const [selectedTemplates, setSelectedTemplates] = useState<IMongoEntityTemplatePopulated[]>([]);
    const [searchedEntity, setSearchedEntity] = useState<IEntity>();
    const filteredTemplatesIds = useMemo(() => selectedTemplates.map(({ _id }) => _id), [selectedTemplates]);

    const viewerRef = useRef<any>(null);

    const [circleData, setCircleData] = useState<{ center: Cartesian3 | null; radius: number | null }>({
        center: null,
        radius: null,
    });
    const [lineData, setLineData] = useState<Cartesian3[]>([]);

    const handleViewerClick = (clickEvent: CesiumMovementEvent) => {
        if (drawingMode === null || !clickEvent.position) return;

        const viewer = viewerRef.current?.cesiumElement;

        if (!viewer) return;
        const { scene } = viewer;
        const cartesian = scene.camera.pickEllipsoid(clickEvent.position, scene.globe.ellipsoid);

        if (cartesian) {
            if (drawingMode === 'circle') {
                if (circleData.center === null) {
                    setCircleData((prev) => ({ ...prev, center: cartesian }));
                } else {
                    const radius = Cartesian3.distance(circleData.center, cartesian);
                    setCircleData({ center: circleData.center, radius });
                }
            } else if (drawingMode === 'line') {
                setLineData((prev) => [...prev, cartesian]);
            }
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
                            <Entity name={entityTemplate.displayName}>
                                <EntityDescription>
                                    <EntityProperties
                                        entityTemplate={entityTemplate}
                                        properties={node.properties}
                                        mode="normal"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            rowGap: '14px',
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                        viewFirstLineOfLongText
                                    />
                                </EntityDescription>
                                <PolygonGraphics hierarchy={value as Cartesian3[]} material={Color.fromAlpha(Color.BLUE, 0.5)} />
                            </Entity>
                        );
                    }
                    return (
                        <Entity name={entityTemplate.displayName} position={value as Cartesian3}>
                            <EntityDescription>
                                <EntityProperties
                                    entityTemplate={entityTemplate}
                                    properties={node.properties}
                                    mode="normal"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        rowGap: '14px',
                                        alignItems: 'center',
                                        width: '100%',
                                    }}
                                    viewFirstLineOfLongText
                                />
                            </EntityDescription>
                            <PointGraphics color={Color.RED} pixelSize={10} />
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
                mutateAsync({
                    textSearch: '',
                    templates: { [templateId]: { filter: {} } },
                    circle: { coordinate: [circleData.center.x, circleData.center.y], radius: circleData.radius },
                });
            }
        }
    }, [filteredTemplatesIds, circleData]);

    const clearPolygon = () => {
        setCircleData({ center: null, radius: null });
        setLineData([]);
        setDrawingMode(null);
    };

    const handleDrawType = (_event: React.MouseEvent<HTMLElement>, newShape: 'circle' | 'line' | null) => {
        setDrawingMode(newShape);
    };

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <Viewer full ref={viewerRef} id="cesiumContainer" onClick={handleViewerClick}>
                {circleData.center && circleData.radius && (
                    <Entity name={i18next.t('location.circle')} description={circleData.toString()} position={circleData.center}>
                        <EllipseGraphics
                            semiMajorAxis={circleData.radius}
                            semiMinorAxis={circleData.radius}
                            fill={false}
                            outline
                            outlineColor={Color.fromAlpha(Color.GREEN, 0.7)}
                            outlineWidth={10}
                        />
                    </Entity>
                )}

                {lineData.length > 1 && (
                    <Entity name={i18next.t('location.line')} description={lineData.toString()}>
                        <PolylineGraphics positions={lineData} material={Color.RED} width={3} />
                    </Entity>
                )}
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
                    style={{ background: 'white', height: '35px' }}
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
        </div>
    );
};

export default ResiumMap;
