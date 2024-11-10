import { HexColor } from '../../utils/types';

export enum Colors {
    primary = 'primary',
}

export enum WorkspaceTypes {
    dir = '',
    mlt = '.mlt',
}

export interface IMetadata {
    shouldNavigateToEntityPage: boolean;
    isDrawerOpen: boolean;
    agGrid: {
        rowCount: number;
        defaultExpandedRowCount: number;
        defaultRowHeight: number;
        defaultFontSize: number;
        cacheBlockSize: number;
        maxConcurrentDatasourceRequests: number;
        infiniteInitialRowCount: number;
    };
    activityLog: {
        infiniteScrollPageCount: number;
    };
    processInstances: {
        infiniteScrollPageCount: number;
    };
    permission: {
        infiniteScrollPageCount: number;
    };
    mainFontSizes: {
        headlineTitleFontSize: string;
        headlineSubTitleFontSize: string;
    };
    smallPreviewHeight: {
        number: string;
        unit: string;
    };
    iconSize: {
        width: string;
        height: string;
    };
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
    metadata?: Partial<IMetadata>;
}
