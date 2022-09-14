import MockAdapter from 'axios-mock-adapter';
/* eslint-disable import/no-extraneous-dependencies */
import { Chance } from 'chance';
import { unpopulateBrokenRules } from '../services/ruleBreachesService';
import { generateRuleBreachRequest } from './ruleBreaches';

const chance = new Chance();

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
                    errorCode: 'RULE_BLOCK',
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
                    errorCode: 'RULE_BLOCK',
                    brokenRules,
                    rawBrokenRules: unpopulateBrokenRules(brokenRules),
                },
            },
        ];
    });
};

export { mockRelationships };
