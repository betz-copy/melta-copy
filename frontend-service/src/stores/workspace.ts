import { IMetadata, IWorkspace, WorkspaceTypes } from '@packages/workspace';
import { create } from 'zustand';

export interface WorkspaceState {
    workspace: IWorkspace & { metadata: IMetadata };
    setWorkspace: (workspace: WorkspaceState['workspace']) => void;
    updateWorkspaceMetadata: (metadata: Partial<IMetadata>) => void;
}

export const defaultMetadata: IMetadata = {
    shouldNavigateToEntityPage: false,
    isDrawerOpen: false,
    flowCube: false,
    isDashboardHomePage: true,
    agGrid: {
        rowCount: 5,
        defaultExpandedRowCount: 13,
        defaultRowHeight: 50,
        defaultFontSize: 14,
        defaultExpandedTableHeight: 650,
    },
    mainFontSizes: {
        headlineTitleFontSize: '24px',
        entityTemplateTitleFontSize: '20px',
        headlineSubTitleFontSize: '14px',
    },
    iconSize: {
        width: '24px',
        height: '24px',
    },
    excel: {
        entitiesFileLimit: 500,
        filesLimit: 5,
    },
    searchLimits: {
        bulk: 5,
    },
    unitFieldSplitDepth: 2,
    clientSide: {
        usersInfoChildTemplateId: '',
        numOfPropsToShow: 9,
        clientSideWorkspaceName: 'simba',
        fullNameField: 'full_name',
    },
    mapPage: {
        showMapPage: false,
        sourceTemplateId: '',
        destTemplateId: '',
        sourceFieldForColor: '',
    },
    numOfRelationshipFieldsToShow: 2,
    twinTemplates: [] as string[],
} as const;

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    workspace: {
        _id: '',
        name: '',
        displayName: '',
        path: '',
        type: WorkspaceTypes.dir,
        colors: {
            primary: '#1E2775',
        },
        metadata: defaultMetadata,
    },
    setWorkspace: (workspace) => set({ workspace }),
    updateWorkspaceMetadata: (metadata) =>
        set((state) => ({
            workspace: {
                ...state.workspace,
                metadata: {
                    ...state.workspace.metadata,
                    ...metadata,
                },
            },
        })),
}));
