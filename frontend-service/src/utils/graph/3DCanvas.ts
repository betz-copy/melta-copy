/* eslint-disable no-param-reassign */
import { ForceGraphMethods as ForceGraphMethods3D, NodeObject } from 'react-force-graph-3d';
import * as THREE from 'three';
import { environment } from '../../globals';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { drawLabel, drawNodeIcon, getIconSize, getLabelDimensions, updateNodeLabelIcons } from '.';
import { ILabelIcon } from './helperTypes';

const { graphSettings } = environment;

const getNodeRadius = (node: NodeObject) => {
    // formula taken from react-force-graph source code
    return Math.cbrt(node.nodeSize!) * graphSettings.nodeSizeMultiplier;
};

const canvasTo3DSprite = (canvas: HTMLCanvasElement, materialParams: THREE.MaterialParameters = {}) => {
    const canvasTexture = new THREE.Texture(canvas);
    canvasTexture.needsUpdate = true;

    const canvasMaterial = new THREE.SpriteMaterial({ map: canvasTexture, ...materialParams });
    const canvasSprite = new THREE.Sprite(canvasMaterial);

    return canvasSprite;
};

export const lookAt3D = (node: NodeObject, forceRef: ForceGraphMethods3D) => {
    const distRatio = graphSettings.lookAt3D.distance / Math.hypot(node.x!, node.y!, node.z!);

    forceRef.cameraPosition({ x: node.x! * distRatio, y: node.y! * distRatio, z: node.z! * distRatio }, { x: node.x!, y: node.y!, z: node.z! }, 2000);
};

export const create3DLabel = (text: string, fontSize: number, labelIcons?: ILabelIcon[]) => {
    const canvas = document.createElement('canvas')!;
    const ctx = canvas.getContext('2d')!;

    const labelDimensions = getLabelDimensions(ctx, text, fontSize, labelIcons);
    const { totalHeight, totalWidth, textBoxHeight } = labelDimensions;

    canvas.width = totalWidth * graphSettings.detailsResolution3D;
    canvas.height = totalHeight * graphSettings.detailsResolution3D;

    drawLabel(
        ctx,
        text,
        canvas.width / 2,
        (textBoxHeight / 2) * graphSettings.detailsResolution3D,
        fontSize * graphSettings.detailsResolution3D,
        labelIcons,
    );

    const label = canvasTo3DSprite(canvas);
    label.scale.set(totalWidth, totalHeight, 0);

    return { label, labelDimensions };
};

export const create3DNodeIcon = (node: NodeObject, color: string) => {
    const canvas = document.createElement('canvas')!;
    const ctx = canvas.getContext('2d')!;

    const nodeRadius = getNodeRadius(node);
    const iconSize = getIconSize(nodeRadius);

    canvas.width = iconSize * graphSettings.detailsResolution3D;
    canvas.height = iconSize * graphSettings.detailsResolution3D;

    drawNodeIcon(ctx, node, canvas.width / 2, canvas.height / 2, nodeRadius * graphSettings.detailsResolution3D, color);

    const detailsSprite = canvasTo3DSprite(canvas);
    detailsSprite.scale.set(iconSize, iconSize, 0);

    return detailsSprite;
};

export const create3DNodeDetails = (node: NodeObject, entityTemplate: IMongoEntityTemplatePopulated, isOriginalNode: boolean, darkMode: boolean) => {
    const nodeRadius = getNodeRadius(node);

    updateNodeLabelIcons(node, isOriginalNode);

    const icon = create3DNodeIcon(node, darkMode ? 'white' : 'black');

    const { label, labelDimensions } = create3DLabel(entityTemplate.displayName, node.nodeSize!, node.labelIcons);
    const { totalHeight, textBoxHeight } = labelDimensions;

    label.center.set(icon.center.x, icon.center.y + (nodeRadius + totalHeight / 2 - textBoxHeight / 2 + textBoxHeight / 4) / label.scale.y);

    const scene = new THREE.Scene();
    scene.add(icon, label);

    return scene;
};

export const LinkMiddlePoint3D = (start: number, end: number) => {
    return start + (end - start) / 2;
};

export const scale3DNode = (node: NodeObject) => {
    if (!(node.__threeObj instanceof THREE.Mesh)) return;

    const { geometry } = node.__threeObj;
    if (!(geometry instanceof THREE.CircleGeometry)) return;

    const scale = getNodeRadius(node) / node.__threeObj.geometry.parameters.radius;
    node.__threeObj.scale.set(scale, scale, scale);
};
