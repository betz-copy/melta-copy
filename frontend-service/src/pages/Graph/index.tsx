/* eslint-disable no-param-reassign */
import { Backdrop, Box, Button, CircularProgress } from '@mui/material';
import { forceManyBody } from 'd3-force';
import i18next from 'i18next';
import uniqBy from 'lodash.uniqby';
import uniqWith from 'lodash.uniqwith';
import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import ForceGraph, { ForceGraphMethods, ForceGraphProps, GraphData, NodeObject } from 'react-force-graph-2d';
import ForceGraph3D, { ForceGraphMethods as ForceGraphMethods3D, ForceGraphProps as ForceGraphProps3D } from 'react-force-graph-3d';
import { BsFillPlusCircleFill } from 'react-icons/bs';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { ICategoryMap } from '../../interfaces/categories';
import { IEntityExpanded, IGraphFilterBodyBatch } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { useDarkModeStore } from '../../stores/darkMode';
import { expandedEntityToGraphData, fixHighlighted, getFixedGraphLinks, getGraphDataWithNodeSizes, updateNodeLabelIcons } from '../../utils/graph';
import { drawLinkLabel, drawNode, lookAt } from '../../utils/graph/2DCanvas';
import { create3DLabel, create3DNodeDetails, LinkMiddlePoint3D, lookAt3D, scale3DNode } from '../../utils/graph/3DCanvas';
import { useLocalStorage } from '../../utils/hooks/useLocalStorage';
import { useSearchParams } from '../../utils/hooks/useSearchParams';
import { PartialRequired, SharedProperties } from '../../utils/typeHelpers';
import { GraphFilterBatch } from './GraphFilterBatch';
import { GraphMenu } from './GraphMenu';
import { GraphNodeMenu } from './GraphNodeMenu';
import { GraphTopBar } from './GraphTopBar';
import { NodeTooltip } from './NodeTooltip';
import TemplatesSelectGrid from './templatesSelectGrid';

interface genericMenuState {
    node: NodeObject;
    location: {
        top: number;
        left: number;
    };
}

const { graphSettings } = environment;
const { BatchSize, limit3DConnections } = graphSettings;

