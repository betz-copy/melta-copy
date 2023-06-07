/* eslint-disable no-param-reassign */
import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { Box, CircularProgress } from '@mui/material';
import { forceManyBody } from 'd3-force';
import ForceGraph, { ForceGraphMethods, ForceGraphProps, GraphData, NodeObject } from 'react-force-graph-2d';
import ForceGraph3D, { ForceGraphMethods as ForceGraphMethods3D, ForceGraphProps as ForceGraphProps3D } from 'react-force-graph-3d';
import { useQuery, useQueryClient, useQueries } from 'react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import uniqBy from 'lodash.uniqby';
import uniqWith from 'lodash.uniqwith';
import { useSelector } from 'react-redux';

import { expandedEntityToGraphData, getGraphDataWithNodeSizes, getFixedGraphLinks, fixHighlighted, updateNodeLabelIcons } from '../../utils/graph';
import { drawLinkLabel, drawNode, lookAt } from '../../utils/graph/2DCanvas';
import { LinkMiddlePoint3D, create3DLabel, create3DNodeDetails, lookAt3D, scale3DNode } from '../../utils/graph/3DCanvas';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import { IEntityExpanded } from '../../interfaces/entities';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { GraphTopBar } from './GraphTopBar';
import { environment } from '../../globals';
import { PartialRequired, SharedProperties } from '../../utils/typeHelpers';
import { GraphNodeMenu } from './GraphNodeMenu';
import { GraphMenu } from './GraphMenu';
import { RootState } from '../../store';
import { NodeTooltip } from './NodeTooltip';
import { useLocalStorage } from '../../utils/useLocalStorage';

interface genericMenuState {
    node: NodeObject;
    location: {
        top: number;
        left: number;
    };
}

const { graphSettings } = environment;

const Graph: React.FC = () => {
    const ref = useRef<any>(null);
    const forceRef = useRef<ForceGraphMethods | ForceGraphMethods3D | undefined>(undefined);

    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const [shouldZoomToFit, setShouldZoomToFit] = useState(true);
    const [shouldUpdateHighlighted, setShouldUpdateHighlighted] = useState(false);

    const { entityId } = useParams() as { entityId: string };
    const [searchParams, setSearchParams] = useSearchParams();

    const [nodeMenuState, setNodeMenuState] = useState<genericMenuState>();
    const [graphMenuState, setGraphMenuState] = useState<Omit<genericMenuState, 'node'>>();

    const darkMode = useSelector((state: RootState) => state.darkMode);

    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const [filteredEntityTemplates, setFilteredEntityTemplates] = useState<IMongoEntityTemplatePopulated[]>(Array.from(entityTemplates.values()));

    const [load, setLoad] = useState<boolean>(false);
    const reload = () => setLoad(!load);

    const [is3DGraph, setIs3DGraph] = useLocalStorage(graphSettings.is3DViewLocalStorageKey, false);

    const updateGraphSize = () => {
        const mainBox = ref.current?.parentElement;

        if (mainBox) {
            setHeight(mainBox.offsetHeight);
            setWidth(mainBox.offsetWidth);
        }

        return () => { }; // eslint-disable-line prettier/prettier
    };

    window.addEventListener('resize', updateGraphSize);
    useEffect(() => {
        return updateGraphSize();
    }, []);

    const addNewGraphData = (newGraphData: GraphData) => {
        setGraphData((prevGraphData) => {
            const mergedGraphNodes = [...prevGraphData.nodes, ...newGraphData.nodes];
            const mergedGraphLinks = getFixedGraphLinks([...prevGraphData.links, ...newGraphData.links]);

            const uniqueGraphNodes = uniqBy(mergedGraphNodes, ({ id }) => id);
            const uniqueGraphLinks = uniqWith(mergedGraphLinks, (item1, item2) => item1.source === item2.source && item1.target === item2.target);

            // not every link source and target are populated at this point so updating highlighted links on next graph tick
            setShouldUpdateHighlighted(true);

            return getGraphDataWithNodeSizes({
                nodes: uniqueGraphNodes,
                links: uniqueGraphLinks,
            });
        });
    };

    const { refetch: getExpandedEntityById } = useQuery<IEntityExpanded>(
        [
            'getExpandedEntity',
            entityId,
            {
                disabled: false,
                templateIds: filteredEntityTemplates.map((entityTemplate) => entityTemplate._id),
                numberOfConnections: 1,
            },
        ],
        () =>
            getExpandedEntityByIdRequest(entityId, {
                disabled: false,
                templateIds: filteredEntityTemplates.map((entityTemplate) => entityTemplate._id),
                numberOfConnections: 1,
            }),
        {
            enabled: false,
        },
    );

    const expandedParams = JSON.parse(searchParams.get('expandedEntities')!) || {};

    const expandedEntitiesQueries = useQueries(
        Object.keys(expandedParams).map((id) => {
            return {
                queryKey: [
                    'getExpandedEntity',
                    id,
                    {
                        disabled: false,
                        templateIds: filteredEntityTemplates.map((entityTemplate) => entityTemplate._id),
                        numberOfConnections: expandedParams[id],
                    },
                ],
                queryFn: () =>
                    getExpandedEntityByIdRequest(id, {
                        disabled: false,
                        templateIds: filteredEntityTemplates.map((entityTemplate) => entityTemplate._id),
                        numberOfConnections: expandedParams[id],
                    }),
                enabled: false,
            };
        }),
    );

    const setGraphDataOnStart = async () => {
        const { data: initialExpandedEntity } = await getExpandedEntityById();

        const expandedEntityGraphData = getGraphDataWithNodeSizes(
            expandedEntityToGraphData(initialExpandedEntity!, entityTemplates, relationshipTemplates),
        );

        expandedEntityGraphData.nodes.find((node) => node.id === entityId)!.numberOfConnectionsExpanded++;
        setGraphData(expandedEntityGraphData);

        const expandedEntitiesQueriesPromises = await Promise.all(expandedEntitiesQueries.map((query) => query.refetch()));

        expandedEntitiesQueriesPromises.forEach((query) => {
            addNewGraphData(expandedEntityToGraphData(query.data!, entityTemplates, relationshipTemplates));
        });

        const shouldZoom = !(initialExpandedEntity && initialExpandedEntity?.connections.length < 1);
        setShouldZoomToFit(shouldZoom);
    };

    useEffect(() => {
        setGraphDataOnStart();
    }, [entityId, filteredEntityTemplates, load]); // eslint-disable-line react-hooks/exhaustive-deps

    const renderTooltip = (node: NodeObject) => {
        const entityTemplate = entityTemplates.get(node.templateId)!;
        return ReactDOMServer.renderToString(
            <NodeTooltip node={node} entityTemplate={entityTemplate} darkMode={darkMode} />
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
        if (!graphData.nodes.length) return <CircularProgress size={80} />;

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

    return (
        <Box ref={ref} overflow="hidden">
            <GraphTopBar
                entityId={entityId}
                filteredEntityTemplates={filteredEntityTemplates}
                setFilteredEntityTemplates={setFilteredEntityTemplates}
                onReset={() => {
                    setSearchParams({});
                    setFilteredEntityTemplates(Array.from(entityTemplates.values()));
                    reload();
                }}
                set3DView={(is3DView) => {
                    setIs3DGraph(is3DView)
                    setShouldZoomToFit(true);
                }}
                is3DView={is3DGraph}
            />
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
                    addNewGraphData={addNewGraphData}
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
