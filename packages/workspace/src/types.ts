import { HexColor, IMongoProps } from '@packages/common';

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
    isDashboardHomePage: boolean;
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
    clientSide: {
        usersInfoChildTemplateId: string;
        numOfPropsToShow: number;
        clientSideWorkspaceName: 'simba' | 'azarim';
        fullNameField: string;
    };
    mapPage: {
        showMapPage: boolean;
        sourceTemplateId: string;
        destTemplateId: string;
        sourceFieldForColor: string;
    };
    numOfRelationshipFieldsToShow: number;
    twinTemplates: string[];
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

export enum ConfigTypes {
    BASE = 'base',
    CATEGORY_ORDER = 'categoryOrder',
}

export interface IBaseConfig {
    type: ConfigTypes;
}

export interface IMongoBaseConfig extends IBaseConfig, IMongoProps {}

export interface ICategoryOrderConfig extends IBaseConfig {
    order: string[];
}

export interface IMongoCategoryOrderConfig extends ICategoryOrderConfig, IMongoProps {}
