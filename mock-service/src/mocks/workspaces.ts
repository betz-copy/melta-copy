import { IWorkspace, WorkspaceTypes } from '../interfaces/workspaces';

export const getWorkspacesToCreate = (): Omit<IWorkspace, '_id'>[] => {
    return [
        {
            name: '504',
            path: '/',
            type: WorkspaceTypes.dir,
            colors: {
                primary: '#1E2775',
            },
        },
        {
            name: 'operational',
            path: '/504',
            type: WorkspaceTypes.mlt,
            colors: {
                primary: '#1E2775',
            },
        },
    ];
};
