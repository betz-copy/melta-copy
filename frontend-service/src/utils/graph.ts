/* eslint-disable no-param-reassign */
import { GraphData, LinkObject, NodeObject } from 'react-force-graph-2d';
import uniqBy from 'lodash.uniqby';
import { IEntity, IEntityExpanded } from '../interfaces/entities';
import { IRelationshipTemplateMap } from '../interfaces/relationshipTemplates';
import { drawRectangle, drawText, getLineAngle, getRectangleDimensionsByString } from './canvas';
import { environment } from '../globals';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { PartialRequired } from './typeHelpers';

const { graphSettings } = environment;

type rangeAsString = `${string}-${string}`;
const searchNodeSizeInsideRangesDict = (connectionsCount: number, connectionsCountRangesToSizeDict: Record<rangeAsString, number>) => {
    const ranges = Object.keys(connectionsCountRangesToSizeDict) as rangeAsString[];

    const rangeThatMatchConnectionsCount = ranges.find((range: string) => {
        const [minAsString, maxAsString] = range.split('-');

        return connectionsCount >= Number(minAsString) && connectionsCount <= Number(maxAsString);
    });

    // if we can't find any range that fits the connections count of the node, return it as the size
    if (!rangeThatMatchConnectionsCount) {
        return connectionsCount;
    }

    return connectionsCountRangesToSizeDict[rangeThatMatchConnectionsCount];
};

export const getSizeOfNodeByConnections = (nodeId: string, links: LinkObject[]) => {
    const { nodeConnectionsCountRangesToNodeSize, maximumNodeSize } = graphSettings;

    const connections = links.filter((curr) => curr.target === nodeId || curr.source === nodeId);
    const connectionsCount = connections.length;

    const selectedNodeSize = searchNodeSizeInsideRangesDict(connectionsCount, nodeConnectionsCountRangesToNodeSize);

    if (selectedNodeSize > maximumNodeSize) {
        return maximumNodeSize;
    }

    return selectedNodeSize;
};

// this function is used to fixed weird behavior of the graph engine which is to populate the links to the real objects
export const getFixedGraphLinks = (links: Record<string, any>[] | string[]): LinkObject[] => {
    const fixedLinks = links.map((link) => {
        const { source, target, ...other } = link;

        const fixedSource = source.id || source;
        const fixedTarget = target.id || target;

        return { source: fixedSource, target: fixedTarget, ...other } as LinkObject;
    });

    return fixedLinks;
};

export const getGraphDataWithNodeSizes = (graphData: GraphData) => {
    const { links, nodes } = graphData;

    const expendedNodes = nodes.map((node) => {
        const { id } = node;
        return { ...node, nodeSize: getSizeOfNodeByConnections(id, links) };
    });

    return { links, nodes: expendedNodes };
};

export const entityToNode = (entity: IEntity): NodeObject => {
    return {
        data: { ...entity.properties },
        templateId: entity.templateId,
        id: entity.properties._id,
        highlighted: 0,
        numberOfConnectionsExpanded: 0,
    };
};

export const expandedEntityToGraphData = (expandedEntity: IEntityExpanded, relationshipTemplates: IRelationshipTemplateMap): GraphData => {
    const nodes = [entityToNode(expandedEntity.entity)];
    expandedEntity.connections.forEach((connection) => {
        nodes.push(entityToNode(connection.sourceEntity));
        nodes.push(entityToNode(connection.destinationEntity));
    });
    const uniqueGraphNodes = uniqBy(nodes, ({ id }) => id);

    const links = expandedEntity.connections.map(({ sourceEntity, destinationEntity, relationship }) => {
        const relationshipTemplate = relationshipTemplates.get(relationship.templateId);

        if (!relationshipTemplate) throw new Error('must have relationship template');

        return { source: sourceEntity.properties._id, target: destinationEntity.properties._id, templateId: relationship.templateId, highlighted: 0 };
    });

    return { nodes: uniqueGraphNodes, links: getFixedGraphLinks(links) };
};

const drawNodeBorder = (node: PartialRequired<NodeObject, 'nodeSize'>, ctx: CanvasRenderingContext2D, colors: string[], borderWidth: number) => {
    const nodeRadius = graphSettings.defaultNodeRadius + node.nodeSize;

    colors.forEach((color, index) => {
        ctx.beginPath();

        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = color;

        ctx.arc(0, 0, nodeRadius + borderWidth * index, 0, 2 * Math.PI);
        ctx.stroke();
    });
};

