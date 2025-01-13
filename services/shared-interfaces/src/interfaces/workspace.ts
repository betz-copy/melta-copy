import { HexColor } from '../types';

export enum Colors {
    primary = 'primary',
}

export enum WorkspaceTypes {
    dir = '',
    mlt = '.mlt',
}

export interface IWorkspace {
    _id: string;
    name: string;
    displayName: string;
    path: string;
    type: WorkspaceTypes;
    colors: Record<Colors, HexColor>;
    iconFileId?: string;
    logoFileId?: string;
}
