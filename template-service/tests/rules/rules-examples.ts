import { IMongoCategory } from '@packages/category';
import { Conjunction } from '@packages/common';
import { IEntityTemplatePopulated, PropertyFormat, PropertyType } from '@packages/entity-template';
import { IMongoRelationshipTemplate } from '@packages/relationship-template';
import { ActionOnFail, IRule } from '@packages/rule';

export const fakeStupidCategory: IMongoCategory = {
    _id: 'unnecessary-category',
    color: '000000',
    name: 'stupid category for mock',
    displayName: 'because typescript is smart',
    iconFileId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    templatesOrder: [],
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
                type: PropertyType.string,
                title: 'שם פרטי',
            },
            lastName: {
                type: PropertyType.string,
                title: 'שם משפחה',
            },
            age: {
                type: PropertyType.number,
                title: 'גיל',
            },
            gender: {
                type: PropertyType.boolean,
                title: 'זכר',
            },
            agentId: {
                type: PropertyType.string,
                title: 'מזהה סוכן',
            },
        },
        hide: [],
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
    category: {
        _id: '123',
        color: '000000',
        name: 'stupid category for mock',
        displayName: 'because typescript is smart',
        createdAt: new Date(),
        updatedAt: new Date(),
        iconFileId: null,
        templatesOrder: [],
    },
    properties: {
        type: 'object',
        properties: {
            flightNumber: {
                type: PropertyType.string,
                title: 'מספר טיסה',
            },
            departureDate: {
                type: PropertyType.string,
                title: 'תאריך המראה',
                format: PropertyFormat['date-time'],
            },
            landingDate: {
                type: PropertyType.string,
                title: 'תאריך נחיתה',
                format: PropertyFormat['date-time'],
            },
            from: {
                type: PropertyType.string,
                title: 'מקום המראה',
            },
            to: {
                type: PropertyType.string,
                title: 'מקום הנחיתה',
            },
            planeType: {
                type: PropertyType.string,
                title: 'סוג המטוס',
            },
        },
        hide: [],
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
        },
        hide: [],
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
    createdAt: new Date(),
    updatedAt: new Date(),
};

// rule 1
export const oneTravelAgentPerFlight: IRule = {
    name: 'סוכן נסיעות אחד על טיסה',
    description: 'סוכן נסיעות אחד בלבד על טיסה. נועד למנוע מריבות בין סוכני נסיעות, כי הם לא אוהבים אחד את השני',
    actionOnFail: ActionOnFail.WARNING,
    entityTemplateId: flightEntityTemplate._id,
    formula: {
        isGroup: true,
        ruleOfGroup: Conjunction.AND,
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
    doesFormulaHaveTodayFunc: false,
};

// rule 2
export const noOverlappingFlightsInTrip: IRule = {
    name: 'טיסה אחת ביום לטיול',
    description: 'מקסימום טיסה אחת ביום לאותו הטיול. אסור שיהיו כמה טיסות לאותו הטיול באותו היום כי אחרת זה יהיה ממש מבלבל',
    actionOnFail: ActionOnFail.WARNING,
    disabled: false,
    entityTemplateId: tripEntityTemplate._id,
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
        ruleOfGroup: Conjunction.AND,
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
    doesFormulaHaveTodayFunc: false,
};
