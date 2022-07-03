/* eslint-disable no-param-reassign */
import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOMServer from 'react-dom/server';

import { Box, CircularProgress } from '@mui/material';
import ForceGraph, { ForceGraphMethods, GraphData, NodeObject } from 'react-force-graph-2d';
import { forceLink, forceManyBody } from 'd3-force';
import { useQuery, useQueryClient } from 'react-query';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { GraphMenu } from './GraphMenu';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntityExpanded } from '../../../interfaces/entities';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../../services/entitiesService';
import { drawNodeLabel, drawLinkLabel, expandedEntityToGraphData, getGraphDataWithNodeSizes, getFixedGraphLinks } from '../../../utils/graph';
import { EntityProperties } from '../../../common/EntityProperties';
import { IMongoCategory } from '../../../interfaces/categories';
import { uniqByFunction } from '../../../utils/object';

const Graph: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const ref = useRef<any>(null);

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const { state } = useLocation() as { state: IEntityExpanded | undefined };
    const { entityId } = useParams();
    const navigate = useNavigate();

    const [nodeMenuState, setNodeMenuState] = useState<{ showMenu: boolean; top?: number; left?: number; node?: NodeObject }>({
        showMenu: false,
    });

    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!;

    const expendedGraphData = state ? getGraphDataWithNodeSizes(expandedEntityToGraphData(state, relationshipTemplates)) : { nodes: [], links: [] };
    const [graphData, setGraphData] = useState<GraphData>(expendedGraphData);

    const updateGraphSize = () => {
        const mainBox = ref.current?.parentElement.parentElement;

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
            const mergedGraphNodes = [
                ...newGraphData.nodes.filter((value) => !prevGraphData.nodes.map(({ id }) => id).includes(value.id)),
                ...prevGraphData.nodes,
            ];
            const mergedGraphLinks = getFixedGraphLinks([...newGraphData.links, ...prevGraphData.links]);

            const uniqeGraphNodes = uniqByFunction(mergedGraphNodes, (item1, item2) => item1.id === item2.id);
            const uniqeGraphLinks = uniqByFunction(
                mergedGraphLinks,
                (item1, item2) => item1.source === item2.source && item1.target === item2.target,
            );

            const updatedGraphData = {
                nodes: uniqeGraphNodes,
                links: uniqeGraphLinks,
            };

            return getGraphDataWithNodeSizes(updatedGraphData);
        });
    };

    const forceRef = useRef<ForceGraphMethods | undefined>(undefined);
    const [shouldZoomToFit, setShouldZoomToFit] = useState(true);

    useQuery<IEntityExpanded>(['getExpandedEntity', entityId], () => getExpandedEntityByIdRequest(entityId!), {
        enabled: !state,
        onSuccess: (data) => {
            const expendedGraphDataWithSizes = getGraphDataWithNodeSizes(expandedEntityToGraphData(data, relationshipTemplates));

            setGraphData(expendedGraphDataWithSizes);
        },
    });

    // manage forces in graph
    forceRef.current?.d3Force(
        'charge',
        forceManyBody()
            .strength(graphData.nodes.length > 30 ? -20 : -30)
            .distanceMax(100),
    );

    forceRef.current?.d3Force('link', forceLink().distance(60));

    const renderTooltip = (node: NodeObject) => {
        const entityTemplate = entityTemplates.find((template) => template._id === node.templateId)!;
        return ReactDOMServer.renderToString(<EntityProperties properties={node.data} showPreviewPropertiesOnly entityTemplate={entityTemplate} />);
    };

    const getNodeColor = (node: NodeObject) => {
        const categoryId = entityTemplates.find((entityTemplate) => entityTemplate._id === node.templateId)?.category._id;
        return categories.find((category) => category._id === categoryId)?.color || 'black';
    };

    return (
        <Box ref={ref} overflow="hidden">
            {graphData.nodes.length === 0 ? (
                <CircularProgress size={80} />
            ) : (
                <ForceGraph
                    height={height}
                    width={width}
                    ref={forceRef}
                    graphData={graphData}
                    nodeVal="nodeSize"
                    cooldownTicks={100}
                    nodeLabel={renderTooltip}
                    linkDirectionalArrowRelPos={1}
                    linkDirectionalArrowLength={3}
                    nodeColor={(node) => getNodeColor(node)}
                    onNodeClick={(node) => {
                        navigate(`/entity/${node.id}`);
                    }}
                    onNodeRightClick={(node, event) => {
                        forceRef.current?.pauseAnimation();
                        setNodeMenuState({ showMenu: true, top: event.clientY, left: event.clientX, node });
                    }}
                    onEngineStop={() => {
                        if (shouldZoomToFit) {
                            forceRef.current?.zoomToFit(400);
                            setShouldZoomToFit(false);
                        }
                    }}
                    nodeCanvasObjectMode={() => 'after'}
                    nodeCanvasObject={(node: NodeObject, ctx) => {
                        const label = entityTemplates.find((entityTemplate) => entityTemplate._id === node.templateId)?.displayName || '';

                        drawNodeLabel(node as NodeObject & { x: number; y: number; nodeSize: number }, label, ctx);
                    }}
                    linkCanvasObjectMode={() => 'after'}
                    linkCanvasObject={(link, ctx) => {
                        const label =
                            relationshipTemplates.find((relationshipTemplate) => relationshipTemplate._id === link.templateId)?.displayName || '';

                        drawLinkLabel(link, label, ctx);
                    }}
                />
            )}
            {nodeMenuState.node && (
                <GraphMenu
                    node={nodeMenuState.node}
                    showMenu={nodeMenuState.showMenu}
                    addNewGraphData={addNewGraphData}
                    onCloseMenu={() => {
                        forceRef.current?.resumeAnimation();
                        setNodeMenuState({ showMenu: false });
                    }}
                    location={{ top: nodeMenuState.top!, left: nodeMenuState.left! }}
                />
            )}
        </Box>
    );
};

export default Graph;
