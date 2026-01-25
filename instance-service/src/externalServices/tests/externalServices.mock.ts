import { Conjunction } from '@packages/common';
import { IMongoEntityTemplate, ISearchEntityTemplatesBody, PropertyFormat, PropertyType } from '@packages/entity-template';
import { IMongoRelationshipTemplate, ISearchRelationshipTemplatesBody } from '@packages/relationship-template';
import { ActionOnFail, IMongoRule } from '@packages/rule';
import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';

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
                    type: PropertyType.string,
                    title: 'First name',
                },
                lastName: {
                    type: PropertyType.string,
                    title: 'Last name',
                },
                age: {
                    type: PropertyType.number,
                    title: 'Age',
                },
                gender: {
                    type: PropertyType.boolean,
                    title: 'Gender',
                },
                agentId: {
                    type: PropertyType.string,
                    title: 'Agent id',
                },
            },
            hide: [],
        },
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'agentId'],
        propertiesPreview: ['firstName', 'lastName', 'age'],
        disabled: false,
        iconFileId: null,
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
                    type: PropertyType.string,
                    title: 'Flight number',
                },
                departureDate: {
                    type: PropertyType.string,
                    title: 'Departure date',
                    format: PropertyFormat['date-time'],
                },
                landingDate: {
                    type: PropertyType.string,
                    title: 'Landing date',
                    format: PropertyFormat['date-time'],
                },
                from: {
                    type: PropertyType.string,
                    title: 'Departure location',
                },
                to: {
                    type: PropertyType.string,
                    title: 'Arrival location',
                },
                planeType: {
                    type: PropertyType.string,
                    title: 'Plane type',
                },
            },
            hide: [],
        },
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesOrder: ['flightNumber', 'departureDate', 'landingDate', 'from', 'to', 'planeType'],
        propertiesPreview: ['flightNumber', 'from', 'to'],
        disabled: false,
        iconFileId: null,
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
                    type: PropertyType.string,
                    title: 'שם',
                },
                destination: {
                    type: PropertyType.string,
                    title: 'יעד',
                },
                startDate: {
                    type: PropertyType.string,
                    title: 'תאריך התחלה',
                    format: PropertyFormat.date,
                },
                endDate: {
                    type: PropertyType.string,
                    title: 'תאריך סיום',
                    format: PropertyFormat.date,
                },
                firstFile: {
                    type: PropertyType.string,
                    title: 'קובץ ראשון',
                    format: PropertyFormat.fileId,
                },
                active: {
                    type: PropertyType.boolean,
                    title: 'פעיל',
                },
            },
            hide: [],
        },
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesOrder: ['name', 'destination', 'startDate', 'endDate', 'firstFile'],
        propertiesPreview: ['name', 'destination', 'startDate', 'endDate'],
        disabled: false,
        iconFileId: null,
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
                    type: PropertyType.string,
                    title: 'שם',
                },
                airportId: {
                    type: PropertyType.string,
                    title: 'מזהה',
                },
                country: {
                    type: PropertyType.string,
                    title: 'מדינה',
                },
            },
            hide: [],
        },
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesOrder: ['airportName', 'airportId', 'country'],
        propertiesPreview: ['airportName', 'country'],
        iconFileId: null,
    };

    const allEntityTemplates = [travelAgentEntityTemplate, flightEntityTemplate, tripEntityTemplate, airportEntityTemplate];
    const allEntityTemplateIds = allEntityTemplates.map(({ _id }) => _id);

    const flightsOnRelationshipTemplate: IMongoRelationshipTemplate = {
        _id: generateMongoId(),
        name: 'flies on',
        displayName: 'flies on',
        sourceEntityId: travelAgentEntityTemplate._id,
        destinationEntityId: flightEntityTemplate._id,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const tripConnectedToFlightRelationshipTemplate: IMongoRelationshipTemplate = {
        _id: generateMongoId(),
        name: 'flightInTrip',
        displayName: 'טיסה משוייכת לטיול',
        sourceEntityId: flightEntityTemplate._id,
        destinationEntityId: tripEntityTemplate._id,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const departureFromRelationshipTemplate: IMongoRelationshipTemplate = {
        _id: generateMongoId(),
        name: 'departueFrom',
        displayName: 'ממריא מ',
        sourceEntityId: flightEntityTemplate._id,
        destinationEntityId: airportEntityTemplate._id,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const tripConnectedToAirportRelationshipTemplate: IMongoRelationshipTemplate = {
        _id: generateMongoId(),
        name: 'tripConnectedToAirport',
        displayName: 'טיסה משוייכת לשדה תעופה',
        sourceEntityId: airportEntityTemplate._id,
        destinationEntityId: tripEntityTemplate._id,
        createdAt: new Date(),
        updatedAt: new Date(),
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
        doesFormulaHaveTodayFunc: false,
        formula: {
            isGroup: true,
            ruleOfGroup: Conjunction.OR,
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
                    ruleOfGroup: Conjunction.AND,
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
        doesFormulaHaveTodayFunc: false,
        formula: {
            isGroup: true,
            ruleOfGroup: Conjunction.AND,
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
                    ruleOfGroup: Conjunction.AND,
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
                            ruleOfGroup: Conjunction.OR,
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
        doesFormulaHaveTodayFunc: false,
        formula: {
            isGroup: true,
            ruleOfGroup: Conjunction.AND,
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
                    ruleOfGroup: Conjunction.AND,
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
                            ruleOfGroup: Conjunction.OR,
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
        doesFormulaHaveTodayFunc: false,
        formula: {
            isGroup: true,
            ruleOfGroup: Conjunction.AND,
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
