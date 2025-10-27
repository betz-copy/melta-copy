const axios = require('axios');
const mongoose = require('mongoose');

const MONGO_URL = 'mongodb://localhost';
const INSTANCE_SERVICE_URL = 'http://localhost:8007';

const COUNT_1_RULE_IDS = ['6690bbed306c5aece178ae0e'];
const NO_OVERLAPPING_FLIGHTS_RULE_ID = '6690bbed306c5aece178ae16';
const ALL_RULE_IDS = ['6690bbed306c5aece178ae0e', '6690bbed306c5aece178ae16'];

const getMongoModels = async ({ ruleModelName = 'rules', alertModelName = 'rule-breach-alerts' } = {}) => {
    console.log('starting...');
    const templateServiceConn = await mongoose.createConnection(MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: true,
        dbName: 'template-service',
    });
    const ruleBreachServiceConn = await mongoose.createConnection(MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: true,
        dbName: 'rule-breach-service',
    });

    const ruleModel = templateServiceConn.model(ruleModelName, new mongoose.Schema({}, { strict: false, collection: ruleModelName }));
    const relationshipModel = templateServiceConn.model('relationship-template', new mongoose.Schema({}, { strict: false }));
    const alertModel = ruleBreachServiceConn.model(alertModelName, new mongoose.Schema({}, { strict: false, collection: alertModelName }));

    return { ruleModel, relationshipModel, alertModel };
};

const getInstanceFromRelationshipIdOfOldAlert = (alert, relationshipId, pinnedEntityId, relationships) => {
    if (relationshipId === 'created-relationship-id') {
        return {
            entityId: pinnedEntityId,
            aggregatedRelationship: {
                relationshipId: 'created-relationship-id',
                otherEntityId:
                    alert.actionMetadata.sourceEntityId === pinnedEntityId
                        ? alert.actionMetadata.destinationEntityId
                        : alert.actionMetadata.sourceEntityId,
            },
        };
    }

    const rel = relationships.find((relationship) => relationship.properties._id === relationshipId);

    let otherEntityId;
    if (!rel) otherEntityId = '00000000-0000-0000-0000-000000000000';
    else otherEntityId = rel.sourceEntityId === pinnedEntityId ? rel.destinationEntityId : rel.sourceEntityId;

    return {
        entityId: pinnedEntityId,
        aggregatedRelationship: {
            relationshipId,
            otherEntityId,
        },
    };
};

const migrateCount1Rules = async () => {
    const { ruleModel } = await getMongoModels();

    for (const ruleId of COUNT_1_RULE_IDS) {
        const rule = await ruleModel.findById(ruleId).orFail(new Error('fu')).lean().exec();

        const newRule = {
            _id: rule._id,
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt,
            disabled: rule.disabled,

            name: rule.name,
            description: rule.description,
            actionOnFail: rule.actionOnFail,
            formula: {
                ...rule.formula,
                subFormulas: [
                    {
                        ...rule.formula.subFormulas[0],
                        lhsArgument: {
                            isCountAggFunction: true,
                            variable: {
                                entityTemplateId: rule.pinnedEntityTemplateId,
                                aggregatedRelationship: {
                                    relationshipTemplateId: rule.relationshipTemplateId,
                                    otherEntityTemplateId: rule.unpinnedEntityTemplateId,
                                },
                            },
                        },
                    },
                ],
            },
            entityTemplateId: rule.pinnedEntityTemplateId,
        };

        console.log(`got info! updating rule ${rule._id}...`);
        await ruleModel.findByIdAndUpdate(newRule._id, newRule, { overwrite: true }).exec();

        console.log(`updated rule!`, newRule);
    }
};

const getPinnedEntityIdOfBrokenRule = (alert, rule, relationships, isPinnedAsSource) => {
    if (action.actionType === 'update-entity') {
        const someRelationshipOfRule = relationships.find((rel) => rel.templateId === rule.relationshipTemplateId);
        if (someRelationshipOfRule) return isPinnedAsSource ? someRelationshipOfRule.sourceEntityId : someRelationshipOfRule.destinationEntityId;
        return '00000000-0000-0000-0000-000000000000';
    }
    if (action.actionType === 'create-relationship' || action.actionType === 'delete-relationship') {
        return isPinnedAsSource ? alert.actionMetadata.sourceEntityId : alert.actionMetadata.destinationEntityId;
    }

    throw new Error(`not possible alert.actionType ${alert.actionType}`);
};

