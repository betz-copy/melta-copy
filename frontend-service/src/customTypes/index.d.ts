import ForceGraph2D from 'react-force-graph-2d';
import ReactQueryBuilder from 'react-awesome-query-builder';
import { IEntity } from '../interfaces/entities';

declare module 'react-awesome-query-builder' {
    export interface RuleGroupExtProperties {
        conjunction: 'AND' | 'OR';
        not: boolean;
    }
}

declare module 'react-force-graph-2d' {
    export interface NodeObject {
        id: string;
        x?: number;
        y?: number;
        vx?: number;
        vy?: number;
        fx?: number;
        fy?: number;
        icon?: Image;
        locked?: boolean;
        nodeSize?: number;
        highlighted: number;
        numberOfConnectionsExpanded: number;
        mainHighlighted?: boolean;
        templateId: string;
        data: IEntity['properties'];
    }

    export interface LinkObject {
        source: string | NodeObject;
        target: string | NodeObject;
        highlighted: number;
        templateId: string;
    }
}
