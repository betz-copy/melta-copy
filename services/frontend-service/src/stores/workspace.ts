import { create } from 'zustand';
import { IWorkspace, WorkspaceTypes } from '@microservices/shared';

export interface WorkspaceState {
    workspace: IWorkspace;
    setWorkspace: (workspace: WorkspaceState['workspace']) => void;
}

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
    },
    setWorkspace: (workspace) => set({ workspace }),
}));
