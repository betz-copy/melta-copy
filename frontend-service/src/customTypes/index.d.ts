// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ForceGraph2D from 'react-force-graph-2d';
import { IEntity } from '../interfaces/entities';

declare module 'react-force-graph-2d' {
    export interface NodeObject {
        id: string;
        x?: number;
        y?: number;
        vx?: number;
        vy?: number;
        fx?: number;
        fy?: number;
        templateId: string;
        data: IEntity['properties'];
    }

    export interface LinkObject {
        source: string | NodeObject;
        target: string | NodeObject;
        templateId: string;
    }
}
