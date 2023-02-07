import MockAdapter from 'axios-mock-adapter';
import { Chance } from 'chance';
import { generateRuleBreachRequest } from './ruleBreaches';
import { environment } from '../globals';
import { IRuleBreach, IRuleBreachPopulated } from '../interfaces/ruleBreaches/ruleBreach';

const { errorCodes } = environment;

const chance = new Chance();

const unpopulateBrokenRules = (brokenRulesPopulated: IRuleBreachPopulated['brokenRules']): IRuleBreach['brokenRules'] => {
    return brokenRulesPopulated.map(({ ruleId, relationships }) => ({
        ruleId,
        relationshipIds: relationships.map((relationship) => {
            if (typeof relationship === 'string') {
                return relationship;
            }
            return relationship!.properties._id;
        }),
    }));
};

const mockRelationships = (mock: MockAdapter) => {
    mock.onPost('/api/instances/relationships').reply(({ data }) => {
        const { relationshipInstance: relationshipToCreate, ignoredRules } = JSON.parse(data);

        const isSuccess = ignoredRules ? true : chance.bool();

        if (isSuccess) {
            return [
                200,
                {
                    ...relationshipToCreate,
                    properties: { ...relationshipToCreate.properties, _id: '012345678901234567890123' },
                },
            ];
        }

        const { brokenRules } = generateRuleBreachRequest({ nullable: false });

        return [
            400,
            {
                metadata: {
                    errorCode: errorCodes.ruleBlock,
                    brokenRules,
                    rawBrokenRules: unpopulateBrokenRules(brokenRules),
                },
            },
        ];
    });

    mock.onDelete(/\/api\/instances\/relationships\/[0-9a-fA-F]{24}/).reply(({ data }) => {
        const { ignoredRules } = JSON.parse(data);

        const isSuccess = ignoredRules ? true : chance.bool();

        if (isSuccess) {
            return [
                200,
                {}, // backend should return deleted relationship, but not used anyway in UI
            ];
        }

        const { brokenRules } = generateRuleBreachRequest({ nullable: false });

        return [
            400,
            {
                metadata: {
                    errorCode: errorCodes.ruleBlock,
                    brokenRules,
                    rawBrokenRules: unpopulateBrokenRules(brokenRules),
                },
            },
        ];
    });
};

export { mockRelationships };