const offscreenCanvas = document.createElement('canvas');
const drawNodeIcon = (
    node: PartialRequired<NodeObject, 'x' | 'y' | 'nodeSize'>,
    ctx: CanvasRenderingContext2D,
    entityTemplate: IMongoEntityTemplatePopulated,
) => {
    if (!entityTemplate.iconFileId) return;

    const iconsSize = (graphSettings.defaultNodeRadius + node.nodeSize) * 1.2;

    if (!node.icon) {
        node.icon = new Image(iconsSize, iconsSize);
        node.icon.src = `/api${environment.api.storage}/${entityTemplate.iconFileId}`;
    }

    if (!node.icon.complete) return;

    const { a: scaleX, d: scaleY } = ctx.getTransform();

    const width = Math.floor(iconsSize * scaleX);
    const height = Math.floor(iconsSize * scaleY);

    if (!width || !height) return;

    offscreenCanvas.width = width;
    offscreenCanvas.height = height;

    const offScreenCanvasCtx = offscreenCanvas.getContext('2d');
    if (!offScreenCanvasCtx) return;

    offScreenCanvasCtx.save();

    offScreenCanvasCtx.scale(scaleX, scaleY);

    offScreenCanvasCtx.drawImage(node.icon, 0, 0, iconsSize, iconsSize);

    offScreenCanvasCtx.globalCompositeOperation = 'source-in';

    offScreenCanvasCtx.fillStyle = '#000000';
    offScreenCanvasCtx.fillRect(0, 0, iconsSize, iconsSize);

    ctx.drawImage(offScreenCanvasCtx.canvas, -iconsSize / 2, -iconsSize / 2, iconsSize, iconsSize);

    offScreenCanvasCtx.restore();
};

export const drawNode = (
    node: PartialRequired<NodeObject, 'x' | 'y' | 'nodeSize'>,
    ctx: CanvasRenderingContext2D,
    entityTemplate: IMongoEntityTemplatePopulated,
    isOriginalNode: boolean = false,
) => {
    const nodeRadius = graphSettings.defaultNodeRadius + node.nodeSize;
    const borders: string[] = [];

    ctx.save();

    ctx.translate(node.x, node.y);

    drawNodeIcon(node, ctx, entityTemplate);

    if (isOriginalNode) borders.push('#7ef6a2');
    if (node.locked) borders.push('#7ed2f6');

    if (node.mainHighlighted) borders.push('#ff0000');
    else if (node.highlighted) borders.push('#FF8C00');

    drawNodeBorder(node, ctx, borders, nodeRadius / 15);

    ctx.restore();
};

export const drawNodeLabel = (node: PartialRequired<NodeObject, 'x' | 'y' | 'nodeSize'>, ctx: CanvasRenderingContext2D, nodeLabel: string) => {
    const nodeRadius = graphSettings.defaultNodeRadius + node.nodeSize;

    ctx.save();

    const { width, height } = getRectangleDimensionsByString(ctx, nodeLabel, node.nodeSize);

    ctx.translate(node.x, node.y + nodeRadius);

    drawRectangle(ctx, -width / 2, -height / 2, width, height, 'rgba(255, 255, 255, 0.8)', width / 2);
    drawText(ctx, nodeLabel, 0, 0, 'black');

    ctx.restore();
};

export const drawLinkLabel = (link: LinkObject, linkLabel: string, ctx: CanvasRenderingContext2D) => {
    ctx.save();

    const start = link.source as NodeObject & { x: number; y: number };
    const end = link.target as NodeObject & { x: number; y: number };

    const { width, height } = getRectangleDimensionsByString(ctx, linkLabel);

    ctx.translate(start.x + (end.x - start.x) / 2, start.y + (end.y - start.y) / 2);
    ctx.rotate(getLineAngle(end.x - start.x, end.y - start.y));

    drawRectangle(ctx, -width / 2, -height / 2, width, height, 'rgba(255, 255, 255, 0.8)');
    drawText(ctx, linkLabel, 0, 0, 'black');

    ctx.restore();
};

export const highlightNode = (node: NodeObject, graphData: GraphData, highlight: boolean = true) => {
    const count = highlight ? 1 : -1;

    node.mainHighlighted = highlight;

    graphData.links.forEach((link) => {
        if ((link.target as NodeObject).id === node.id) {
            (link.source as NodeObject).highlighted += count;
            link.highlighted += count;
        }
        if ((link.source as NodeObject).id === node.id) {
            (link.target as NodeObject).highlighted += count;
            link.highlighted += count;
        }
    });
};

export const fixHighlighted = (graphData: GraphData) => {
    graphData.links.forEach((link) => {
        link.highlighted = 0;
        (link.source as NodeObject).highlighted = 0;
        (link.target as NodeObject).highlighted = 0;
    });
    graphData.nodes.forEach((node) => {
        if (node.mainHighlighted) {
            highlightNode(node, graphData);
        }
    });
};
