// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ForceGraph2D from 'react-force-graph-2d';

declare module 'react-force-graph-2d' {
    export interface NodeObject {
        id: string | number;
        x?: number;
        y?: number;
        vx?: number;
        vy?: number;
        fx?: number;
        fy?: number;
        data: object & {
            templateId: string;
        };
    }
}
