/* eslint-disable no-param-reassign */
import { IChildTemplateMap } from '@packages/child-template';
import { IEntity, IEntityExpanded, IPropertyValue } from '@packages/entity';
import { IEntityTemplateMap, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IMongoRelationshipTemplate, IRelationshipTemplateMap } from '@packages/relationship-template';
import { uniqBy } from 'lodash';
import { GraphData, LinkObject, NodeObject } from 'react-force-graph-2d';
import { environment } from '../../globals';
import { apiUrlToImageSource } from '../../services/storageService';
import { drawText, getRectangleDimensionsByString, traceRectangle } from '../canvas';
import { getEntityTemplateColor, getRelationshipTemplateColor } from '../colors';
import { ILabelIcon, rangeAsString } from './helperTypes';

const { graphSettings } = environment;

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
    const { nodeConnectionsCountRangesToNodeSize, maxNodeSize } = graphSettings;

    const connections = links.filter((curr) => curr.target === nodeId || curr.source === nodeId);
    const connectionsCount = connections.length;

    const selectedNodeSize = searchNodeSizeInsideRangesDict(connectionsCount, nodeConnectionsCountRangesToNodeSize);

    if (selectedNodeSize > maxNodeSize) {
        return maxNodeSize;
    }

    return selectedNodeSize;
};

// this function is used to fixed weird behavior of the graph engine which is to populate the links to the real objects
export const getFixedGraphLinks = (links: Record<string, IPropertyValue>[] | string[]): LinkObject[] => {
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

        if (id === undefined) return node;
        const nodeStringId = id.toString();

        return { ...node, nodeSize: getSizeOfNodeByConnections(nodeStringId, links as LinkObject[]) };
    });
    return { links, nodes: expendedNodes };
};

const iconLoadCache: Map<string, Promise<HTMLImageElement>> = new Map();

export const entityToNode = async (entity: IEntity, entityTemplate: IMongoEntityTemplateWithConstraintsPopulated): Promise<NodeObject> => {
    let icon: HTMLImageElement | undefined;

    if (entityTemplate.iconFileId) {
        if (!iconLoadCache.has(entityTemplate.iconFileId)) {
            const iconLoadPromise = (async () => {
                const img = new Image();

                img.src = await apiUrlToImageSource(`/api${environment.api.storage}/${entityTemplate.iconFileId}`);
                return img;
            })();

            iconLoadCache.set(entityTemplate.iconFileId, iconLoadPromise);

            icon = await iconLoadPromise;
        } else icon = await iconLoadCache.get(entityTemplate.iconFileId);
    }

    return {
        data: { ...entity.properties, coloredFields: entity.coloredFields },
        templateId: entity.templateId,
        id: entity.properties._id,
        highlighted: 0,
        numberOfConnectionsExpanded: 0,
        color: getEntityTemplateColor(entityTemplate),
        labelIcons: [],
        icon,
    };
};

export const relationshipToLink = (sourceEntity, destinationEntity, relationshipTemplate: IMongoRelationshipTemplate) => {
    return {
        source: sourceEntity.properties._id,
        target: destinationEntity.properties._id,
        templateId: relationshipTemplate._id,
        highlighted: 0,
        color: getRelationshipTemplateColor(relationshipTemplate),
    };
};

export const expandedEntityToGraphData = async (
    expandedEntity: IEntityExpanded,
    entityTemplates: IEntityTemplateMap,
    childTemplates: IChildTemplateMap,
    relationshipTemplates: IRelationshipTemplateMap,
): Promise<GraphData> => {
    const nodes: NodeObject[] = [
        await entityToNode(
            expandedEntity.entity,
            entityTemplates.get(expandedEntity.entity.templateId)! ||
                [...childTemplates.values()].find(({ parentTemplate }) => parentTemplate._id === expandedEntity!.entity.templateId)!.parentTemplate,
        ),
    ];

    const links = await Promise.all(
        expandedEntity.connections.map(async ({ sourceEntity, destinationEntity, relationship }) => {
            const relationshipTemplate = relationshipTemplates.get(relationship.templateId);

            if (!relationshipTemplate) throw new Error('must have relationship template');

            const currSourceEntity = entityTemplates.get(sourceEntity.templateId);
            if (currSourceEntity) nodes.push(await entityToNode(sourceEntity, currSourceEntity));

            const currDestinationEntity = entityTemplates.get(destinationEntity.templateId);
            if (currDestinationEntity) nodes.push(await entityToNode(destinationEntity, currDestinationEntity));

            return relationshipToLink(sourceEntity, destinationEntity, relationshipTemplate);
        }),
    );

    const uniqueGraphNodes = uniqBy(nodes, ({ id }) => id);

    return { nodes: uniqueGraphNodes, links: getFixedGraphLinks(links) };
};

export const highlightNode = (node: NodeObject, graphData: GraphData, highlight: boolean = true) => {
    const count = highlight ? 1 : -1;

    node.mainHighlighted = highlight;

    graphData.links.forEach((link) => {
        if ((link.target as NodeObject).id === node.id) {
            (link.source as NodeObject).highlighted += count;
            (link as LinkObject).highlighted += count;
        }
        if ((link.source as NodeObject).id === node.id) {
            (link.target as NodeObject).highlighted += count;
            (link as LinkObject).highlighted += count;
        }
    });
};

