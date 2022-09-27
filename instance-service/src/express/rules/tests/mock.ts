import MockAdapter from 'axios-mock-adapter';
import { IMongoEntityTemplate } from '../../entities/interface';
import { IMongoRelationshipTemplate } from '../../relationships/interface';
import { IMongoRule } from '../interfaces';
import config from '../../../config';

const { relationshipManager, templateManager } = config;

export const travelAgentEntityTemplate: IMongoEntityTemplate = {
    _id: '111',
    name: 'travelAgent',
    displayName: 'Travel agent',
    category: '111',
    properties: {
        type: 'object',
        properties: {
            firstName: {
                type: 'string',
                title: 'First name',
            },
            lastName: {
                type: 'string',
                title: 'Last name',
            },
            age: {
                type: 'number',
                title: 'Age',
            },
            gender: {
                type: 'boolean',
                title: 'Gender',
            },
            agentId: {
                type: 'string',
                title: 'Agent id',
            },
        },
        required: ['firstName', 'lastName', 'agentId'],
    },
    propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'agentId'],
    propertiesPreview: ['firstName', 'lastName', 'age'],
    disabled: false,
};

export const flightEntityTemplate: IMongoEntityTemplate = {
    _id: '222',
    name: 'flight',
    displayName: 'flight',
    category: '222',
    properties: {
        type: 'object',
        properties: {
            flightNumber: {
                type: 'string',
                title: 'Flight number',
            },
            departureDate: {
                type: 'string',
                title: 'Departure date',
                format: 'date-time',
            },
            landingDate: {
                type: 'string',
                title: 'Landing date',
                format: 'date-time',
            },
            from: {
                type: 'string',
                title: 'Departure location',
            },
            to: {
                type: 'string',
                title: 'Arrival location',
            },
            planeType: {
                type: 'string',
                title: 'Plane type',
            },
        },
        required: ['flightNumber', 'departureDate', 'landingDate'],
    },
    propertiesOrder: ['flightNumber', 'departureDate', 'landingDate', 'from', 'to', 'planeType'],
    propertiesPreview: ['flightNumber', 'from', 'to'],
    disabled: false,
};

export const tripEntityTemplate: IMongoEntityTemplate = {
    _id: '333',
    name: 'trip',
    displayName: 'טיול',
    category: '333',
    properties: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                title: 'שם',
            },
            destination: {
                type: 'string',
                title: 'יעד',
            },
            startDate: {
                type: 'string',
                title: 'תאריך התחלה',
                format: 'date',
            },
            endDate: {
                type: 'string',
                title: 'תאריך סיום',
                format: 'date',
            },
            firstFile: {
                type: 'string',
                title: 'קובץ ראשון',
                format: 'fileId',
            },
            active: {
                type: 'boolean',
                title: 'פעיל',
            },
        },
        required: ['name', 'destination'],
    },
    propertiesOrder: ['name', 'destination', 'startDate', 'endDate', 'firstFile'],
    propertiesPreview: ['name', 'destination', 'startDate', 'endDate'],
    disabled: false,
};

export const airportEntityTemplate: IMongoEntityTemplate = {
    _id: '444',
    name: 'airport',
    displayName: 'שדה תעופה',
    disabled: false,
    category: '444',
    properties: {
        type: 'object',
        properties: {
            airportName: {
                type: 'string',
                title: 'שם',
            },
            airportId: {
                type: 'string',
                title: 'מזהה',
            },
            country: {
                type: 'string',
                title: 'מדינה',
            },
        },
        required: ['airportName', 'airportId', 'country'],
    },
    propertiesOrder: ['airportName', 'airportId', 'country'],
    propertiesPreview: ['airportName', 'country'],
};

export const allEntityTemplates = [travelAgentEntityTemplate, flightEntityTemplate, tripEntityTemplate, airportEntityTemplate];

