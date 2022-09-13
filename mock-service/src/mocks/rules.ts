export const rulesCreator = (fliesOnId: string, flightInTripId: string, flightId: string, touristId: string, tripId: string) => [
    {
        name: 'סוכן נסיעות אחד על טיסה',
        description: 'סוכן נסיעות אחד בלבד על טיסה. נועד למנוע מריבות בין סוכני נסיעות, כי הם לא אוהבים אחד את השני',
        actionOnFail: 'WARNING',
        relationshipTemplateId: fliesOnId,
        pinnedEntityTemplateId: flightId,
        unpinnedEntityTemplateId: touristId,
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isEquation: true,
                    operatorBool: 'lessThanOrEqual',
                    lhsArgument: {
                        isCountAggFunction: true,
                        variableName: `${flightId}.${fliesOnId}.${touristId}`,
                    },
                    rhsArgument: { isConstant: true, value: 1 },
                },
            ],
        },
    },
    {
        name: 'טיסה אחת ביום לטיול',
        description: 'מקסימום טיסה אחת ביום לאותו הטיול. אסור שיהיו כמה טיסות לאותו הטיול באותו היום כי אחרת זה יהיה ממש מבלבל',
        actionOnFail: 'WARNING',
        relationshipTemplateId: flightInTripId,
        pinnedEntityTemplateId: tripId,
        unpinnedEntityTemplateId: flightId,
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isAggregationGroup: true,
                    aggregation: 'EVERY',
                    variableNameOfAggregation: `${tripId}.${flightInTripId}.${flightId}`,
                    ruleOfGroup: 'AND',
                    subFormulas: [
                        {
                            isEquation: true,
                            operatorBool: 'equals',
                            lhsArgument: {
                                isPropertyOfVariable: true,
                                variableName: `${tripId}.${flightInTripId}.${flightId}`,
                                property: 'departureDate',
                            },
                            rhsArgument: { isPropertyOfVariable: true, variableName: flightId, property: 'departureDate' },
                        },
                    ],
                },
            ],
        },
    },
    {
        name: 'התראה על טיסות בסבב פעיל',
        description: 'התראה על כל טיסה חדשה שמחוברת לסבב פעיל',
        actionOnFail: 'WARNING',
        relationshipTemplateId: flightInTripId,
        pinnedEntityTemplateId: tripId,
        unpinnedEntityTemplateId: flightId,
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isEquation: true,
                    operatorBool: 'equals',
                    lhsArgument: { isPropertyOfVariable: true, variableName: tripId, property: 'name' },
                    rhsArgument: { isConstant: true, value: 'false' },
                },
            ],
        },
    },
];
