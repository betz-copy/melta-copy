import { GraphData, LinkObject, NodeObject } from 'react-force-graph-2d';
import { IEntity, IEntityExpanded } from '../interfaces/entities';
import { IMongoRelationshipTemplate } from '../interfaces/relationshipTemplates';
import { drawRectangle, drawText, getLineAngle, getRectangleDimensionsByString } from './canvas';

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

    return { nodes, links };
};

export const drawNodeLabel = (node: NodeObject & { x: number; y: number }, nodeLabel: string, ctx: CanvasRenderingContext2D) => {
    ctx.save();

    const bckgDimensions = getRectangleDimensionsByString(ctx, nodeLabel);
    ctx.translate(node.x, node.y);
    drawRectangle(ctx, -bckgDimensions[0] / 2, -bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1], 'rgba(255, 255, 255, 0.8)');
    drawText(ctx, nodeLabel, 0, 0, 'darkgrey');

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
    drawText(ctx, linkLabel, 0, 0, 'darkgrey');

    ctx.restore();
};
