import { IEntity } from '@packages/entity';
import { Object3D } from 'three';
import { ILabelIcon } from '../utils/graph/helperTypes';

declare module '@react-awesome-query-builder/mui' {
    export interface RuleGroupExtProperties {
        conjunction: 'AND' | 'OR';
        not: boolean;
    }
}

interface INodeObject {
    id: string;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number;
    fy?: number;
    fz?: number;
    locked?: boolean;
    nodeSize?: number;
    mainHighlighted?: boolean;
    icon?: HTMLImageElement;
    highlighted: number;
    templateId: string;
    numberOfConnectionsExpanded: number;
    data: IEntity['properties'];
    labelIcons: ILabelIcon[];
    color: string;
    __threeObj?: Object3D;
}

interface ILinkObject {
    source: string | INodeObject;
    target: string | INodeObject;
    highlighted: number;
    templateId: string;
    color: string;
}
declare module 'react-force-graph-2d' {
    export interface NodeObject extends INodeObject {}
    export interface LinkObject extends ILinkObject {}
}
declare module 'react-force-graph-3d' {
    export interface NodeObject extends INodeObject {}
    export interface LinkObject extends ILinkObject {}
}