const Graph: React.FC = () => {
    const ref = useRef<any>(null);
    const forceRef = useRef<ForceGraphMethods | ForceGraphMethods3D | undefined>(undefined);

    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const [shouldZoomToFit, setShouldZoomToFit] = useState(true);
    const [shouldUpdateHighlighted, setShouldUpdateHighlighted] = useState(false);

    const { entityId } = useParams<{ entityId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const [nodeMenuState, setNodeMenuState] = useState<genericMenuState>();
    const [graphMenuState, setGraphMenuState] = useState<Omit<genericMenuState, 'node'>>();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const [filteredEntityTemplates, setFilteredEntityTemplates] = useState<IMongoEntityTemplatePopulated[]>(Array.from(entityTemplates.values()));
    const [load, setLoad] = useState<boolean>(false);
    const reload = () => setLoad(!load);
    const [is3DGraph, setIs3DGraph] = useLocalStorage(graphSettings.is3DViewLocalStorageKey, false);
    const [initialExpandedEntity, setInitialExpandedEntity] = useState<{ entity?: IEntityExpanded; menu?: boolean }>();
    const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const templateOptions = Array.from(entityTemplates.values());
    const updateGraphSize = () => {
        const mainBox = ref.current?.parentElement;

        if (mainBox) {
            setHeight(mainBox.offsetHeight);
            setWidth(mainBox.offsetWidth);
        }

        return () => {};
    };

    window.addEventListener('resize', updateGraphSize);
    useEffect(() => {
        return updateGraphSize();
    }, []);

    const resetGraph = (data?: IEntityExpanded, resetData?: true) => {
        setInitialExpandedEntity({ entity: data, menu: false });
        setCurrentBatchIndex(0);

        if (resetData) setGraphData({ nodes: [], links: [] });
    };

    const graphEntityTemplateIds = uniqBy(graphData.nodes, ({ templateId }) => templateId).map((element) => element.templateId);
    const addNewGraphData = (newGraphData: GraphData) => {
        setGraphData((prevGraphData) => {
            const mergedGraphNodes = [...prevGraphData.nodes, ...newGraphData.nodes];
            const mergedGraphLinks = getFixedGraphLinks([...prevGraphData.links, ...newGraphData.links]);

            const uniqueGraphNodes = uniqBy(mergedGraphNodes, ({ id }) => id);
            const uniqueGraphLinks = uniqWith(mergedGraphLinks, (item1, item2) => item1.source === item2.source && item1.target === item2.target);

            setShouldUpdateHighlighted(true);
            return getGraphDataWithNodeSizes({
                nodes: uniqueGraphNodes,
                links: uniqueGraphLinks,
            });
        });
    };

    const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>({});
    const [filters, setFilters] = useState<number[]>([]);

    const expandedParams = {
        [entityId]: 1,
        ...JSON.parse(searchParams.get('expandedEntities')!),
    };

    const { refetch: getExpandedEntityById } = useQuery<IEntityExpanded>(
        [
            'getExpandedEntity',
            entityId,
            expandedParams,
            {
                disabled: false,
                templateIds: filteredEntityTemplates.map((entityTemplate) => entityTemplate._id),
            },
            filterRecord,
        ],
        () =>
            getExpandedEntityByIdRequest(
                entityId,
                expandedParams,
                {
                    disabled: false,
                    templateIds: filteredEntityTemplates.map((entityTemplate) => entityTemplate._id),
                },
                filterRecord,
            ),
        {
            enabled: false,
        },
    );

    const createGraphData = async () => {
        let expandedEntity = initialExpandedEntity?.entity;
        const { data } = await getExpandedEntityById();
        const startIndex = currentBatchIndex * BatchSize;
        setIsLoading(true);

        if (data?.connections.length !== initialExpandedEntity?.entity?.connections.length) {
            expandedEntity = data;
            resetGraph(data, true);
        }

        let expandedEntityGraphData = await expandedEntityToGraphData(
            {
                ...expandedEntity,
                connections: expandedEntity?.connections?.slice(startIndex, startIndex + BatchSize) ?? [],
                entity: expandedEntity!.entity,
            },
            entityTemplates,
            relationshipTemplates,
        );

        if (!initialExpandedEntity?.menu) expandedEntityGraphData = getGraphDataWithNodeSizes(expandedEntityGraphData);

        expandedEntityGraphData.nodes.find((node) => node.id === entityId)!.numberOfConnectionsExpanded++;

        return { expandedEntityGraphData, expandedEntity };
    };

    const loadNextBatch = async () => {
        const { expandedEntityGraphData, expandedEntity } = await createGraphData();
        const shouldZoom = !(expandedEntity && expandedEntity?.connections.length < 1);

        addNewGraphData(expandedEntityGraphData);
        setShouldZoomToFit(shouldZoom);

        if (
            currentBatchIndex * BatchSize < expandedEntity!.connections.length &&
            ((is3DGraph && currentBatchIndex * BatchSize < limit3DConnections) || !is3DGraph)
        )
            setCurrentBatchIndex(currentBatchIndex + 1);
        else {
            setIsLoading(false);
            if (is3DGraph && currentBatchIndex * BatchSize < expandedEntity!.connections.length) toast.warning(i18next.t('graph.limitWarning'));
        }
    };

    useEffect(() => {
        loadNextBatch();
    }, [currentBatchIndex, initialExpandedEntity?.menu, is3DGraph, entityId, filteredEntityTemplates, load, filterRecord]);

    const renderTooltip = (node: NodeObject) => {
        const entityTemplate = entityTemplates.get(node.templateId)!;
        return ReactDOMServer.renderToString(<NodeTooltip node={node} entityTemplate={entityTemplate} darkMode={darkMode} />);
    };

    // manage forces in graph
    if (!is3DGraph) {
        forceRef.current?.d3Force('node', forceManyBody().strength(-100).distanceMin(50).distanceMax(400));
    }

    const commonGraphProps: SharedProperties<ForceGraphProps, ForceGraphProps3D> = {
        height,
        width,
        graphData,
        nodeVal: 'nodeSize',
        nodeRelSize: graphSettings.nodeSizeMultiplier,
        cooldownTicks: 50,
        backgroundColor: 'rgb(0,0,0,0)',
        nodeLabel: renderTooltip,
        linkDirectionalArrowRelPos: 1,
        linkDirectionalArrowLength: 3,
        linkDirectionalParticles: 4,
        linkDirectionalParticleWidth: (link) => (link.highlighted ? 4 : 0),
        linkWidth: (link) => (link.highlighted ? 4 : 1),
        nodeColor: (node) => node.color,
        linkColor: (link) => link.color,
        onEngineTick: () => {
            if (shouldUpdateHighlighted) {
                fixHighlighted(graphData);
                setShouldUpdateHighlighted(false);
            }
        },
        onEngineStop: () => {
            if (shouldZoomToFit) {
                forceRef.current?.zoomToFit(400);
                setShouldZoomToFit(false);
            }
        },
        onNodeRightClick: (node, event) => {
            forceRef.current?.pauseAnimation();
            setNodeMenuState({ node, location: { top: event.clientY, left: event.clientX } });
        },
        onBackgroundRightClick: (event) => {
            forceRef.current?.pauseAnimation();
            setGraphMenuState({ location: { top: event.clientY, left: event.clientX } });
        },
        onNodeHover: (node, prevNode) => {
            if (node) {
                node.nodeSize! *= graphSettings.nodeHoverSizeMultiplier;
                scale3DNode(node);
            }
            if (prevNode) {
                prevNode.nodeSize! /= graphSettings.nodeHoverSizeMultiplier;
                scale3DNode(prevNode);
            }
        },
    };
    const getGraph = () => {
        if (!graphData.nodes.length)
            return (
                <Box display="flex" justifyContent="center" alignContent="center" height="100%">
                    <CircularProgress size={80} />
                </Box>
            );

        if (is3DGraph) {
            return (
                <ForceGraph3D
                    {...commonGraphProps}
                    ref={forceRef as React.MutableRefObject<ForceGraphMethods3D>}
                    rendererConfig={{ powerPreference: 'low-power', precision: 'lowp' }}
                    linkDirectionalArrowLength={4}
                    linkDirectionalParticleWidth={(link) => (link.highlighted ? 2.5 : 0)}
                    linkWidth={(link) => (link.highlighted ? 1 : 0.5)}
                    linkDirectionalParticleResolution={6}
                    linkOpacity={0.45}
                    nodeResolution={16}
                    nodeThreeObjectExtend
                    nodeThreeObject={(node) => create3DNodeDetails(node, entityTemplates.get(node.templateId)!, entityId === node.data._id, darkMode)}
                    linkThreeObjectExtend
                    linkThreeObject={(link) => {
                        const labelText = relationshipTemplates.get(link.templateId)!.displayName;

                        const { label } = create3DLabel(labelText, graphSettings.linkLabelFontSize);
                        return label;
                    }}
                    linkPositionUpdate={(sprite, { start, end }) => {
                        sprite.position.set(LinkMiddlePoint3D(start.x, end.x), LinkMiddlePoint3D(start.y, end.y), LinkMiddlePoint3D(start.z, end.z));
                        return false;
                    }}
                    onNodeClick={(node) => {
                        lookAt3D(node, forceRef.current as ForceGraphMethods3D);
                    }}
                />
            );
        }

        return (
            <ForceGraph
                {...(commonGraphProps as ForceGraphProps)}
                ref={forceRef as React.MutableRefObject<ForceGraphMethods>}
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node, ctx) => {
                    const entityTemplate = entityTemplates.get(node.templateId)!;

                    updateNodeLabelIcons(node, entityId === node.data._id);
                    drawNode(ctx, node as PartialRequired<NodeObject, 'x' | 'y' | 'nodeSize'>, entityTemplate);
                }}
                linkCanvasObjectMode={() => 'after'}
                linkCanvasObject={(link, ctx) => {
                    const label = relationshipTemplates.get(link.templateId)?.displayName || '';

                    drawLinkLabel(link, label, ctx);
                }}
                onNodeClick={(node) => {
                    lookAt(node, forceRef.current as ForceGraphMethods);
                }}
            />
        );
    };

    const [openFilter, setOpenFilter] = useState<boolean>(false);
    const addNewFilter = () => {
        setFilters((prevFilters) => [...prevFilters, Date.now()]);
    };

    const onSuccessExpandGraph = (data: IEntityExpanded) => {
        if (initialExpandedEntity?.entity !== data) resetGraph(data);
    };

    return (
        <Box ref={ref} position="relative" height="100%" width="100%">
            <Backdrop open={isLoading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <CircularProgress />
            </Backdrop>
            <GraphTopBar
                entityId={entityId}
                filteredEntityTemplates={filteredEntityTemplates}
                setFilteredEntityTemplates={setFilteredEntityTemplates}
                onReset={() => {
                    setSearchParams({});
                    setFilteredEntityTemplates(Array.from(entityTemplates.values()));
                    reload();
                    setFilters([]);
                    setFilterRecord({});
                    resetGraph(undefined, true);
                }}
                set3DView={(is3DView) => {
                    setIs3DGraph(is3DView);
                    setShouldZoomToFit(true);
                    setCurrentBatchIndex(0);
                    setGraphData({ nodes: [], links: [] });
                }}
                is3DView={is3DGraph}
            />
            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '90vh',
                    top: '5rem',
                    position: 'absolute',
                    right: 30,
                    gap: '10px',
                }}
            >
                <Box style={{ flex: '0 0 auto' }}>
                    <TemplatesSelectGrid
                        templates={Array.from(entityTemplates.values())}
                        selectedTemplates={filteredEntityTemplates}
                        setSelectedTemplates={setFilteredEntityTemplates}
                        categories={Array.from(categories.values())}
                        setOpenFilter={setOpenFilter}
                        openFilter={openFilter}
                    />
                </Box>
                {openFilter && (
                    <Button
                        sx={{
                            '&:hover': {
                                backgroundColor: 'transparent',
                            },
                            marginRight: 'auto',
                            zIndex: '100',
                            display: 'flex',
                            alignItems: 'center',
                            bottom: 0,
                        }}
                        onClick={addNewFilter}
                    >
                        <BsFillPlusCircleFill style={{ marginLeft: '5px' }} />
                        {i18next.t('graph.filterEntity')}
                    </Button>
                )}
                {openFilter && (
                    <Box style={{ flex: '1 1 0', overflowY: 'auto', height: '0px' }}>
                        <GraphFilterBatch
                            templateOptions={templateOptions}
                            filterRecord={filterRecord}
                            setFilterRecord={setFilterRecord}
                            filters={filters}
                            setFilters={setFilters}
                            graphEntityTemplateIds={graphEntityTemplateIds}
                        />
                    </Box>
                )}
            </Box>
            <Box height="94vh">{getGraph()}</Box>
            {nodeMenuState && (
                <GraphNodeMenu
                    graphData={graphData}
                    filteredEntityTemplates={filteredEntityTemplates}
                    node={nodeMenuState.node}
                    location={nodeMenuState.location}
                    onCloseMenu={() => {
                        forceRef.current?.resumeAnimation();
                        setNodeMenuState(undefined);
                    }}
                    filterRecord={filterRecord}
                    onSuccessExpandGraph={(data: IEntityExpanded) => onSuccessExpandGraph(data)}
                />
            )}
            {graphMenuState && (
                <GraphMenu
                    graphData={graphData}
                    location={graphMenuState.location}
                    onCloseMenu={() => {
                        forceRef.current?.resumeAnimation();
                        setGraphMenuState(undefined);
                    }}
                    onCenterMain={() => {
                        const mainNode = graphData.nodes.find((node) => node.id === entityId)!;

                        if (is3DGraph) {
                            lookAt3D(mainNode, forceRef.current as ForceGraphMethods3D);
                        } else {
                            lookAt(mainNode, forceRef.current as ForceGraphMethods);
                        }
                    }}
                />
            )}
        </Box>
    );
};

export default Graph;
