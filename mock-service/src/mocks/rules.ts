import { ActionOnFail, IRule } from '@packages/rule';

const rulesCreator = (
    fliesOnId: string,
    flightInTripId: string,
    departueFromId: string,
    tripConnectedToAirportId: string,
    flightId: string,
    touristId: string,
    tripId: string,
    airportId: string,
): Omit<IRule, 'doesFormulaHaveTodayFunc'>[] => [
    {
        name: 'סוכן נסיעות אחד על טיסה',
        description: 'סוכן נסיעות אחד בלבד על טיסה. נועד למנוע מריבות בין סוכני נסיעות, כי הם לא אוהבים אחד את השני',
        actionOnFail: ActionOnFail.WARNING,
        disabled: false,
        entityTemplateId: flightId,
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isEquation: true,
                    operatorBool: 'lessThanOrEqual',
                    lhsArgument: {
                        isCountAggFunction: true,
                        variable: {
                            entityTemplateId: flightId,
                            aggregatedRelationship: {
                                relationshipTemplateId: fliesOnId,
                                otherEntityTemplateId: touristId,
                            },
                        },
                    },
                    rhsArgument: { isConstant: true, type: 'number', value: 1 },
                },
            ],
        },
    },
    {
        name: 'טיסה אחת ביום לטיול',
        description: 'מקסימום טיסה אחת ביום לאותו הטיול. אסור שיהיו כמה טיסות לאותו הטיול באותו היום כי אחרת זה יהיה ממש מבלבל',
        actionOnFail: ActionOnFail.WARNING,
        disabled: false,
        entityTemplateId: tripId,
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isAggregationGroup: true,
                    aggregation: 'EVERY',
                    variableOfAggregation: {
                        entityTemplateId: tripId,
                        aggregatedRelationship: {
                            relationshipTemplateId: flightInTripId,
                            otherEntityTemplateId: flightId,
                        },
                    },
                    ruleOfGroup: 'AND',
                    subFormulas: [
                        {
                            isAggregationGroup: true,
                            aggregation: 'EVERY',
                            variableOfAggregation: {
                                entityTemplateId: tripId,
                                aggregatedRelationship: {
                                    relationshipTemplateId: flightInTripId,
                                    otherEntityTemplateId: flightId,
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
                                                    entityTemplateId: tripId,
                                                    aggregatedRelationship: {
                                                        relationshipTemplateId: flightInTripId,
                                                        otherEntityTemplateId: flightId,
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
                                                    entityTemplateId: tripId,
                                                    aggregatedRelationship: {
                                                        relationshipTemplateId: flightInTripId,
                                                        otherEntityTemplateId: flightId,
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
                                            entityTemplateId: tripId,
                                            aggregatedRelationship: {
                                                relationshipTemplateId: flightInTripId,
                                                otherEntityTemplateId: flightId,
                                            },
                                        },
                                        property: '_id',
                                    },
                                    rhsArgument: {
                                        isPropertyOfVariable: true,
                                        variable: {
                                            entityTemplateId: tripId,
                                            aggregatedRelationship: {
                                                relationshipTemplateId: flightInTripId,
                                                otherEntityTemplateId: flightId,
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
    },
    {
        name: 'התראה על טיסות בסבב פעיל',
        description: 'התראה על כל טיסה חדשה שמחוברת לסבב פעיל',
        actionOnFail: ActionOnFail.WARNING,
        disabled: false,
        entityTemplateId: airportId,
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isAggregationGroup: true,
                    aggregation: 'EVERY',
                    variableOfAggregation: {
                        entityTemplateId: airportId,
                        aggregatedRelationship: {
                            relationshipTemplateId: departueFromId,
                            otherEntityTemplateId: flightId,
                        },
                    },
                    ruleOfGroup: 'AND',
                    subFormulas: [
                        {
                            isAggregationGroup: true,
                            aggregation: 'EVERY',
                            variableOfAggregation: {
                                entityTemplateId: airportId,
                                aggregatedRelationship: {
                                    relationshipTemplateId: tripConnectedToAirportId,
                                    otherEntityTemplateId: tripId,
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
                                            entityTemplateId: airportId,
                                            aggregatedRelationship: {
                                                relationshipTemplateId: tripConnectedToAirportId,
                                                otherEntityTemplateId: tripId,
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
                                                    entityTemplateId: airportId,
                                                    aggregatedRelationship: {
                                                        relationshipTemplateId: departueFromId,
                                                        otherEntityTemplateId: flightId,
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
                                            entityTemplateId: airportId,
                                            aggregatedRelationship: {
                                                relationshipTemplateId: tripConnectedToAirportId,
                                                otherEntityTemplateId: tripId,
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
                                                    entityTemplateId: airportId,
                                                    aggregatedRelationship: {
                                                        relationshipTemplateId: departueFromId,
                                                        otherEntityTemplateId: flightId,
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
    },
];

export default rulesCreator;
