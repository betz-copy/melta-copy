/* eslint-disable import/no-extraneous-dependencies */
import MockAdapter from 'axios-mock-adapter';
import { Chance } from 'chance';
import {
    ActionTypes,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadataPopulated,
    IUpdateEntityMetadataPopulated,
} from '../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreachPopulated } from '../interfaces/ruleBreaches/ruleBreach';
import { IRuleBreachAlertPopulated } from '../interfaces/ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated, RuleBreachRequestStatus } from '../interfaces/ruleBreaches/ruleBreachRequest';
import { generateMongoId, generateUser } from './permissions';
import { IEntity } from '../interfaces/entities';
import { IRelationship } from '../interfaces/relationships';

const chance = new Chance();

const fliesOn = {
    _id: '61e3ea6e4d51a83e87e43c7c',
    name: 'fliesOn',
    displayName: 'טס על',
    sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
    destinationEntityId: '61e3ea6e4d51a83e87e83c81',
};

const tourist1: IEntity = {
    templateId: '61e3ea6e4d51a83e87e83c7f',
    properties: {
        firstName: 'נועה',
        lastName: 'קירל',
        age: -20,
        gender: false,
        firstFile: 'blabla.docx',
        disabled: false,
        _id: '123451234512345123451110',
        createdAt: new Date(2345, 10, 1).toISOString(),
        updatedAt: new Date(2346, 10, 1).toISOString(),
    },
};

const tourist2: IEntity = {
    templateId: '61e3ea6e4d51a83e87e83c7f',
    properties: {
        firstName: 'סטטיק',
        lastName: 'זה חזק',
        age: 28,
        gender: true,
        _id: '123451234512345123451111',
        createdAt: new Date(2345, 10, 1).toISOString(),
        updatedAt: new Date(2346, 10, 1).toISOString(),
        disabled: false,
    },
};

const tourist3: IEntity = {
    templateId: '61e3ea6e4d51a83e87e83c7f',
    properties: {
        firstName: 'גל',
        lastName: 'גדות',
        age: 35,
        gender: false,
        _id: '123451234512345123451112',
        createdAt: new Date(2345, 10, 1).toISOString(),
        updatedAt: new Date(2346, 10, 1).toISOString(),
        disabled: false,
    },
};

const flight: IEntity = {
    templateId: '61e3ea6e4d51a83e87e83c81',
    properties: {
        flightNumber: 'AA123',
        departureDate: '2020-01-15T13:30:00.000Z',
        landingDate: '2020-01-15T14:30:00.000Z',
        from: 'NYC',
        to: 'ORL',
        planeType: 'B747-400',
        _id: '123451234512345123451138',
        createdAt: new Date(2345, 10, 1).toISOString(),
        updatedAt: new Date(2346, 10, 1).toISOString(),
        disabled: false,
    },
};

const tourist2OnFlight: IRelationship = {
    templateId: fliesOn._id,
    properties: { _id: '439589084490258314149654' },
    sourceEntityId: tourist2.properties._id,
    destinationEntityId: flight.properties._id,
};

const generateBrokenRules = (options?: { nullables?: boolean; actionType?: ActionTypes }): IRuleBreachPopulated['brokenRules'] => {
    const { nullables = true, actionType } = options ?? {};
    return [
        {
            ruleId: '61e3ea6e4d53a23e87e43c7c',
            failures: [
                {
                    entity: actionType === ActionTypes.CreateEntity ? 'created-entity-id' : flight,
                    causes: [
                        {
                            instance: { entity: flight, aggregatedRelationship: { relationship: tourist2OnFlight, otherEntity: tourist2 } },
                            properties: [],
                        },
                        {
                            instance: { entity: flight, aggregatedRelationship: { relationship: tourist2OnFlight, otherEntity: tourist3 } },
                            properties: [],
                        },
                        ...(nullables
                            ? [
                                  { instance: { entity: null }, properties: [] },
                                  { instance: { entity: null }, properties: [] },
                              ]
                            : []),
                    ],
                },
            ],
            ...(nullables
                ? [
                      {
                          ruleId: '61e3ea6e4d83a23e87e43c7c',
                          failures: [
                              {
                                  entity: null,
                                  causes: [
                                      {
                                          instance: { entity: flight },
                                          properties: [],
                                      },
                                      {
                                          instance: null,
                                          properties: [],
                                      },
                                  ],
                              },
                          ],
                      },
                  ]
                : []),
        },
    ];
};

const generateRuleBreachExample1 = (): IRuleBreachPopulated => ({
    _id: generateMongoId(),
    originUser: generateUser(),
    brokenRules: generateBrokenRules({ nullables: false, actionType: ActionTypes.CreateRelationship }),
    actionType: ActionTypes.CreateRelationship,
    actionMetadata: {
        relationshipTemplateId: fliesOn._id,
        sourceEntity: tourist1,
        destinationEntity: flight,
    } as ICreateRelationshipMetadataPopulated,
    createdAt: new Date(),
});

