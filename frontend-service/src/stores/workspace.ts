import { create } from 'zustand';
import { IMetadata, IWorkspace, WorkspaceTypes } from '../interfaces/workspaces';

export interface WorkspaceState {
    workspace: IWorkspace & { metadata: IMetadata };
    setWorkspace: (workspace: WorkspaceState['workspace']) => void;
    updateWorkspaceMetadata: (metadata: Partial<IMetadata>) => void;
}

export const defaultMetadata = {
    agGrid: {
        rowCount: 5,
        defaultExpandedRowCount: 13,
        defaultRowHeight: 50,
        defaultFontSize: 14,
        cacheBlockSize: 5,
        maxConcurrentDatasourceRequests: 1,
        infiniteInitialRowCount: 10,
    },
    activityLog: {
        infiniteScrollPageCount: 10,
    },
    processInstances: {
        infiniteScrollPageCount: 10,
    },
    permission: {
        infiniteScrollPageCount: 13,
    },
    mainFontSizes: {
        headlineTitleFontSize: '24px',
        headlineSubTitleFontSize: '14px',
    },
    smallPreviewHeight: {
        number: '150',
        unit: '1px',
    },
    iconSize: {
        width: '24px',
        height: '24px',
    },
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
