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
        searchUsers: '/users/search',
    },
    graphSettings: {
        // TODO: instead of here get this from the backend ( so it could be configurable ) + dont allow range overlaps ( validation )
        nodeConnectionsCountRangesToNodeSize: {
            '0-2': 2,
            '3-4': 3,
            '5-6': 4,
            '7-8': 5,
            '9-10': 7,
        },
        maximumNodeSize: 7,
    },
    accessTokenName: 'rabaz-access-token',
    minimumSupportedChromeVersion: 80,
};
