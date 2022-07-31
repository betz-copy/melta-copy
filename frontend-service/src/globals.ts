export const environment = {
    api: {
        login: '/api/auth/login',
        config: '/config',
        getAllTemplates: '/templates/all',
        categories: '/templates/categories',
        entityTemplates: '/templates/entities',
        relationshipTemplates: '/templates/relationships',
        entities: '/instances/entities',
        relationships: '/instances/relationships',
        storage: '/files',
        getMyPermissions: '/permissions/my',
        getAllPermissions: '/permissions',
        createPermissionsBulk: '/permissions/bulk',
        deletePermissionsBulk: '/permissions',
        users: '/users',
        activityLog: '/activity-log',
    },
    graphSettings: {
        // TODO: instead of here get this from the backend ( so it could be configurable ) + dont allow range overlaps ( validation )
        nodeConnectionsCountRangesToNodeSize: {
            '0-2': 3,
            '3-4': 4,
            '5-6': 5,
            '7-8': 6,
            '9-10': 8,
        },
        maximumNodeSize: 7,
        defaultNodeRadius: 4,
    },
    accessTokenName: 'rabaz-access-token',
    minimumSupportedChromeVersion: 80,
    fileIdLength: 32,
};
