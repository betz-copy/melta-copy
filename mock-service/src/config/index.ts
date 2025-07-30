import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
    },
    seed: env.get('SEED').asFloat(),
    usersService: {
        url: env.get('USER_SERVICE_URL').required().asString(),
        usersRoute: env.get('USER_SERVICE_USERS_BASE_ROUTE').default('/api/users').asString(),
        permissionsRoute: env.get('USER_SERVICE_PERMISSION_BASE_ROUTE').default('/api/permissions').asString(),
        isAliveRoute: env.get('USER_SERVICE_ALIVE_ROUTE').default('/isAlive').asString(),
        managersKartoffelIds: env.get('USER_SERVICE_MANAGERS_KARTOFFEL_IDS').required().asArray(),
    },
    templateService: {
        url: env.get('TEMPLATE_SERVICE_URL').required().asString(),
        isAliveRoute: env.get('TEMPLATES_SERVICE_IS_ALIVE_ROUTE').default('/isAlive').asString(),
        entities: {
            createEntityTemplateRoute: env.get('CREATE_ENTITY_TEMPLATE_ROUTE').default('/api/templates/entities').asString(),
            createCategoryRoute: env.get('CREATE_CATEGORY_ROUTE').default('/api/templates/categories').asString(),
        },
        relationships: {
            createRelationshipTemplateRoute: env.get('CREATE_RELATIONSHIP_TEMPLATE_ROUTE').default('/api/templates/relationships').asString(),
            createRuleRoute: env.get('CREATE_RULE_ROUTE').default('/api/templates/rules').asString(),
            getRelationshipTemplateRoute: env.get('GET_RELATIONSHIP_TEMPLATE_ROUTE').default('/api/templates/relationships').asString(),
        },
        childTemplates: {
            createChildTemplateRoute: env.get('CREATE_CHILD_TEMPLATE_ROUTE').default('/api/templates/child').asString(),
        },
        printingTemplates: {
            createPrintingTemplateRoute: env.get('CREATE_PRINTING_TEMPLATE_ROUTE').default('/api/templates/printingTemplates').asString(),
        },
        config: {
            createOrderConfigRoute: env.get('CREATE_ORDER_CONFIG_ROUTE').default('/api/templates/config/categoryOrder').asString(),
        },
    },
    processService: {
        url: env.get('PROCESS_SERVICE_URL').required().asString(),
        isAliveRoute: env.get('PROCESS_SERVICE_IS_ALIVE_ROUTE').default('/isAlive').asString(),
        createProcessTemplateRoute: env.get('CREATE_PROCESS_TEMPLATE_ROUTE').default('/api/processes/templates').asString(),
        processInstanceRoute: env.get('PROCESS_INSTANCE_ROUTE').default('/api/processes/instances').asString(),
        maxNumberOfProcesses: env.get('MAX_NUMBER_OF_PROCESSES').default(50).asInt(),
        minNumberOfProcesses: env.get('MIN_NUMBER_OF_PROCESSES').default(5).asInt(),
        nameMinLength: env.get('PROCESS_NAME_MIN_LENGTH').default(3).asInt(),
        nameMaxLength: env.get('PROCESS_NAME_MAX_LENGTH').default(8).asInt(),
        characters: env.get('ABC_CHARACTERS').default('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789').asString(),
    },
    instanceService: {
        url: env.get('INSTANCE_SERVICE_URL').required().asString(),
        isAliveRoute: env.get('INSTANCE_SERVICE_IS_ALIVE_ROUTE').default('/isAlive').asString(),
        createEntityRoute: env.get('CREATE_ENTITY_ROUTE').default('/api/instances/entities').asString(),
        updateConstraintsOfTemplateRoute: env.get('UPDATE_CONSTRAINTS_OF_TEMPLATE_ROUTE').default('/api/instances/entities/constraints').asString(),
        maxNumberOfEntities: env.get('MAX_NUMBER_OF_ENTITIES').default(100).asInt(),
        minNumberOfEntities: env.get('MIN_NUMBER_OF_ENTITIES').default(1).asInt(),
        createRelationshipRoute: env.get('CREATE_RELATIONSHIP_ROUTE').default('/api/instances/relationships').asString(),
        maxNumberOfRelationships: env.get('MAX_NUMBER_OF_RELATIONSHIPS').default(100).asInt(),
        minNumberOfRelationships: env.get('MIN_NUMBER_OF_RELATIONSHIPS').default(0).asInt(),
    },
    storageService: {
        url: env.get('STORAGE_SERVICE_URL').required().asString(),
        isAliveRoute: env.get('STORAGE_SERVICE_IS_ALIVE_ROUTE').default('/isAlive').asString(),
        uploadFileRoute: env.get('UPLOAD_FILE_ROUTE').default('/api/files/bulk').asString(),
        fileName: env.get('EXAMPLE_FILE_NAME').default('mock-file.txt').asString(),
        fileData: env.get('EXAMPLE_FILE_DATA').default('bla bla bla bla bla').asString(),
    },
    ganttService: {
        url: env.get('GANTT_SERVICE_URL').required().asString(),
        baseRoute: env.get('GANTT_SERVICE_BASE_ROUTE').default('/api/gantts').asString(),
        isAliveRoute: env.get('GANTT_SERVICE_ALIVE_ROUTE').default('/isAlive').asString(),
        minNumberOfGantts: env.get('MIN_NUMBER_OF_GANTTS').default(5).asInt(),
        maxNumberOfGantts: env.get('MAX_NUMBER_OF_GANTTS').default(40).asInt(),
    },
    workspacesService: {
        url: env.get('WORKSPACES_SERVICE_URL').required().asString(),
        baseRoute: env.get('WORKSPACES_SERVICE_BASE_ROUTE').default('/api/workspaces').asString(),
        isAliveRoute: env.get('WORKSPACES_SERVICE_ALIVE_ROUTE').default('/isAlive').asString(),
    },
    dashboardService: {
        url: env.get('DASHBOARD_SERVICE_URL').required().asString(),
        baseRoute: env.get('DASHBOARD_SERVICE_BASE_ROUTE').default('/api/dashboard').asString(),
        charts: {
            baseRoute: env.get('DASHBOARD_SERVICE_CHARTS_ROUTE').default('/charts').asString(),
        },
        iframes: {
            baseRoute: env.get('DASHBOARD_SERVICE_IFRAMES_ROUTE').default('/iframes').asString(),
        },
    },

    requestLimit: env.get('REQUEST_LIMIT').default(10).asInt(),
};

export default config;
