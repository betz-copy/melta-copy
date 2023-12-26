import MockAdapter from 'axios-mock-adapter';
import { v4 as uuidv4 } from 'uuid';
import { IMongoEntityTemplate, ISearchEntityTemplatesBody } from '../entityTemplateManager';
import { IMongoRule } from '../../express/rules/interfaces';
import config from '../../config';
import { IMongoRelationshipTemplate, ISearchRelationshipTemplatesBody } from '../relationshipTemplateManager';

const { relationshipManager, entityTemplateManager } = config;

const generateMongoId = () => uuidv4(); // not really ObjectId of mongo, but good enough
export const generateTemplates = () => {
    const travelAgentEntityTemplate: IMongoEntityTemplate = {
        _id: generateMongoId(),
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
            hide: [],
        },
        propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'agentId'],
        propertiesPreview: ['firstName', 'lastName', 'age'],
        disabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const flightEntityTemplate: IMongoEntityTemplate = {
        _id: generateMongoId(),
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
            hide: [],
        },
        propertiesOrder: ['flightNumber', 'departureDate', 'landingDate', 'from', 'to', 'planeType'],
        propertiesPreview: ['flightNumber', 'from', 'to'],
        disabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const tripEntityTemplate: IMongoEntityTemplate = {
        _id: generateMongoId(),
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
            hide: [],
        },
        propertiesOrder: ['name', 'destination', 'startDate', 'endDate', 'firstFile'],
        propertiesPreview: ['name', 'destination', 'startDate', 'endDate'],
        disabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const airportEntityTemplate: IMongoEntityTemplate = {
        _id: generateMongoId(),
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
            hide: [],
        },
        propertiesOrder: ['airportName', 'airportId', 'country'],
        propertiesPreview: ['airportName', 'country'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const allEntityTemplates = [travelAgentEntityTemplate, flightEntityTemplate, tripEntityTemplate, airportEntityTemplate];
    const allEntityTemplateIds = allEntityTemplates.map(({ _id }) => _id);

    const flightsOnRelationshipTemplate: IMongoRelationshipTemplate = {
        _id: generateMongoId(),
        name: 'flies on',
        displayName: 'flies on',
        sourceEntityId: travelAgentEntityTemplate._id,
        destinationEntityId: flightEntityTemplate._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const tripConnectedToFlightRelationshipTemplate: IMongoRelationshipTemplate = {
        _id: generateMongoId(),
        name: 'flightInTrip',
        displayName: 'טיסה משוייכת לטיול',
        sourceEntityId: flightEntityTemplate._id,
        destinationEntityId: tripEntityTemplate._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const departureFromRelationshipTemplate: IMongoRelationshipTemplate = {
        _id: generateMongoId(),
        name: 'departueFrom',
        displayName: 'ממריא מ',
        sourceEntityId: flightEntityTemplate._id,
        destinationEntityId: airportEntityTemplate._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const allRelationshipTemplates = [flightsOnRelationshipTemplate, tripConnectedToFlightRelationshipTemplate, departureFromRelationshipTemplate];
    const allRelationshipTemplateIds = allRelationshipTemplates.map(({ _id }) => _id);

    // rule 1
    const oneTravelAgentPerFlight: IMongoRule = {
        _id: generateMongoId(),
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
                    rhsArgument: { isConstant: true, type: 'number', value: 1 },
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
                                type: 'string',
                                value: 'justForTesting',
                            },
                        },
                    ],
                },
            ],
        },
    };

    // rule 2
    const noOverlappingFlightsInTrip: IMongoRule = {
        _id: generateMongoId(),
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
    const warnOnEveryFlightOnActiveZone: IMongoRule = {
        _id: generateMongoId(),
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
                    rhsArgument: { isConstant: true, type: 'boolean', value: false },
                },
                // will always pass, but more intuitive
                {
                    isEquation: true,
                    operatorBool: 'greaterThanOrEqual',
                    lhsArgument: {
                        isCountAggFunction: true,
                        variableName: `${tripEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${flightEntityTemplate._id}`,
                    },
                    rhsArgument: { isConstant: true, type: 'boolean', value: 0 },
                },
            ],
        },
    };

    return {
        travelAgentEntityTemplate,
        flightEntityTemplate,
        tripEntityTemplate,
        airportEntityTemplate,
        allEntityTemplates,
        allEntityTemplateIds,
        flightsOnRelationshipTemplate,
        tripConnectedToFlightRelationshipTemplate,
        departureFromRelationshipTemplate,
        allRelationshipTemplates,
        allRelationshipTemplateIds,
        oneTravelAgentPerFlight,
        noOverlappingFlightsInTrip,
        warnOnEveryFlightOnActiveZone,
    };
};