export const flightsOnRelationshipTemplate: IMongoRelationshipTemplate = {
    _id: '111',
    name: 'flies on',
    displayName: 'flies on',
    sourceEntityId: travelAgentEntityTemplate._id,
    destinationEntityId: flightEntityTemplate._id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export const tripConnectedToFlightRelationshipTemplate: IMongoRelationshipTemplate = {
    _id: '222',
    name: 'flightInTrip',
    displayName: 'טיסה משוייכת לטיול',
    sourceEntityId: flightEntityTemplate._id,
    destinationEntityId: tripEntityTemplate._id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export const departureFromRelationshipTemplate: IMongoRelationshipTemplate = {
    _id: '333',
    name: 'departueFrom',
    displayName: 'ממריא מ',
    sourceEntityId: flightEntityTemplate._id,
    destinationEntityId: airportEntityTemplate._id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export const allRelationshipTemplates = [flightsOnRelationshipTemplate, tripConnectedToFlightRelationshipTemplate, departureFromRelationshipTemplate];

// rule 1
export const oneTravelAgentPerFlight: IMongoRule = {
    _id: '111',
    name: 'One travel agent per flight',
    description: 'One travel agent per flight',
    actionOnFail: 'WARNING',
    relationshipTemplateId: flightsOnRelationshipTemplate._id,
    pinnedEntityTemplateId: flightEntityTemplate._id,
    unpinnedEntityTemplateId: travelAgentEntityTemplate._id,
    disabled: false,
    formula: {
        isGroup: true,
        ruleOfGroup: 'OR',
        subFormulas: [
            {
                isEquation: true,
                operatorBool: 'lessThanOrEqual',
                lhsArgument: {
                    isCountAggFunction: true,
                    variableName: `${flightEntityTemplate._id}.${flightsOnRelationshipTemplate._id}.${travelAgentEntityTemplate._id}`,
                },
                rhsArgument: { isConstant: true, value: 1 },
            },
            // just for tests - to be dependent on tripConnectedToFlight
            {
                isAggregationGroup: true,
                aggregation: 'SOME',
                ruleOfGroup: 'AND',
                variableNameOfAggregation: `${flightEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${tripEntityTemplate._id}`,
                subFormulas: [
                    {
                        isEquation: true,
                        operatorBool: 'equals',
                        lhsArgument: {
                            isPropertyOfVariable: true,
                            variableName: `${flightEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${tripEntityTemplate._id}`,
                            property: 'name',
                        },
                        rhsArgument: {
                            isConstant: true,
                            value: 'justForTesting',
                        },
                    },
                ],
            },
        ],
    },
};

// rule 2
export const noOverlappingFlightsInTrip: IMongoRule = {
    _id: '222',
    name: 'טיסה אחת ביום לטיול',
    description: 'מקסימום טיסה אחת ביום לאותו הטיול. אסור שיהיו כמה טיסות לאותו הטיול באותו היום כי אחרת זה יהיה ממש מבלבל',
    actionOnFail: 'WARNING',
    relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
    pinnedEntityTemplateId: tripEntityTemplate._id,
    unpinnedEntityTemplateId: flightEntityTemplate._id,
    disabled: false,
    formula: {
        isGroup: true,
        ruleOfGroup: 'AND',
        subFormulas: [
            {
                isAggregationGroup: true,
                aggregation: 'EVERY',
                variableNameOfAggregation: `${tripEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${flightEntityTemplate._id}`,
                ruleOfGroup: 'OR',
                subFormulas: [
                    {
                        isEquation: true,
                        operatorBool: 'notEqual',
                        lhsArgument: {
                            isRegularFunction: true,
                            functionType: 'toDate',
                            arguments: [
                                {
                                    isPropertyOfVariable: true,
                                    variableName: `${tripEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${flightEntityTemplate._id}`,
                                    property: 'departureDate',
                                },
                            ],
                        },
                        rhsArgument: {
                            isRegularFunction: true,
                            functionType: 'toDate',
                            arguments: [{ isPropertyOfVariable: true, variableName: flightEntityTemplate._id, property: 'departureDate' }],
                        },
                    },
                    {
                        isEquation: true,
                        operatorBool: 'equals',
                        lhsArgument: {
                            isPropertyOfVariable: true,
                            variableName: `${tripEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${flightEntityTemplate._id}`,
                            property: '_id',
                        },
                        rhsArgument: {
                            isPropertyOfVariable: true,
                            variableName: flightEntityTemplate._id,
                            property: '_id',
                        },
                    },
                ],
            },
        ],
    },
};

// rule 3
export const warnOnEveryFlightOnActiveZone: IMongoRule = {
    _id: '333',
    name: 'התראה על טיסות בסבב פעיל',
    description: 'התראה על כל טיסה חדשה שמחוברת לסבב פעיל',
    actionOnFail: 'WARNING',
    relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
    pinnedEntityTemplateId: tripEntityTemplate._id,
    unpinnedEntityTemplateId: flightEntityTemplate._id,
    disabled: false,
    formula: {
        isGroup: true,
        ruleOfGroup: 'AND',
        subFormulas: [
            {
                isEquation: true,
                operatorBool: 'equals',
                lhsArgument: { isPropertyOfVariable: true, variableName: tripEntityTemplate._id, property: 'active' },
                rhsArgument: { isConstant: true, value: false },
            },
            // will always pass, but more intuitive
            {
                isEquation: true,
                operatorBool: 'greaterThanOrEqual',
                lhsArgument: {
                    isCountAggFunction: true,
                    variableName: `${tripEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${flightEntityTemplate._id}`,
                },
                rhsArgument: { isConstant: true, value: 0 },
            },
        ],
    },
};

export const mockEntityTemplatesRoutes = (mock: MockAdapter, entityTemplates: IMongoEntityTemplate[]) => {
    entityTemplates.forEach((entityTemplate) => {
        mock.onGet(`${templateManager.url}${templateManager.getByIdRoute}/${entityTemplate._id}`).reply(200, entityTemplate);
    });
};

export const mockRelationshipTemplatesRoutes = (
    mock: MockAdapter,
    entityTemplates: IMongoEntityTemplate[],
    relationshipTemplates: IMongoRelationshipTemplate[],
) => {
    relationshipTemplates.forEach((relationshipTemplate) => {
        mock.onGet(`${relationshipManager.url}${relationshipManager.getRelationshipByIdRoute}/${relationshipTemplate._id}`).reply(
            200,
            relationshipTemplate,
        );
    });

    entityTemplates.forEach((entityTemplate) => {
        const relationshipTemplatesBySource = relationshipTemplates.filter(({ sourceEntityId }) => sourceEntityId === entityTemplate._id);

        mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
            sourceEntityIds: [entityTemplate._id],
        }).reply(200, relationshipTemplatesBySource);
    });

    entityTemplates.forEach((entityTemplate) => {
        const relationshipTemplatesByDestination = relationshipTemplates.filter(
            ({ destinationEntityId }) => destinationEntityId === entityTemplate._id,
        );

        mock.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`, {
            destinationEntityIds: [entityTemplate._id],
        }).reply(200, relationshipTemplatesByDestination);
    });
};

export const mockRulesRoutes = (
    mock: MockAdapter,
    entityTemplates: IMongoEntityTemplate[],
    relationshipTemplates: IMongoRelationshipTemplate[],
    rules: IMongoRule[],
) => {
    relationshipTemplates.forEach((relationshipTemplate) => {
        const rulesByRelationshipId = rules.filter(({ relationshipTemplateId }) => relationshipTemplate._id === relationshipTemplateId);

        mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
            disabled: false,
            relationshipTemplateIds: [relationshipTemplate._id],
        }).reply(200, rulesByRelationshipId);
    });

    entityTemplates.forEach((entityTemplate) => {
        const rulesByPinnedEntityTemplate = rules.filter(({ pinnedEntityTemplateId }) => entityTemplate._id === pinnedEntityTemplateId);

        mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
            disabled: false,
            pinnedEntityTemplateIds: [entityTemplate._id],
        }).reply(200, rulesByPinnedEntityTemplate);
    });

    entityTemplates.forEach((entityTemplate) => {
        const rulesByUnpinnedEntityTemplate = rules.filter(({ unpinnedEntityTemplateId }) => entityTemplate._id === unpinnedEntityTemplateId);

        mock.onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
            disabled: false,
            unpinnedEntityTemplateIds: [entityTemplate._id],
        }).reply(200, rulesByUnpinnedEntityTemplate);
    });
};