const generateRuleBreachExample2 = (): IRuleBreachPopulated => ({
    _id: generateMongoId(),
    originUser: generateUser(),
    brokenRules: generateBrokenRules({ nullables: false, actionType: ActionTypes.DeleteRelationship }),
    actionType: ActionTypes.DeleteRelationship,
    actionMetadata: {
        relationshipId: '012345678901234567890001',
        relationshipTemplateId: fliesOn._id,
        sourceEntity: tourist1,
        destinationEntity: flight,
    } as IDeleteRelationshipMetadataPopulated,
    createdAt: new Date(),
});

const generateRuleBreachExample3 = (): IRuleBreachPopulated => ({
    _id: generateMongoId(),
    originUser: generateUser(),
    brokenRules: generateBrokenRules({ nullables: false, actionType: ActionTypes.UpdateEntity }),
    actionType: ActionTypes.UpdateEntity,
    actionMetadata: {
        entity: tourist1,
        updatedFields: { lastName: 'קירלללללל' },
    } as IUpdateEntityMetadataPopulated,
    createdAt: new Date(),
});

const generateRuleBreachExampleNullables1 = (): IRuleBreachPopulated => ({
    _id: generateMongoId(),
    originUser: generateUser(),
    brokenRules: generateBrokenRules({ nullables: true, actionType: ActionTypes.DeleteRelationship }),
    actionType: ActionTypes.DeleteRelationship,
    actionMetadata: {
        relationshipId: '012345678901234567890001',
        relationshipTemplateId: fliesOn._id,
        sourceEntity: null,
        destinationEntity: null,
    } as IDeleteRelationshipMetadataPopulated,
    createdAt: new Date(),
});

const generateRuleBreachExampleNullables2 = (): IRuleBreachPopulated => ({
    _id: generateMongoId(),
    originUser: generateUser(),
    brokenRules: generateBrokenRules({ nullables: true, actionType: ActionTypes.UpdateEntity }),
    actionType: ActionTypes.UpdateEntity,
    actionMetadata: {
        entity: null,
        updatedFields: { lastName: 'קירלללללל' },
    } as IUpdateEntityMetadataPopulated,
    createdAt: new Date(),
});

export const generateRuleBreach = (options?: { nullable?: boolean; actionType?: ActionTypes }): IRuleBreachPopulated => {
    const { nullable = true, actionType } = options ?? {};
    let ruleBreaches = [generateRuleBreachExample1(), generateRuleBreachExample2(), generateRuleBreachExample3()];

    if (nullable) {
        ruleBreaches.push(generateRuleBreachExampleNullables1(), generateRuleBreachExampleNullables2());
    }

    if (actionType) {
        ruleBreaches = ruleBreaches.filter((ruleBreach) => ruleBreach.actionType === actionType);
    }

    const ruleBreach = chance.pickone(ruleBreaches);

    return ruleBreach;
};

export const generateRuleBreachAlert = (options?: { nullable?: boolean; actionType?: ActionTypes | undefined }): IRuleBreachAlertPopulated =>
    generateRuleBreach(options);

export const generateRuleBreachRequest = (options?: {
    isReviewed?: true;
    nullable?: boolean;
    actionType?: ActionTypes;
}): IRuleBreachRequestPopulated => {
    const { isReviewed, nullable, actionType } = options ?? {};

    const ruleBreach = generateRuleBreach({ nullable, actionType });

    const status = isReviewed
        ? chance.pickone([
              RuleBreachRequestStatus.Denied,
              RuleBreachRequestStatus.Approved,
              RuleBreachRequestStatus.Pending,
              RuleBreachRequestStatus.Canceled,
          ])
        : chance.pickone([RuleBreachRequestStatus.Pending, RuleBreachRequestStatus.Canceled]);

    return {
        ...ruleBreach,
        reviewer: status !== undefined ? generateUser() : undefined,
        reviewedAt: status !== undefined ? new Date() : undefined,
        status,
    };
};

export const generateRuleBreachAlertOrRequest = () => {
    const isRequest = chance.bool();
    return isRequest ? generateRuleBreachRequest() : generateRuleBreachAlert();
};

export const mockRuleBreaches = (mock: MockAdapter) => {
    mock.onPost('/api/rule-breaches/requests').reply(() => [200, generateRuleBreachRequest({ nullable: false })]);

    mock.onPost('/api/rule-breaches/alerts/search').reply(() => {
        const numberOfBreaches = chance.integer({ min: 0, max: 20 });
        const breaches = Array.from({ length: numberOfBreaches }).map(() => generateRuleBreachAlert());
        return [200, { rows: breaches, lastRowIndex: numberOfBreaches }];
    });

    mock.onPost('/api/rule-breaches/requests/search').reply(() => {
        const numberOfBreaches = chance.integer({ min: 0, max: 20 });
        const breaches = Array.from({ length: numberOfBreaches }).map(() => generateRuleBreachRequest());

        return [200, { rows: breaches, lastRowIndex: numberOfBreaches }];
    });

    mock.onPost(/\/api\/rule-breaches\/requests\/.*\/approve/).reply(() => [200, generateRuleBreachRequest({ isReviewed: true })]);

    mock.onPost(/\/api\/rule-breaches\/requests\/.*\/deny/).reply(() => [200, generateRuleBreachRequest({ isReviewed: true })]);

    mock.onPost(/\/api\/rule-breaches\/requests\/.*\/cancel/).reply(() => [200, generateRuleBreachRequest({})]);
};