export const fixHighlighted = (graphData: GraphData) => {
    graphData.links.forEach((link) => {
        (link as LinkObject).highlighted = 0;
        (link.source as NodeObject).highlighted = 0;
        (link.target as NodeObject).highlighted = 0;
    });
    graphData.nodes.forEach((node) => {
        if ((node as NodeObject).mainHighlighted) {
            highlightNode(node as NodeObject, graphData);
        }
    });
};

export const getIconSize = (nodeRadius: number) => {
    return nodeRadius * 2 * graphSettings.nodeIconSizeMultiplier;
};

const offscreenCanvas = document.createElement('canvas');
export const drawNodeIcon = (
    ctx: CanvasRenderingContext2D,
    node: NodeObject,
    x: number,
    y: number,
    nodeRadius: number,
    color: string = 'rgba(0, 0, 0, 0.7)',
) => {
    const iconsSize = getIconSize(nodeRadius);

    if (!node.icon?.complete) return;

    const { a: scaleX, d: scaleY } = ctx.getTransform();

    const width = Math.floor(iconsSize * scaleX);
    const height = Math.floor(iconsSize * scaleY);

    offscreenCanvas.width = width;
    offscreenCanvas.height = height;

    const offScreenCanvasCtx = offscreenCanvas.getContext('2d')!;

    offScreenCanvasCtx.save();

    offScreenCanvasCtx.scale(scaleX, scaleY);
    offScreenCanvasCtx.drawImage(node.icon, 0, 0, iconsSize, iconsSize);

    offScreenCanvasCtx.globalCompositeOperation = 'source-in';
    offScreenCanvasCtx.fillStyle = color;

    offScreenCanvasCtx.fillRect(0, 0, iconsSize, iconsSize);

    ctx.drawImage(offscreenCanvas, x - iconsSize / 2, y - iconsSize / 2, iconsSize, iconsSize);

    offScreenCanvasCtx.restore();
};

export const updateNodeLabelIcons = (node: NodeObject, isOriginalNode?: boolean) => {
    const { original, locked, mainHighlighted, highlighted } = graphSettings.labelIcons;
    const labelIcons: ILabelIcon[] = [];

    if (isOriginalNode) labelIcons.push(original);
    if (node.locked) labelIcons.push(locked);
    if (node.mainHighlighted) labelIcons.push(mainHighlighted);
    if (node.highlighted) labelIcons.push(highlighted);

    node.labelIcons = labelIcons;
};

export const getLabelDimensions = (ctx: CanvasRenderingContext2D, text: string, fontSize: number, labelIcons: ILabelIcon[] = []) => {
    const iconsStr = labelIcons.reduce((prev, curr) => prev + curr.icon, '');

    const {
        width: iconsBoxWidth,
        height: iconsBoxHeight,
        originalWidth: iconsWidth,
        originalHeight: iconsHeight,
    } = labelIcons.length
        ? getRectangleDimensionsByString(ctx, iconsStr, fontSize * graphSettings.labelIconsSizeMultiplier)
        : { width: 0, height: 0, originalWidth: 0, originalHeight: 0 };

    const {
        width: textBoxWidth,
        height: textBoxHeight,
        originalWidth: textWidth,
        originalHeight: textHeight,
    } = getRectangleDimensionsByString(ctx, text, fontSize);

    return {
        iconsBoxWidth,
        iconsBoxHeight,
        iconsWidth,
        iconsHeight,
        textBoxWidth,
        textBoxHeight,
        textWidth,
        textHeight,
        totalHeight: textBoxHeight + iconsBoxHeight / 2,
        totalWidth: Math.max(textBoxWidth, iconsBoxWidth),
    };
};

export const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, labelIcons: ILabelIcon[] = []) => {
    const { iconsBoxWidth, iconsBoxHeight, iconsWidth, iconsHeight, textBoxWidth, textBoxHeight } = getLabelDimensions(
        ctx,
        text,
        fontSize,
        labelIcons,
    );

    ctx.save();

    ctx.translate(x, y);

    ctx.beginPath();

    traceRectangle(ctx, -textBoxWidth / 2, -textBoxHeight / 2, textBoxWidth, textBoxHeight, textBoxWidth / 2);
    if (labelIcons.length) {
        traceRectangle(ctx, -iconsBoxWidth / 2, -iconsBoxHeight / 2 + textBoxHeight / 2, iconsBoxWidth, iconsBoxHeight, iconsBoxWidth / 2);
    }

    ctx.closePath();

    ctx.fillStyle = graphSettings.labelBackgroundColor;
    ctx.fill();

    drawText(ctx, text, 0, 0, fontSize, '#000');

    ctx.translate(-iconsWidth / 2 + iconsWidth / labelIcons.length / 2, textBoxHeight / 2);
    for (let i = 0, currX = 0; i < labelIcons.length; i++) {
        drawText(ctx, labelIcons[i].icon, currX, 0, iconsHeight, labelIcons[i].color);
        currX += ctx.measureText(labelIcons[i].icon).width;
    }

    ctx.restore();
};
