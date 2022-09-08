import MockAdapter from 'axios-mock-adapter';

const rules = [
    {
        _id: '61e3ea6e4d53a23e87e43c7c',
        isRelationshipTemplateRule: true,
        name: 'סוכן נסיעות אחד על טיסה',
        description: 'סוכן נסיעות אחד בלבד על טיסה. נועד למנוע מריבות בין סוכני נסיעות, כי הם לא אוהבים אחד את השני',
        actionOnFail: 'WARNING',
        relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
        pinnedEntityTemplateId: '61e3ea6e4d51a83e87e83c81',
        unpinnedEntityTemplateId: '61e3ea6e4d51a83e87e83c7f',
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isEquation: true,
                    operatorBool: 'lessThanOrEqual',
                    lhsArgument: {
                        isCountAggFunction: true,
                        variableName: '61e3ea6e4d51a83e87e83c81.61e3ea6e4d51a83e87e43c7c.61e3ea6e4d51a83e87e83c7f',
                    },
                    rhsArgument: { isConstant: true, value: 1 },
                },
            ],
        },
    },
    {
        _id: '61e3ea6e4d83a23e87e43c7c',
        isRelationshipTemplateRule: true,
        name: 'טיסה אחת ביום לטיול',
        description: 'מקסימום טיסה אחת ביום לאותו הטיול. אסור שיהיו כמה טיסות לאותו הטיול באותו היום כי אחרת זה יהיה ממש מבלבל',
        actionOnFail: 'WARNING',
        relationshipTemplateId: '61e3ea6e3d51a83e87e42c7c',
        pinnedEntityTemplateId: '61e3ea6e4d51a83e87e83c7e',
        unpinnedEntityTemplateId: '61e3ea6e4d51a83e87e83c81',
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isAggregationGroup: true,
                    aggregation: 'EVERY',
                    variableNameOfAggregation: '61e3ea6e4d51a83e87e83c7e.61e3ea6e3d51a83e87e42c7c.61e3ea6e4d51a83e87e83c81',
                    ruleOfGroup: 'AND',
                    subFormulas: [
                        {
                            isEquation: true,
                            operatorBool: 'equals',
                            lhsArgument: {
                                isPropertyOfVariable: true,
                                variableName: '61e3ea6e4d51a83e87e83c7e.61e3ea6e3d51a83e87e42c7c.61e3ea6e4d51a83e87e83c81',
                                property: 'departureDate',
                            },
                            rhsArgument: { isPropertyOfVariable: true, variableName: '61e3ea6e4d51a83e87e83c81', property: 'departureDate' },
                        },
                    ],
                },
            ],
        },
    },
    {
        _id: '61e3ea6e4d53a13e87e43c7c',
        isRelationshipTemplateRule: true,
        name: 'התראה על טיסות בסבב פעיל',
        description: 'התראה על כל טיסה חדשה שמחוברת לסבב פעיל',
        actionOnFail: 'WARNING',
        relationshipTemplateId: '61e3ea6e3d51a83e87e42c7c',
        pinnedEntityTemplateId: '61e3ea6e4d51a83e87e83c7e',
        unpinnedEntityTemplateId: '61e3ea6e4d51a83e87e83c81',
        formula: {
            isGroup: true,
            ruleOfGroup: 'AND',
            subFormulas: [
                {
                    isEquation: true,
                    operatorBool: 'equals',
                    lhsArgument: { isPropertyOfVariable: true, variableName: '61e3ea6e4d51a83e87e83c7e', property: 'name' },
                    rhsArgument: { isConstant: true, value: 'false' },
                },
            ],
        },
    },
];

const mockRules = (mock: MockAdapter) => {
    // Create
    mock.onPost('/api/templates/rules').reply(() => [
        200,
        {
            _id: '61e3ea6e4d53a23e87e43c7c',
            isRelationshipTemplateRule: true,
            name: 'סוכן נסיעות אחד על טיסה',
            description: 'סוכן נסיעות אחד בלבד על טיסה. נועד למנוע מריבות בין סוכני נסיעות, כי הם לא אוהבים אחד את השני',
            actionOnFail: 'WARNING',
            relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
            pinnedEntityTemplateId: '61e3ea6e4d51a83e87e83c81',
            unpinnedEntityTemplateId: '61e3ea6e4d51a83e87e83c7f',
            formula: {
                isGroup: true,
                ruleOfGroup: 'AND',
                subFormulas: [
                    {
                        isEquation: true,
                        operatorBool: 'lessThanOrEqual',
                        lhsArgument: {
                            isCountAggFunction: true,
                            variableName: '61e3ea6e4d51a83e87e83c81.61e3ea6e4d51a83e87e43c7c.61e3ea6e4d51a83e87e83c80',
                        },
                        rhsArgument: { isConstant: true, value: 1 },
                    },
                ],
            },
        },
    ]);

    // Update
    mock.onPut(/\/api\/templates\/rules\/[0-9a-fA-F]{24}/).reply(() => [
        200,
        {
            _id: '61e3ea6e4d53a23e87e43c7c',
            isRelationshipTemplateRule: true,
            name: 'סוכן נסיעות אחד על טיסהההההההההההההההה',
            description: 'סוכן נסיעות אחד בלבד על טיסה. נועד למנוע מריבות בין סוכני נסיעות, כי הם לא אוהבים אחד את השני',
            actionOnFail: 'WARNING',
            relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
            pinnedEntityTemplateId: '61e3ea6e4d51a83e87e83c81',
            unpinnedEntityTemplateId: '61e3ea6e4d51a83e87e83c7f',
            formula: {
                isGroup: true,
                ruleOfGroup: 'AND',
                subFormulas: [
                    {
                        isEquation: true,
                        operatorBool: 'lessThanOrEqual',
                        lhsArgument: {
                            isCountAggFunction: true,
                            variableName: '61e3ea6e4d51a83e87e83c81.61e3ea6e4d51a83e87e43c7c.61e3ea6e4d51a83e87e83c80',
                        },
                        rhsArgument: { isConstant: true, value: 1 },
                    },
                ],
            },
        },
    ]);

    // Delete
    mock.onDelete(/\/api\/templates\/rules\/[0-9a-fA-F]{24}/).reply(() => [200, {}]);
};

export { mockRules, rules };
