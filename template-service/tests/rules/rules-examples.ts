import { ActionOnFail } from '@microservices/shared';
import { ICategory, IEntityTemplatePopulated } from '../../src/express/externalServices/entityTemplateManager';
import { IMongoRelationshipTemplate } from '../../src/express/relationshipTemplate/interface';
import { IRule } from '../../src/express/rule/interfaces';

export const fakeStupidCategory: ICategory = {
    _id: 'unnecessary-category',
    color: '000000',
    name: 'stupid category for mock',
    displayName: 'because typescript is smart',
    iconFileId: null,
};

export const travelAgentEntityTemplate: IEntityTemplatePopulated = {
    _id: '111',
    name: 'travelAgent',
    displayName: 'סוכן נסיעות',
    category: fakeStupidCategory,
    properties: {
        type: 'object',
        properties: {
            firstName: {
                type: 'string',
                title: 'שם פרטי',
            },
            lastName: {
                type: 'string',
                title: 'שם משפחה',
            },
            age: {
                type: 'number',
                title: 'גיל',
            },
            gender: {
                type: 'boolean',
                title: 'זכר',
            },
            agentId: {
                type: 'string',
                title: 'מזהה סוכן',
            },
        },
        required: ['firstName', 'lastName', 'agentId'],
    },
    propertiesOrder: ['firstName', 'lastName', 'age', 'gender', 'agentId'],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: ['firstName', 'lastName', 'age'],
    disabled: false,
    iconFileId: null,
};

export const flightEntityTemplate: IEntityTemplatePopulated = {
    _id: '222',
    name: 'flight',
    displayName: 'טיסה',
    category: fakeStupidCategory,
    properties: {
        type: 'object',
        properties: {
            flightNumber: {
                type: 'string',
                title: 'מספר טיסה',
            },
            departureDate: {
                type: 'string',
                title: 'תאריך המראה',
                format: 'date-time',
            },
            landingDate: {
                type: 'string',
                title: 'תאריך נחיתה',
                format: 'date-time',
            },
            from: {
                type: 'string',
                title: 'מקום המראה',
            },
            to: {
                type: 'string',
                title: 'מקום הנחיתה',
            },
            planeType: {
                type: 'string',
                title: 'סוג המטוס',
            },
        },
        required: ['flightNumber', 'departureDate', 'landingDate'],
    },
    propertiesOrder: ['flightNumber', 'departureDate', 'landingDate', 'from', 'to', 'planeType'],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: ['flightNumber', 'from', 'to'],
    disabled: false,
    iconFileId: null,
};

export const flightsOnRelationshipTemplate: IMongoRelationshipTemplate = {
    _id: '111',
    name: 'flies on',
    displayName: 'טס על',
    sourceEntityId: travelAgentEntityTemplate._id,
    destinationEntityId: flightEntityTemplate._id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export const tripEntityTemplate: IEntityTemplatePopulated = {
    _id: '333',
    name: 'trip',
    displayName: 'טיול',
    category: fakeStupidCategory,
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
        },
        required: ['name', 'destination'],
    },
    propertiesOrder: ['name', 'destination', 'startDate', 'endDate', 'firstFile'],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: ['name', 'destination', 'startDate', 'endDate'],
    disabled: false,
    iconFileId: null,
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

// rule 1
export const oneTravelAgentPerFlight: IRule = {
    name: 'סוכן נסיעות אחד על טיסה',
    description: 'סוכן נסיעות אחד בלבד על טיסה. נועד למנוע מריבות בין סוכני נסיעות, כי הם לא אוהבים אחד את השני',
    actionOnFail: ActionOnFail.WARNING,
    entityTemplateId: flightEntityTemplate._id,
    formula: {
        isGroup: true,
        ruleOfGroup: 'AND',
        subFormulas: [
            {
                isEquation: true,
                operatorBool: 'equals',
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
                rhsArgument: { isConstant: true, type: 'number', value: 0 },
            },
        ],
    },
    disabled: false,
};

// rule 2
export const noOverlappingFlightsInTrip: IRule = {
    name: 'טיסה אחת ביום לטיול',
    description: 'מקסימום טיסה אחת ביום לאותו הטיול. אסור שיהיו כמה טיסות לאותו הטיול באותו היום כי אחרת זה יהיה ממש מבלבל',
    actionOnFail: ActionOnFail.WARNING,
    disabled: false,
    entityTemplateId: tripEntityTemplate._id,
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
export const warnOnEveryFlightOnActiveZone: IRule = {
    name: 'התראה על טיסות בטיול פעיל',
    description: 'התראה על כל טיסה חדשה שמחוברת לטיול פעיל',
    actionOnFail: ActionOnFail.WARNING,
    entityTemplateId: tripEntityTemplate._id,
    formula: {
        isGroup: true,
        ruleOfGroup: 'AND',
        subFormulas: [
            {
                isEquation: true,
                operatorBool: 'equals',
                lhsArgument: { isPropertyOfVariable: true, variable: { entityTemplateId: tripEntityTemplate._id }, property: 'name' },
                rhsArgument: { isConstant: true, type: 'string', value: 'false' },
            },
        ],
    },
    disabled: false,
};
