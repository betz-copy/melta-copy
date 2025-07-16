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
import { toast } from 'react-toastify';
import { useParams } from 'wouter';
import { environment } from '../../globals';
import { ICategoryMap, IMongoCategory } from '../../interfaces/categories';
import { IEntityExpanded, IGraphFilterBody, IGraphFilterBodyBatch } from '../../interfaces/entities';
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
import { ILinkObject, INodeObject } from '../../customTypes';
import { IChildTemplateMap } from '../../interfaces/childTemplates';

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

    const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>({});
    const [filters, setFilters] = useState<number[]>([]);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childEntityTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const [filteredEntityTemplates, setFilteredEntityTemplates] = useState<IMongoEntityTemplatePopulated[]>([
        ...entityTemplates.values(),
        ...childEntityTemplates.values(),
    ]);

    const [load, setLoad] = useState<boolean>(false);
    const reload = () => setLoad(!load);
    const [is3DGraph, setIs3DGraph] = useLocalStorage(graphSettings.is3DViewLocalStorageKey, false);
    const [initialExpandedEntity, setInitialExpandedEntity] = useState<{ entity?: IEntityExpanded; expand?: boolean }>();
    const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const templateOptions = [...entityTemplates.values(), ...childEntityTemplates.values()];
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
        setInitialExpandedEntity({ entity: data, expand: !resetData });
        if (resetData) {
            setGraphData({ nodes: [], links: [] });
            setCurrentBatchIndex(0);
        }
    };

    const graphEntityTemplateIds = uniqBy(graphData.nodes as INodeObject[], ({ templateId }) => templateId).map((element) => element.templateId);
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

    const expandedParams = {
        [entityId]: 1,
        ...JSON.parse(searchParams.get('expandedEntities')!),
    };

    const { refetch: getExpandedEntityById, error } = useQuery<IEntityExpanded>(
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
        if (!initialExpandedEntity?.expand) {
            const { data } = await getExpandedEntityById();
            if (data && data.connections.length !== initialExpandedEntity?.entity?.connections.length) expandedEntity = data;
        }

        setIsLoading(expandedEntity !== undefined);

        const nextBatch = currentBatchIndex + BatchSize;
        let expandedEntityGraphData = await expandedEntityToGraphData(
            {
                ...expandedEntity,
                connections:
                    expandedEntity?.connections?.slice(
                        currentBatchIndex,
                        nextBatch > expandedEntity!.connections.length ? expandedEntity!.connections.length : nextBatch,
                    ) ?? [],
                entity: expandedEntity!.entity,
            },
            entityTemplates,
            childEntityTemplates,
            relationshipTemplates,
        );

        if (initialExpandedEntity?.expand) expandedEntityGraphData = getGraphDataWithNodeSizes(expandedEntityGraphData);

        const currEntityExpand = (expandedEntityGraphData.nodes as INodeObject[]).find((node) => node.id === entityId);
        if (currEntityExpand) currEntityExpand.numberOfConnectionsExpanded++;

        return { expandedEntityGraphData, expandedEntity };
    };

    const loadNextBatch = async () => {
        const { expandedEntityGraphData, expandedEntity } = await createGraphData();

        const shouldZoom = !(expandedEntity && expandedEntity?.connections.length < 1);

        addNewGraphData(expandedEntityGraphData);
        setShouldZoomToFit(shouldZoom);

        const nextBatch = currentBatchIndex + BatchSize;

        if (currentBatchIndex < expandedEntity!.connections.length && ((is3DGraph && currentBatchIndex < limit3DConnections) || !is3DGraph))
            if (nextBatch > expandedEntity!.connections.length) setCurrentBatchIndex(expandedEntity!.connections.length);
            else setCurrentBatchIndex(nextBatch);
        else {
            setIsLoading(false);
            if (is3DGraph && currentBatchIndex < expandedEntity!.connections.length) toast.warning(i18next.t('graph.limitWarning'));
        }
    };

    useEffect(() => {
        loadNextBatch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentBatchIndex, initialExpandedEntity, is3DGraph, entityId, filteredEntityTemplates, load, filterRecord]);

    const renderTooltip = (node: NodeObject) => {
        const entityTemplate = entityTemplates.get(node.templateId)!;

        return ReactDOMServer.renderToString(
            <NodeTooltip
                node={node}
                entityTemplate={
                    entityTemplate ?? [...childEntityTemplates.values()].find(({ parentTemplate }) => parentTemplate._id === node.templateId)
                }
                darkMode={darkMode}
                entityTemplates={entityTemplate ? entityTemplates : childEntityTemplates}
            />,
        );
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
        nodeLabel: (node) => renderTooltip(node),
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
        if (is3DGraph) {
            return (
                <ForceGraph3D
                    {...commonGraphProps}
                    ref={forceRef as React.MutableRefObject<ForceGraphMethods3D>}
                    rendererConfig={{ powerPreference: 'low-power', precision: 'lowp' }}
                    linkDirectionalArrowLength={4}
                    linkDirectionalParticleWidth={(link) => ((link as ILinkObject).highlighted ? 2.5 : 0)}
                    linkWidth={(link) => ((link as ILinkObject).highlighted ? 1 : 0.5)}
                    linkDirectionalParticleResolution={6}
                    linkOpacity={0.45}
                    nodeResolution={16}
                    nodeThreeObjectExtend
                    nodeThreeObject={(node) =>
                        create3DNodeDetails(
                            node as INodeObject,
                            entityTemplates.get((node as INodeObject).templateId)! ||
                                [...childEntityTemplates.values()].find(({ parentTemplate }) => parentTemplate._id === node.templateId),
                            entityId === (node as INodeObject).data._id,
                            darkMode,
                        )
                    }
                    linkThreeObjectExtend
                    linkThreeObject={(link) => {
                        const labelText = relationshipTemplates.get((link as ILinkObject).templateId)!.displayName;

                        const { label } = create3DLabel(labelText, graphSettings.linkLabelFontSize);
                        return label;
                    }}
                    linkPositionUpdate={(sprite, { start, end }) => {
                        sprite.position.set(LinkMiddlePoint3D(start.x, end.x), LinkMiddlePoint3D(start.y, end.y), LinkMiddlePoint3D(start.z, end.z));
                        return false;
                    }}
                    onNodeClick={(node) => {
                        lookAt3D(node as INodeObject, forceRef.current as ForceGraphMethods3D);
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
                    const entityTemplate =
                        entityTemplates.get((node as INodeObject).templateId)! ||
                        [...childEntityTemplates.values()].find(({ parentTemplate }) => parentTemplate._id === (node as INodeObject).templateId);

                    updateNodeLabelIcons(node as INodeObject, entityId === (node as INodeObject).data._id);
                    drawNode(ctx, node as PartialRequired<NodeObject, 'x' | 'y' | 'nodeSize'>, entityTemplate);
                }}
                linkCanvasObjectMode={() => 'after'}
                linkCanvasObject={(link, ctx) => {
                    const label = relationshipTemplates.get((link as ILinkObject).templateId)?.displayName || '';

                    drawLinkLabel(link as ILinkObject, label, ctx);
                }}
                onNodeClick={(node) => {
                    lookAt(node as INodeObject, forceRef.current as ForceGraphMethods);
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
            <GraphTopBar
                entityId={entityId}
                filteredEntityTemplates={filteredEntityTemplates}
                setFilteredEntityTemplates={setFilteredEntityTemplates}
                onReset={() => {
                    setSearchParams({});
                    setFilteredEntityTemplates([...entityTemplates.values(), ...childEntityTemplates.values()]);
                    reload();
                    setFilters([]);
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
                        templates={[...entityTemplates.values(), ...childEntityTemplates.values()]}
                        selectedTemplates={filteredEntityTemplates}
                        setSelectedTemplates={
                            setFilteredEntityTemplates as React.Dispatch<React.SetStateAction<(IMongoEntityTemplatePopulated | IMongoCategory)[]>>
                        }
                        categories={Array.from(categories.values())}
                        setOpenFilter={setOpenFilter}
                        openFilter={openFilter}
                        onClick={() => resetGraph(undefined, true)}
                    />
                </Box>
                <Backdrop open={(isLoading || !graphData.nodes.length) && !error} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <CircularProgress />
                </Backdrop>
                {openFilter && (
                    <Button
                        sx={{ marginRight: 'auto', zIndex: '100' }}
                        onClick={addNewFilter}
                        startIcon={<BsFillPlusCircleFill style={{ marginLeft: '5px' }} />}
                    >
                        {i18next.t('graph.filterEntity')}
                    </Button>
                )}
                {openFilter && (
                    <Box style={{ flex: '1 1 0', overflowY: 'auto', height: '0px' }}>
                        <GraphFilterBatch
                            templateOptions={templateOptions}
                            filterRecord={filterRecord}
                            setFilterRecord={(value: IGraphFilterBody, filterKey: number) =>
                                setFilterRecord((prev) => ({
                                    ...prev,
                                    [filterKey]: {
                                        ...value,
                                    },
                                }))
                            }
                            onRemoveFilter={(filterKey: number) => {
                                setFilterRecord((prev) => {
                                    const { [filterKey]: deletedFilter, ...restFilters } = prev;
                                    return restFilters;
                                });
                            }}
                            filters={filters}
                            setFilters={setFilters}
                            graphEntityTemplateIds={graphEntityTemplateIds}
                            onFilter={() => resetGraph(undefined, true)}
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
                        const mainNode = graphData.nodes.find((node) => node.id === entityId)! as INodeObject;

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
