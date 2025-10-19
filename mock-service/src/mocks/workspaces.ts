import { IWorkspace, WorkspaceTypes } from '@microservices/shared';

const getWorkspacesToCreate = (): Omit<IWorkspace, '_id'>[] => {
    return [
        {
            name: '504',
            displayName: '504',
            path: '/',
            type: WorkspaceTypes.dir,
            colors: {
                primary: '#1E2775',
            },
        },
        {
            name: 'operational',
            displayName: 'Operational',
            path: '/504',
            type: WorkspaceTypes.mlt,
            colors: {
                primary: '#1E2775',
            },
        },
        {
            name: 'simba',
            displayName: 'Simba',
            path: '/',
            type: WorkspaceTypes.dir,
            colors: {
                primary: '#1E2775',
            },
        },
        {
            name: 'test',
            displayName: 'Test',
            path: '/simba',
            type: WorkspaceTypes.mlt,
            colors: {
                primary: '#1E2775',
            },
        },
    ];
};

export default getWorkspacesToCreate;
