/* eslint-disable no-param-reassign */
import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { Box, CircularProgress, Grid } from '@mui/material';
import { forceManyBody } from 'd3-force';
import ForceGraph, { ForceGraphMethods, GraphData, LinkObject, NodeObject } from 'react-force-graph-2d';
import { useQuery, useQueryClient, useQueries } from 'react-query';
import randomColor from 'randomcolor';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { GraphNodeMenu } from './GraphNodeMenu';
import { GraphMenu } from './GraphMenu';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntityExpanded } from '../../../interfaces/entities';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../../services/entitiesService';
import {
    drawNodeLabel,
    drawLinkLabel,
    expandedEntityToGraphData,
    getGraphDataWithNodeSizes,
    getFixedGraphLinks,
    drawNode,
    fixHighlighted,
} from '../../../utils/graph';
import { EntityProperties } from '../../../common/EntityProperties';
import { uniqByFunction } from '../../../utils/object';
import { environment } from '../../../globals';
import { PartialRequired } from '../../../utils/typeHelpers';
import { GraphTopBar } from './GraphTopBar';

const Graph: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const ref = useRef<any>(null);

    const [updateHighlighted, setUpdateHighlighted] = useState(false);

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const { entityId } = useParams() as { entityId: string };
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [nodeMenuState, setNodeMenuState] = useState<{ showMenu: boolean; top?: number; left?: number; node?: NodeObject }>({
        showMenu: false,
    });
    const [menuState, setMenuState] = useState<{ showMenu: boolean; top?: number; left?: number }>({
        showMenu: false,
    });

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!;
    const templateIds = entityTemplates.map((entityTemplate) => entityTemplate._id);

    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [loadAgain, setLoadAgain] = useState<boolean>(false);

    const updateGraphSize = () => {
        const mainBox = ref.current?.parentElement;

        if (mainBox) {
            setHeight(mainBox.offsetHeight);
            setWidth(mainBox.offsetWidth);
        }
    };

    window.addEventListener('resize', updateGraphSize);
    useEffect(() => {
        updateGraphSize();
    }, []);

    useEffect(() => setTitle(''), [setTitle]);

    const addNewGraphData = (newGraphData: GraphData) => {
        setGraphData((prevGraphData) => {
            const mergedGraphNodes = [...prevGraphData.nodes, ...newGraphData.nodes];
            const mergedGraphLinks = getFixedGraphLinks([...prevGraphData.links, ...newGraphData.links]);

            const uniqueGraphNodes = uniqByFunction(mergedGraphNodes, (item1, item2) => item1.id === item2.id);
            const uniqueGraphLinks = uniqByFunction(
                mergedGraphLinks,
                (item1, item2) => item1.source === item2.source && item1.target === item2.target,
            );

            // not every link source and target are populated at this point so updating highlighted links on next graph tick
            setUpdateHighlighted(true);

            return getGraphDataWithNodeSizes({
                nodes: uniqueGraphNodes,
                links: uniqueGraphLinks,
            });
        });
    };

    const forceRef = useRef<ForceGraphMethods | undefined>(undefined);
    const [shouldZoomToFit, setShouldZoomToFit] = useState(true);

    const { refetch: getExpandedEntityById } = useQuery<IEntityExpanded>(
        [
            'getExpandedEntity',
            entityId,
            {
                disabled: false,
                templateIds,
                numberOfConnections: 1,
            },
        ],
        () =>
            getExpandedEntityByIdRequest(entityId, {
                disabled: false,
                templateIds,
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
                        templateIds,
                        numberOfConnections: expandedParams[id],
                    },
                ],
                queryFn: () =>
                    getExpandedEntityByIdRequest(id, {
                        disabled: false,
                        templateIds,
                        numberOfConnections: expandedParams[id],
                    }),
                enabled: false,
            };
        }),
    );

    useEffect(() => {
        const setGraphDataOnStart = async () => {
            const { data: initialExpandedEntity } = await getExpandedEntityById();

            const expandedEntityGraphData = getGraphDataWithNodeSizes(expandedEntityToGraphData(initialExpandedEntity!, relationshipTemplates));
            expandedEntityGraphData.nodes.find((node) => node.id === entityId)!.numberOfConnectionsExpanded++;
            setGraphData(expandedEntityGraphData);

            const expandedEntitiesQueriesPromises = await Promise.all(expandedEntitiesQueries.map((query) => query.refetch()));

            expandedEntitiesQueriesPromises.forEach((query) => {
                addNewGraphData(expandedEntityToGraphData(query.data!, relationshipTemplates));
            });
            setLoadAgain(false);
            setShouldZoomToFit(true);
        };

        setGraphDataOnStart();
    }, [entityId, loadAgain]); // eslint-disable-line react-hooks/exhaustive-deps

    const renderTooltip = (node: NodeObject) => {
        const entityTemplate = entityTemplates.find((template) => template._id === node.templateId)!;
        return ReactDOMServer.renderToString(<EntityProperties properties={node.data} showPreviewPropertiesOnly entityTemplate={entityTemplate} />);
    };

    const getNodeColor = (node: NodeObject) => {
        const entityTemplate = entityTemplates.find((template) => template._id === node.templateId)!;

        return randomColor({ hue: entityTemplate.category.color || '#000000', seed: entityTemplate.name });
    };

    const getLinkColor = (link: LinkObject) => {
        const relationshipTemplate = relationshipTemplates.find((template) => template._id === link.templateId)!;

        return randomColor({ luminosity: 'dark', seed: relationshipTemplate.name });
    };

    // manage forces in graph
    forceRef.current?.d3Force('node', forceManyBody().strength(-100).distanceMin(50).distanceMax(400));

    return (
        <Box ref={ref} overflow="hidden">
            <GraphTopBar
                entityId={entityId}
                onReset={() => {
                    setSearchParams({});
                    setLoadAgain(true);
                }}
            />
            <Grid height="94vh">
                {graphData.nodes.length === 0 ? (
                    <CircularProgress size={80} />
                ) : (
                    <ForceGraph
                        height={height}
                        width={width}
                        ref={forceRef}
                        graphData={graphData}
                        nodeVal="nodeSize"
                        nodeRelSize={environment.graphSettings.defaultNodeRadius}
                        cooldownTicks={50}
                        nodeLabel={renderTooltip}
                        linkDirectionalArrowRelPos={1}
                        linkDirectionalArrowLength={3}
                        linkDirectionalParticles={4}
                        linkDirectionalParticleWidth={(link) => (link.highlighted ? 4 : 0)}
                        linkWidth={(link) => (link.highlighted ? 4 : 1)}
                        nodeColor={(node) => getNodeColor(node)}
                        linkColor={(link) => getLinkColor(link)}
                        onEngineTick={() => {
                            if (updateHighlighted) {
                                fixHighlighted(graphData);
                                setUpdateHighlighted(false);
                            }
                        }}
                        onNodeClick={(node) => {
                            navigate(`/entity/${node.id}`);
                        }}
                        onNodeRightClick={(node, event) => {
                            forceRef.current?.pauseAnimation();
                            setNodeMenuState({ showMenu: true, top: event.clientY, left: event.clientX, node });
                        }}
                        onBackgroundRightClick={(event) => {
                            forceRef.current?.pauseAnimation();
                            setMenuState({ showMenu: true, top: event.clientY, left: event.clientX });
                        }}
                        onEngineStop={() => {
                            if (shouldZoomToFit) {
                                forceRef.current?.zoomToFit(400);
                                setShouldZoomToFit(false);
                            }
                        }}
                        nodeCanvasObjectMode={() => 'after'}
                        nodeCanvasObject={(node: NodeObject, ctx) => {
                            const entityTemplate = entityTemplates.find((template) => template._id === node.templateId)!;

                            drawNode(node as PartialRequired<NodeObject, 'x' | 'y' | 'nodeSize'>, ctx, entityTemplate, entityId === node.data._id);
                            drawNodeLabel(node as PartialRequired<NodeObject, 'x' | 'y' | 'nodeSize'>, ctx, entityTemplate.displayName);
                        }}
                        linkCanvasObjectMode={() => 'after'}
                        linkCanvasObject={(link, ctx) => {
                            const label =
                                relationshipTemplates.find((relationshipTemplate) => relationshipTemplate._id === link.templateId)?.displayName || '';

                            drawLinkLabel(link, label, ctx);
                        }}
                    />
                )}
            </Grid>
            {nodeMenuState.node && (
                <GraphNodeMenu
                    node={nodeMenuState.node}
                    showMenu={nodeMenuState.showMenu}
                    onCloseMenu={() => {
                        forceRef.current?.resumeAnimation();
                        setNodeMenuState({ showMenu: false });
                    }}
                    location={{ top: nodeMenuState.top!, left: nodeMenuState.left! }}
                    addNewGraphData={addNewGraphData}
                    graphData={graphData}
                />
            )}
            {menuState && (
                <GraphMenu
                    showMenu={menuState.showMenu}
                    onCloseMenu={() => {
                        forceRef.current?.resumeAnimation();
                        setMenuState({ showMenu: false });
                    }}
                    location={{ top: menuState.top!, left: menuState.left! }}
                    graphData={graphData}
                />
            )}
        </Box>
    );
};

export default Graph;
