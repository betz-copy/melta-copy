import { ILabelIcon } from './utils/graph/helperTypes';

export const environment = {
    api: {
        login: '/api/auth/login',
        config: '/config',
        getAllTemplates: '/templates/all',
        categories: '/templates/categories',
        entityTemplates: '/templates/entities',
        relationshipTemplates: '/templates/relationships',
        rules: '/templates/rules',
        entities: '/instances/entities',
        relationships: '/instances/relationships',
        storage: '/files',
        getMyPermissions: '/permissions/my',
        getAllPermissions: '/permissions',
        createPermissionsBulk: '/permissions/bulk',
        deletePermissionsBulk: '/permissions',
        users: '/users',
        activityLog: '/activity-log',
        notifications: '/notifications',
        ruleBreachesRequests: '/rule-breaches/requests',
        ruleBreachesAlerts: '/rule-breaches/alerts',
    },
    graphSettings: {
        nodeConnectionsCountRangesToNodeSize: {
            '0-2': 3,
            '3-4': 4,
            '5-6': 5,
            '7-8': 6,
            '9-10': 8,
        },
        maximumNodeSize: 7,
        nodeSizeMultiplier: 4,
        nodeIconSizeMultiplier: 0.7,
        nodeHoverSizeMultiplier: 1.2,
        labelBackgroundColor: 'rgba(255, 255, 255, 0.8)',
        linkLabelFontSize: 2,
        labelIconsSizeMultiplier: 0.6,
        labelIcons: {
            original: { icon: '⊛', color: '#5dc457' },
            locked: { icon: '⊗', color: '#0090d0' },
            highlighted: { icon: '⊙', color: '#FF8C00' },
            mainHighlighted: { icon: '⊚', color: '#ff0000' },
        } as Record<string, ILabelIcon>,
        lookAt: {
            duration: 250,
            scale: 5,
        },
        lookAt3D: {
            distance: 250,
        },
        is3DViewLocalStorageKey: 'isGraph3DView',
        detailsResolution3D: 100,
    },
    canvasSettings: {
        heightPaddingMultiplier: 0.3,
        widthPaddingMultiplier: 0.6,
    },
    entitiesCardsView: {
        infiniteScrollPageCount: 10,
    },
    notifications: {
        updateInterval: 1000 * 60 * 10,
        infiniteScrollPageCount: 10,
    },
    activityLog: {
        infiniteScrollPageCount: 10,
    },
    createdRelationshipIdInBrokenRules: 'created-relationship-id',
    accessTokenName: 'rabaz-access-token',
    minimumSupportedChromeVersion: 80,
    fileIdLength: 32,
    errorCodes: {
        ruleBlock: 'RULE_BLOCK',
        failedToCreateConstraints: 'FAILED_TO_CREATE_CONSTRAINTS',
        failedConstraintsValidation: 'FAILED_CONSTRAINTS_VALIDATION',
    },
};
