import axios from 'axios';
import config from '../config';

const {
    services: { workspacesUri, baseRoute },
} = config;

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
    flowCube: boolean;
    agGrid: {
        rowCount: number;
        defaultExpandedRowCount: number;
        defaultRowHeight: number;
        defaultFontSize: number;
        defaultExpandedTableHeight: number;
    };
    mainFontSizes: {
        headlineTitleFontSize: string;
        entityTemplateTitleFontSize: string;
        headlineSubTitleFontSize: string;
    };
    iconSize: {
        width: string;
        height: string;
    };
    excel: {
        entitiesFileLimit: number;
        filesLimit: number;
    };
    searchLimits: {
        bulk: number;
    };
    unitFieldSplitDepth: number;
    simba: {
        usersInfoChildTemplateId: string;
        carsInfoTemplateId: string;
        numOfPropsToShow: number;
    };
    mapPage: {
        sourceTemplateId: string;
        destTemplateId: string;
    };
}
export interface IWorkspace {
    _id: string;
    name: string;
    displayName: string;
    path: string;
    type: WorkspaceTypes;
    colors: Record<Colors, string>;
    iconFileId?: string;
    logoFileId?: string;
    metadata?: Partial<IMetadata>;
}

export class WorkspaceService {
    private static workspaceService = axios.create({ baseURL: `${workspacesUri}${baseRoute}` });

    static async getWorkspaceIds(type: IWorkspace['type']) {
        const { data } = await this.workspaceService.post<string[]>(`/ids`, { type });
        return data;
    }
}
