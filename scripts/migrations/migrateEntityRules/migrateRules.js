const axios = require('axios');
const mongoose = require('mongoose');

const MONGO_URL = 'mongodb://localhost';
const INSTANCE_SERVICE_URL = 'http://localhost:8007';

const COUNT_1_RULE_IDS = ['6690bbed306c5aece178ae0e'];
const NO_OVERLAPPING_FLIGHTS_RULE_ID = '6690bbed306c5aece178ae16';


const getMongoModels = async ({
    ruleModelName = 'rules',
    alertModelName = 'rule-breach-alerts',
} = {}) => {
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

const migrateCount1RuleBreaches = async () => {
    const {
        ruleModel: oldRuleModel,
        relationshipModel,
        alertModel: alertModel,
    } = await getMongoModels({ ruleModelName: 'rules-backups', alertModelName: 'rule-breach-alerts-fixes' });

    for (const ruleId of COUNT_1_RULE_IDS) {
        console.log(`connected! getting info for ruleId "${ruleId}"...`);
        const rule = await oldRuleModel.findById(ruleId).orFail(new Error('fu')).lean().exec();

        const relationshipTemplate = await relationshipModel.findById(rule.relationshipTemplateId).orFail(new Error('fu')).lean().exec();
        const isPinnedAsSource = relationshipTemplate.sourceEntityId === rule.pinnedEntityTemplateId;

        // can be only "create rel" for these rules
        const alerts = await alertModel.find({ actionType: 'create-relationship', 'brokenRules.ruleId': ruleId }).lean().exec();

        console.log(alerts.length);
        for (const alert of alerts) {
            console.log('updating alert...');
            const pinnedEntityId = isPinnedAsSource ? alert.actionMetadata.sourceEntityId : alert.actionMetadata.destinationEntityId;

            const newAlert = {
                ...alert,
                brokenRules: await Promise.all(
                    alert.brokenRules.map(async (brokenRule) => {
                        if (brokenRule.ruleId !== String(rule._id)) return brokenRule;

                        const { data: relationships } = await axios.post(`${INSTANCE_SERVICE_URL}/api/instances/relationships/ids`, {
                            ids: brokenRule.relationshipIds,
                        });

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
        subFormulas: [{
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
        }],

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

const migrateNoOverlappingRuleBreaches = async () => {
    const {
        ruleModel,
        relationshipModel,
        alertModel,
    } = await getMongoModels({ ruleModelName: 'rules-backups', alertModelName: 'rule-breach-alerts-fixes' });

    console.log(`connected! getting info for ruleId "${NO_OVERLAPPING_FLIGHTS_RULE_ID}"...`);
    const rule = await ruleModel.findById(NO_OVERLAPPING_FLIGHTS_RULE_ID).orFail(new Error('fu')).lean().exec();

    const dateTimeOverlappingField = rule.formula.subFormulas[0].subFormulas[0].lhsArgument.arguments[0].property;

    const relationshipTemplate = await relationshipModel.findById(rule.relationshipTemplateId).orFail(new Error('fu')).lean().exec();
    const isPinnedAsSource = relationshipTemplate.sourceEntityId === rule.pinnedEntityTemplateId;

    // can be create rel + update entity, for these rules. not many alert with "update entity", so I dont bother
    const alerts = await alertModel.find({ actionType: 'create-relationship', 'brokenRules.ruleId': NO_OVERLAPPING_FLIGHTS_RULE_ID }).lean().exec();

    console.log(alerts.length);
    for (const alert of alerts) {
        console.log('updating alert...');

        const newAlert = {
            ...alert,
            brokenRules: await Promise.all(
                alert.brokenRules.map(async (brokenRule) => {
                    if (brokenRule.ruleId !== String(rule._id)) return brokenRule;

                    const { data: relationships } = await axios.post(`${INSTANCE_SERVICE_URL}/api/instances/relationships/ids`, {
                        ids: brokenRule.relationshipIds,
                    });

                    const someRelationship = relationships[0] ?? alert.actionMetadata;
                    const pinnedEntityId = isPinnedAsSource ? someRelationship.sourceEntityId : someRelationship.destinationEntityId;

                    return {
                        ruleId: brokenRule.ruleId,
                        failures: [
                            {
                                entityId: pinnedEntityId,
                                causes: brokenRule.relationshipIds.map((relationshipId) => {
                                    // shouldnt always be both properties, sometimes it's not "new causes". but fuck it, too complex
                                    return {
                                        instance: getInstanceFromRelationshipIdOfOldAlert(alert, relationshipId, pinnedEntityId, relationships),
                                        properties: ['_id', dateTimeOverlappingField],
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
};

const main = async () => {
    await migrateCount1Rules();
    await migrateNoOverlappingRules();
    await migrateCount1RuleBreaches();
    await migrateNoOverlappingRuleBreaches();

    mongoose.connections.forEach(conn => conn.close());
}
main();
