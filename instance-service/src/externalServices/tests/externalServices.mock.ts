import { ActionOnFail } from '@microservices/shared';
import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import { IMongoEntityTemplate, ISearchEntityTemplatesBody } from '../templates/interfaces/entityTemplates';
import { IMongoRelationshipTemplate, ISearchRelationshipTemplatesBody } from '../templates/interfaces/relationshipTemplates';
import { IMongoRule } from '../templates/interfaces/rules';

const { url, relationships, entities } = config.templateService;
const { OK: okStatus } = StatusCodes;

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
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
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
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
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
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
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
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
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

    const tripConnectedToAirportRelationshipTemplate: IMongoRelationshipTemplate = {
        _id: generateMongoId(),
        name: 'tripConnectedToAirport',
        displayName: 'טיסה משוייכת לשדה תעופה',
        sourceEntityId: airportEntityTemplate._id,
        destinationEntityId: tripEntityTemplate._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const allRelationshipTemplates = [
        flightsOnRelationshipTemplate,
        tripConnectedToFlightRelationshipTemplate,
        departureFromRelationshipTemplate,
        tripConnectedToAirportRelationshipTemplate,
    ];

    // rule 1
    const oneTravelAgentPerFlight: IMongoRule = {
        _id: generateMongoId(),
        name: 'One travel agent per flight',
        description: 'One travel agent per flight',
        actionOnFail: ActionOnFail.WARNING,
        entityTemplateId: flightEntityTemplate._id,
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
                        variable: {
                            entityTemplateId: flightEntityTemplate._id,
                            aggregatedRelationship: {
                                relationshipTemplateId: flightsOnRelationshipTemplate._id,
                                otherEntityTemplateId: travelAgentEntityTemplate._id,
                            },
                        },
                    },
                    rhsArgument: { isConstant: true, type: 'number', value: 1 },
                },
                // just for tests - to be dependent on tripConnectedToFlight
                {
                    isAggregationGroup: true,
                    aggregation: 'SOME',
                    ruleOfGroup: 'AND',
                    variableOfAggregation: {
                        entityTemplateId: flightEntityTemplate._id,
                        aggregatedRelationship: {
                            relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
                            otherEntityTemplateId: tripEntityTemplate._id,
                        },
                    },
                    subFormulas: [
                        {
                            isEquation: true,
                            operatorBool: 'equals',
                            lhsArgument: {
                                isPropertyOfVariable: true,
                                variable: {
                                    entityTemplateId: flightEntityTemplate._id,
                                    aggregatedRelationship: {
                                        relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
                                        otherEntityTemplateId: tripEntityTemplate._id,
                                    },
                                },
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
        actionOnFail: ActionOnFail.WARNING,
        entityTemplateId: tripEntityTemplate._id,
        disabled: false,
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isAggregationGroup: true,
                    aggregation: 'EVERY',
                    variableOfAggregation: {
                        entityTemplateId: tripEntityTemplate._id,
                        aggregatedRelationship: {
                            relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
                            otherEntityTemplateId: flightEntityTemplate._id,
                        },
                    },
                    ruleOfGroup: 'AND',
                    subFormulas: [
                        {
                            isAggregationGroup: true,
                            aggregation: 'EVERY',
                            variableOfAggregation: {
                                entityTemplateId: tripEntityTemplate._id,
                                aggregatedRelationship: {
                                    relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
                                    otherEntityTemplateId: flightEntityTemplate._id,
                                    variableNameSuffix: '2',
                                },
                            },
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
                                                variable: {
                                                    entityTemplateId: tripEntityTemplate._id,
                                                    aggregatedRelationship: {
                                                        relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
                                                        otherEntityTemplateId: flightEntityTemplate._id,
                                                    },
                                                },
                                                property: 'departureDate',
                                            },
                                        ],
                                    },
                                    rhsArgument: {
                                        isRegularFunction: true,
                                        functionType: 'toDate',
                                        arguments: [
                                            {
                                                isPropertyOfVariable: true,
                                                variable: {
                                                    entityTemplateId: tripEntityTemplate._id,
                                                    aggregatedRelationship: {
                                                        relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
                                                        otherEntityTemplateId: flightEntityTemplate._id,
                                                        variableNameSuffix: '2',
                                                    },
                                                },
                                                property: 'departureDate',
                                            },
                                        ],
                                    },
                                },
                                {
                                    isEquation: true,
                                    operatorBool: 'equals',
                                    lhsArgument: {
                                        isPropertyOfVariable: true,
                                        variable: {
                                            entityTemplateId: tripEntityTemplate._id,
                                            aggregatedRelationship: {
                                                relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
                                                otherEntityTemplateId: flightEntityTemplate._id,
                                            },
                                        },
                                        property: '_id',
                                    },
                                    rhsArgument: {
                                        isPropertyOfVariable: true,
                                        variable: {
                                            entityTemplateId: tripEntityTemplate._id,
                                            aggregatedRelationship: {
                                                relationshipTemplateId: tripConnectedToFlightRelationshipTemplate._id,
                                                otherEntityTemplateId: flightEntityTemplate._id,
                                                variableNameSuffix: '2',
                                            },
                                        },
                                        property: '_id',
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    };

    // rule 3
    const warnOnEveryFlightDepartureFromAirportWithActiveTrip: IMongoRule = {
        _id: generateMongoId(),
        name: 'התראה על טיסות בטיול פעיל',
        description: 'התראה על כל טיסה חדשה שמחוברת לטיול פעיל',
        actionOnFail: ActionOnFail.WARNING,
        entityTemplateId: airportEntityTemplate._id,
        disabled: false,
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isAggregationGroup: true,
                    aggregation: 'EVERY',
                    variableOfAggregation: {
                        entityTemplateId: airportEntityTemplate._id,
                        aggregatedRelationship: {
                            relationshipTemplateId: departureFromRelationshipTemplate._id,
                            otherEntityTemplateId: flightEntityTemplate._id,
                        },
                    },
                    ruleOfGroup: 'AND',
                    subFormulas: [
                        {
                            isAggregationGroup: true,
                            aggregation: 'EVERY',
                            variableOfAggregation: {
                                entityTemplateId: airportEntityTemplate._id,
                                aggregatedRelationship: {
                                    relationshipTemplateId: tripConnectedToAirportRelationshipTemplate._id,
                                    otherEntityTemplateId: tripEntityTemplate._id,
                                },
                            },
                            ruleOfGroup: 'OR',
                            subFormulas: [
                                {
                                    isEquation: true,
                                    operatorBool: 'greaterThan',
                                    lhsArgument: {
                                        isPropertyOfVariable: true,
                                        variable: {
                                            entityTemplateId: airportEntityTemplate._id,
                                            aggregatedRelationship: {
                                                relationshipTemplateId: tripConnectedToAirportRelationshipTemplate._id,
                                                otherEntityTemplateId: tripEntityTemplate._id,
                                            },
                                        },
                                        property: 'startDate',
                                    },
                                    rhsArgument: {
                                        isRegularFunction: true,
                                        functionType: 'toDate',
                                        arguments: [
                                            {
                                                isPropertyOfVariable: true,
                                                variable: {
                                                    entityTemplateId: airportEntityTemplate._id,
                                                    aggregatedRelationship: {
                                                        relationshipTemplateId: departureFromRelationshipTemplate._id,
                                                        otherEntityTemplateId: flightEntityTemplate._id,
                                                    },
                                                },
                                                property: 'landingDate',
                                            },
                                        ],
                                    },
                                },
                                {
                                    isEquation: true,
                                    operatorBool: 'lessThan',
                                    lhsArgument: {
                                        isPropertyOfVariable: true,
                                        variable: {
                                            entityTemplateId: airportEntityTemplate._id,
                                            aggregatedRelationship: {
                                                relationshipTemplateId: tripConnectedToAirportRelationshipTemplate._id,
                                                otherEntityTemplateId: tripEntityTemplate._id,
                                            },
                                        },
                                        property: 'endDate',
                                    },
                                    rhsArgument: {
                                        isRegularFunction: true,
                                        functionType: 'toDate',
                                        arguments: [
                                            {
                                                isPropertyOfVariable: true,
                                                variable: {
                                                    entityTemplateId: airportEntityTemplate._id,
                                                    aggregatedRelationship: {
                                                        relationshipTemplateId: departureFromRelationshipTemplate._id,
                                                        otherEntityTemplateId: flightEntityTemplate._id,
                                                    },
                                                },
                                                property: 'departureDate',
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    };

    // rule 4
    const startDateSmallerThenEndDateInTrip: IMongoRule = {
        _id: generateMongoId(),
        name: 'תאריך התחלה לפני תאריך סיום של טיול',
        description: 'תאריך התחלה לפני תאריך סיום של טיול',
        actionOnFail: ActionOnFail.WARNING,
        entityTemplateId: tripEntityTemplate._id,
        disabled: false,
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isEquation: true,
                    operatorBool: 'lessThanOrEqual',
                    lhsArgument: { isPropertyOfVariable: true, variable: { entityTemplateId: tripEntityTemplate._id }, property: 'startDate' },
                    rhsArgument: { isPropertyOfVariable: true, variable: { entityTemplateId: tripEntityTemplate._id }, property: 'endDate' },
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
        tripConnectedToAirportRelationshipTemplate,
        tripConnectedToFlightRelationshipTemplate,
        departureFromRelationshipTemplate,
        allRelationshipTemplates,
        oneTravelAgentPerFlight,
        noOverlappingFlightsInTrip,
        warnOnEveryFlightDepartureFromAirportWithActiveTrip,
        startDateSmallerThenEndDateInTrip,
    };
};

export const mockEntityTemplatesRoutes = (mockTemplateManager: MockAdapter, entityTemplates: IMongoEntityTemplate[]) => {
    entityTemplates.forEach((entityTemplate) => {
        mockTemplateManager.onGet(`${url}${entities.getByIdRoute}/${entityTemplate._id}`).reply(okStatus, entityTemplate);
    });

    mockTemplateManager.onPost(`${url}${entities.searchRoute}`).reply(({ data }) => {
        const { ids } = JSON.parse(data) as Required<Pick<ISearchEntityTemplatesBody, 'ids'>>; // assuming only search by ids
        return [okStatus, entityTemplates.filter(({ _id }) => ids.includes(_id))];
    });
};

export const mockRelationshipTemplatesRoutes = (mockTemplateManager: MockAdapter, relationshipTemplates: IMongoRelationshipTemplate[]) => {
    relationshipTemplates.forEach((relationshipTemplate) => {
        mockTemplateManager
            .onGet(`${url}${relationships.getRelationshipByIdRoute}/${relationshipTemplate._id}`)
            .reply(okStatus, relationshipTemplate);
    });

    mockTemplateManager.onPost(`${url}${relationships.searchTemplatesRoute}`).reply(({ data }) => {
        const { sourceEntityIds, destinationEntityIds } = JSON.parse(data) as Pick<
            ISearchRelationshipTemplatesBody,
            'sourceEntityIds' | 'destinationEntityIds'
        >;

        return [
            okStatus,
            relationshipTemplates.filter(
                ({ sourceEntityId, destinationEntityId }) =>
                    sourceEntityIds?.includes(sourceEntityId) || destinationEntityIds?.includes(destinationEntityId),
            ),
        ];
    });
};

export const mockRulesRoutes = (mockTemplateManager: MockAdapter, rules: IMongoRule[], entityTemplateIds: string[]) => {
    entityTemplateIds.forEach((entityTemplateId) => {
        const rulesByEntityTemplate = rules.filter(({ entityTemplateId: entityTemplateIdOfRule }) => entityTemplateIdOfRule === entityTemplateId);

        mockTemplateManager
            .onPost(`${url}${relationships.searchRulesRoute}`, {
                disabled: false,
                entityTemplateIds: [entityTemplateId],
            })
            .reply(okStatus, rulesByEntityTemplate);
    });
};
