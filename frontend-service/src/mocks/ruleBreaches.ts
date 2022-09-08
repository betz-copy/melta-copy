/* eslint-disable import/no-extraneous-dependencies */
import { Chance } from 'chance';
import {
    ActionTypes,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadataPopulated,
    IUpdateEntityMetadataPopulated,
} from '../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreachPopulated } from '../interfaces/ruleBreaches/ruleBreach';
import { IRuleBreachAlertPopulated } from '../interfaces/ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated } from '../interfaces/ruleBreaches/ruleBreachRequest';
import { generateMongoId, generateUser } from './permissions';

const chance = new Chance();

const fliesOn = {
    _id: '61e3ea6e4d51a83e87e43c7c',
    name: 'fliesOn',
    displayName: 'טס על',
    sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
    destinationEntityId: '61e3ea6e4d51a83e87e83c81',
};

const tourist1 = {
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

const tourist2 = {
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

const tourist3 = {
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

const flight = {
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

const brokenRules: IRuleBreachPopulated['brokenRules'] = [
    {
        ruleId: '61e3ea6e4d53a23e87e43c7c',
        relationships: [
            {
                templateId: fliesOn._id,
                properties: {
                    _id: 'created-relationship-id',
                },
                sourceEntity: tourist1,
                destinationEntity: flight,
            },
            {
                templateId: fliesOn._id,
                properties: {
                    _id: '012345678901234567890002',
                },
                sourceEntity: tourist2,
                destinationEntity: flight,
            },
            {
                templateId: fliesOn._id,
                properties: {
                    _id: '012345678901234567890003',
                },
                sourceEntity: tourist3,
                destinationEntity: flight,
            },
            null,
            null,
        ],
    },
    {
        ruleId: '61e3ea6e4d83a23e87e43c7c',
        relationships: [null],
    },
];

const ruleBreach1: IRuleBreachPopulated = {
    _id: generateMongoId(),
    originUser: generateUser(),
    brokenRules,
    actionType: ActionTypes.CreateRelationship,
    actionMetadata: {
        relationshipTemplateId: fliesOn._id,
        sourceEntity: tourist1,
        destinationEntity: flight,
    } as ICreateRelationshipMetadataPopulated,
    createdAt: new Date(),
};

const ruleBreach2: IRuleBreachPopulated = {
    _id: generateMongoId(),
    originUser: generateUser(),
    brokenRules,
    actionType: ActionTypes.DeleteRelationship,
    actionMetadata: {
        relationshipId: '012345678901234567890001',
        relationshipTemplateId: fliesOn._id,
        sourceEntity: tourist1,
        destinationEntity: flight,
    } as IDeleteRelationshipMetadataPopulated,
    createdAt: new Date(),
};

const ruleBreach3: IRuleBreachPopulated = {
    _id: generateMongoId(),
    originUser: generateUser(),
    brokenRules,
    actionType: ActionTypes.UpdateEntity,
    actionMetadata: {
        entity: tourist1,
        updatedFields: { lastName: 'קירלללללל' },
    } as IUpdateEntityMetadataPopulated,
    createdAt: new Date(),
};

const ruleBreach4: IRuleBreachPopulated = {
    _id: generateMongoId(),
    originUser: generateUser(),
    brokenRules,
    actionType: ActionTypes.DeleteRelationship,
    actionMetadata: {
        relationshipId: '012345678901234567890001',
        relationshipTemplateId: fliesOn._id,
        sourceEntity: null,
        destinationEntity: null,
    } as IDeleteRelationshipMetadataPopulated,
    createdAt: new Date(),
};

const ruleBreach5: IRuleBreachPopulated = {
    _id: generateMongoId(),
    originUser: generateUser(),
    brokenRules,
    actionType: ActionTypes.UpdateEntity,
    actionMetadata: {
        entity: null,
        updatedFields: { lastName: 'קירלללללל' },
    } as IUpdateEntityMetadataPopulated,
    createdAt: new Date(),
};

export const generateRuleBreachAlert = (): IRuleBreachAlertPopulated => {
    const ruleBreach = chance.pickone([ruleBreach1, ruleBreach2, ruleBreach3]);

    return ruleBreach;
};

export const generateRuleBreachRequest = (isReviewed?: true): IRuleBreachRequestPopulated => {
    const ruleBreach = chance.pickone([ruleBreach1, ruleBreach2, ruleBreach3, ruleBreach4, ruleBreach5]);

    const approved = isReviewed === true ? chance.bool() : chance.pickone([true, false, undefined]);

    return {
        ...ruleBreach,
        reviewer: approved !== undefined ? generateUser() : undefined,
        reviewedAt: approved !== undefined ? new Date() : undefined,
        approved,
    };
};

export const generateRuleBreachAlertOrRequest = () => {
    const isRequest = chance.bool();
    return isRequest ? generateRuleBreachRequest() : generateRuleBreachAlert();
};