const migrateRuleBreaches = async () => {
    const {
        ruleModel: oldRuleModel,
        relationshipModel,
        alertModel,
    } = await getMongoModels({ ruleModelName: 'rules-backups', alertModelName: 'rule-breach-alerts-fixes' });

    for (const ruleId of ALL_RULE_IDS) {
        console.log(`connected! getting info for ruleId "${ruleId}"...`);
        const rule = await oldRuleModel.findById(ruleId).orFail(new Error('fu')).lean().exec();

        const relationshipTemplate = await relationshipModel.findById(rule.relationshipTemplateId).orFail(new Error('fu')).lean().exec();
        const isPinnedAsSource = relationshipTemplate.sourceEntityId === rule.pinnedEntityTemplateId;

        const alerts = await alertModel.find({ 'brokenRules.ruleId': ruleId }).lean().exec();

        console.log(alerts.length);
        for (const alert of alerts) {
            console.log('updating alert...');

            if (alert.actionMetadata.before) alert.actionMetadata.before = alert.actionMetadata.before.properties ?? alert.actionMetadata.before;

            const newAlert = {
                ...alert,
                brokenRules: await Promise.all(
                    alert.brokenRules.map(async (brokenRule) => {
                        if (brokenRule.ruleId !== String(rule._id)) return brokenRule;

                        const { data: relationships } = await axios.post(`${INSTANCE_SERVICE_URL}/api/instances/relationships/ids`, {
                            ids: brokenRule.relationshipIds,
                        });

                        const pinnedEntityId = getPinnedEntityIdOfBrokenRule(alert, rule, relationships, isPinnedAsSource);

                        return {
                            ruleId: brokenRule.ruleId,
                            failures: [
                                {
                                    entityId: pinnedEntityId,
                                    causes: brokenRule.relationshipIds.map((relationshipId) => {
                                        return {
                                            instance: getInstanceFromRelationshipIdOfOldAlert(alert, relationshipId, pinnedEntityId, relationships),
                                            properties: [],
                                        };
                                    }),
                                },
                            ],
                        };
                    }),
                ),
            };

            await alertModel.findByIdAndUpdate(alert._id, newAlert).exec();
            console.log('updated alert!', JSON.stringify(newAlert, null, 2));
        }
    }
};

const getNoOverlappingFormulaByOldRule = (rule, dateTimeOverlappingField) => {
    return {
        isGroup: true,
        ruleOfGroup: 'AND',
        subFormulas: [
            {
                isAggregationGroup: true,
                variableOfAggregation: {
                    entityTemplateId: rule.pinnedEntityTemplateId,
                    aggregatedRelationship: {
                        relationshipTemplateId: rule.relationshipTemplateId,
                        otherEntityTemplateId: rule.unpinnedEntityTemplateId,
                    },
                },
                aggregation: 'EVERY',
                ruleOfGroup: 'AND',
                subFormulas: [
                    {
                        isAggregationGroup: true,
                        variableOfAggregation: {
                            entityTemplateId: rule.pinnedEntityTemplateId,
                            aggregatedRelationship: {
                                relationshipTemplateId: rule.relationshipTemplateId,
                                otherEntityTemplateId: rule.unpinnedEntityTemplateId,
                                variableNameSuffix: '2',
                            },
                        },
                        aggregation: 'EVERY',
                        ruleOfGroup: 'OR',
                        subFormulas: [
                            {
                                isEquation: true,
                                operatorBool: 'equals',
                                lhsArgument: {
                                    isPropertyOfVariable: true,
                                    variable: {
                                        entityTemplateId: rule.pinnedEntityTemplateId,
                                        aggregatedRelationship: {
                                            relationshipTemplateId: rule.relationshipTemplateId,
                                            otherEntityTemplateId: rule.unpinnedEntityTemplateId,
                                        },
                                    },
                                    property: '_id',
                                },
                                rhsArgument: {
                                    isPropertyOfVariable: true,
                                    variable: {
                                        entityTemplateId: rule.pinnedEntityTemplateId,
                                        aggregatedRelationship: {
                                            relationshipTemplateId: rule.relationshipTemplateId,
                                            otherEntityTemplateId: rule.unpinnedEntityTemplateId,
                                            variableNameSuffix: '2',
                                        },
                                    },
                                    property: '_id',
                                },
                            },
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
                                                entityTemplateId: rule.pinnedEntityTemplateId,
                                                aggregatedRelationship: {
                                                    relationshipTemplateId: rule.relationshipTemplateId,
                                                    otherEntityTemplateId: rule.unpinnedEntityTemplateId,
                                                },
                                            },
                                            property: dateTimeOverlappingField,
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
                                                entityTemplateId: rule.pinnedEntityTemplateId,
                                                aggregatedRelationship: {
                                                    relationshipTemplateId: rule.relationshipTemplateId,
                                                    otherEntityTemplateId: rule.unpinnedEntityTemplateId,
                                                    variableNameSuffix: '2',
                                                },
                                            },
                                            property: dateTimeOverlappingField,
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    };
};

const migrateNoOverlappingRules = async () => {
    const { ruleModel } = await getMongoModels();

    console.log(`connected! getting info for ruleId "${NO_OVERLAPPING_FLIGHTS_RULE_ID}"...`);
    const rule = await ruleModel.findById(NO_OVERLAPPING_FLIGHTS_RULE_ID).orFail(new Error('fu')).lean().exec();

    const dateTimeOverlappingField = rule.formula.subFormulas[0].subFormulas[0].lhsArgument.arguments[0].property;

    const newRule = {
        _id: rule._id,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        disabled: rule.disabled,

        name: rule.name,
        description: rule.description,
        actionOnFail: rule.actionOnFail,
        formula: getNoOverlappingFormulaByOldRule(rule, dateTimeOverlappingField),
        entityTemplateId: rule.pinnedEntityTemplateId,
    };

    console.log(`got info! updating rule ${rule._id}...`);
    await ruleModel.findByIdAndUpdate(newRule._id, newRule, { overwrite: true }).exec();
    console.log(`updated rule!`, newRule);
};

const main = async () => {
    await migrateCount1Rules();
    await migrateNoOverlappingRules();
    await migrateRuleBreaches();

    mongoose.connections.forEach((conn) => conn.close());
};
main();
