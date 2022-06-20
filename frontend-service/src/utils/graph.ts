import { GraphData, LinkObject, NodeObject } from 'react-force-graph-2d';
import { IEntity, IEntityExpanded } from '../interfaces/entities';
import { IMongoRelationshipTemplate } from '../interfaces/relationshipTemplates';
import { drawRectangle, drawText, getLineAngle, getRectangleDimensionsByString } from './canvas';

export const getSizeOfNodeByConnections = (nodeId: string, links: LinkObject[]) => {
    const connections = links.filter((curr) => curr.target === nodeId || curr.source === nodeId);
    const connectionsCount = connections.length;

    if (connectionsCount >= 6) {
        return 6;
    }

    return connectionsCount;
};

// this function is used to fixed weird behavior of the graph engine which is to populate the links to the real objects
export const getFixedGraphLinks = (links: Record<string, any>[] | string[]): LinkObject[] => {
    const fixedLinks = links.map((link) => {
        const { source, target, ...other } = link;

        const fixedSource = source.id || source;
        const fixedtarget = target.id || target;

        return { source: fixedSource, target: fixedtarget, ...other } as LinkObject;
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

export const entityToNode = (entity: IEntity) => {
    return {
        data: { ...entity.properties },
        templateId: entity.templateId,
        id: entity.properties._id,
    };
};

export const expandedEntityToGraphData = (expandedEntity: IEntityExpanded, relationshipTemplates: IMongoRelationshipTemplate[]): GraphData => {
    const nodes = [entityToNode(expandedEntity.entity), ...expandedEntity.connections.map(({ entity }) => entityToNode(entity))];

    const links = expandedEntity.connections.map(({ entity, relationship }) => {
        const relationshipTemplate = relationshipTemplates.find((template) => template._id === relationship.templateId);

        if (!relationshipTemplate) throw new Error('must have relationship template');

        if (relationshipTemplate.sourceEntityId === expandedEntity.entity.templateId) {
            return { source: expandedEntity.entity.properties._id, target: entity.properties._id, templateId: relationship.templateId };
        }

        return { source: entity.properties._id, target: expandedEntity.entity.properties._id, templateId: relationship.templateId };
    });

    return { nodes, links: getFixedGraphLinks(links) };
};

export const drawNodeLabel = (node: NodeObject & { x: number; y: number; nodeSize: number }, nodeLabel: string, ctx: CanvasRenderingContext2D) => {
    ctx.save();

    const bckgDimensions = getRectangleDimensionsByString(ctx, nodeLabel, node.nodeSize);
    ctx.translate(node.x, node.y);
    drawRectangle(ctx, -bckgDimensions[0] / 2, -bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1], 'rgba(255, 255, 255, 0.8)');
    drawText(ctx, nodeLabel, 0, 0, 'black');

    ctx.restore();
};

export const drawLinkLabel = (link: LinkObject, linkLabel: string, ctx: CanvasRenderingContext2D) => {
    ctx.save();

    const start = link.source as NodeObject & { x: number; y: number };
    const end = link.target as NodeObject & { x: number; y: number };

    const bckgDimensions = getRectangleDimensionsByString(ctx, linkLabel);
    ctx.translate(start.x + (end.x - start.x) / 2, start.y + (end.y - start.y) / 2);
    ctx.rotate(getLineAngle(end.x - start.x, end.y - start.y));
    drawRectangle(ctx, -bckgDimensions[0] / 2, -bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1], 'rgba(255, 255, 255, 0.8)');
    drawText(ctx, linkLabel, 0, 0, 'black');

    ctx.restore();
};
