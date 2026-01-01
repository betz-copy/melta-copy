import { ForceGraphMethods, LinkObject, NodeObject } from 'react-force-graph-2d';
import { environment } from '../../globals';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getLineAngle } from '../canvas';
import { PartialRequired } from '../typeHelpers';
import { drawLabel, drawNodeIcon } from '.';

const { graphSettings } = environment;

const getNodeRadius = (node: NodeObject) => {
    // formula taken from react-force-graph source code
    return Math.sqrt(node.nodeSize!) * graphSettings.nodeSizeMultiplier;
};

export const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: PartialRequired<NodeObject, 'x' | 'y' | 'nodeSize'>,
    entityTemplate: IMongoEntityTemplatePopulated,
) => {
    const nodeRadius = getNodeRadius(node);

    ctx.save();

    ctx.translate(node.x, node.y);

    drawNodeIcon(ctx, node, 0, 0, getNodeRadius(node));
    drawLabel(ctx, entityTemplate.displayName, 0, nodeRadius, node.nodeSize, node.labelIcons);

    ctx.restore();
};

export const drawLinkLabel = (link: LinkObject, linkLabel: string, ctx: CanvasRenderingContext2D) => {
    ctx.save();

    const start = link.source as PartialRequired<NodeObject, 'x' | 'y'>;
    const end = link.target as PartialRequired<NodeObject, 'x' | 'y'>;

    ctx.translate(start.x + (end.x - start.x) / 2, start.y + (end.y - start.y) / 2);
    ctx.rotate(getLineAngle(end.x - start.x, end.y - start.y));

    drawLabel(ctx, linkLabel, 0, 0, graphSettings.linkLabelFontSize);

    ctx.restore();
};

export const lookAt = (node: NodeObject, forceRef: ForceGraphMethods) => {
    forceRef.centerAt(node?.x, node?.y, graphSettings.lookAt.duration);
    forceRef.zoom(graphSettings.lookAt.scale, graphSettings.lookAt.duration);
};