export const mockEntityTemplatesRoutes = (mockEntityTemplateManager: MockAdapter, entityTemplates: IMongoEntityTemplate[]) => {
    entityTemplates.forEach((entityTemplate) => {
        mockEntityTemplateManager
            .onGet(`${entityTemplateManager.url}${entityTemplateManager.getByIdRoute}/${entityTemplate._id}`)
            .reply(200, entityTemplate);
    });

    mockEntityTemplateManager.onPost(`${entityTemplateManager.url}${entityTemplateManager.searchRoute}`).reply(({ data }) => {
        const { ids } = JSON.parse(data) as Required<Pick<ISearchEntityTemplatesBody, 'ids'>>; // assuming only search by ids
        return [200, entityTemplates.filter(({ _id }) => ids.includes(_id))];
    });
};

export const mockRelationshipTemplatesRoutes = (
    mockRelationshipTemplateManager: MockAdapter,
    relationshipTemplates: IMongoRelationshipTemplate[],
) => {
    relationshipTemplates.forEach((relationshipTemplate) => {
        mockRelationshipTemplateManager
            .onGet(`${relationshipManager.url}${relationshipManager.getRelationshipByIdRoute}/${relationshipTemplate._id}`)
            .reply(200, relationshipTemplate);
    });

    mockRelationshipTemplateManager.onPost(`${relationshipManager.url}${relationshipManager.searchTemplatesRoute}`).reply(({ data }) => {
        const { sourceEntityIds, destinationEntityIds } = JSON.parse(data) as Pick<
            ISearchRelationshipTemplatesBody,
            'sourceEntityIds' | 'destinationEntityIds'
        >;

        return [
            200,
            relationshipTemplates.filter(
                ({ sourceEntityId, destinationEntityId }) =>
                    sourceEntityIds?.includes(sourceEntityId) || destinationEntityIds?.includes(destinationEntityId),
            ),
        ];
    });
};

export const mockRulesRoutes = (
    mockRelationshipTemplateManager: MockAdapter,
    rules: IMongoRule[],
    entityTemplateIds: string[],
    relationshipTemplateIds: string[],
) => {
    relationshipTemplateIds.forEach((currRelationshipTemplateId) => {
        const rulesByRelationshipId = rules.filter(({ relationshipTemplateId }) => currRelationshipTemplateId === relationshipTemplateId);

        mockRelationshipTemplateManager
            .onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                disabled: false,
                relationshipTemplateIds: [currRelationshipTemplateId],
            })
            .reply(200, rulesByRelationshipId);
    });

    entityTemplateIds.forEach((entityTemplateId) => {
        const rulesByPinnedEntityTemplate = rules.filter(({ pinnedEntityTemplateId }) => entityTemplateId === pinnedEntityTemplateId);

        mockRelationshipTemplateManager
            .onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                disabled: false,
                pinnedEntityTemplateIds: [entityTemplateId],
            })
            .reply(200, rulesByPinnedEntityTemplate);
    });

    entityTemplateIds.forEach((entityTemplateId) => {
        const rulesByUnpinnedEntityTemplate = rules.filter(({ unpinnedEntityTemplateId }) => entityTemplateId === unpinnedEntityTemplateId);

        mockRelationshipTemplateManager
            .onPost(`${relationshipManager.url}${relationshipManager.searchRulesRoute}`, {
                disabled: false,
                unpinnedEntityTemplateIds: [entityTemplateId],
            })
            .reply(200, rulesByUnpinnedEntityTemplate);
    });
};
