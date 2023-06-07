/* eslint-disable import/no-extraneous-dependencies */
import MockAdapter from 'axios-mock-adapter';
import { Chance } from 'chance';
import { JSONSchemaFaker } from 'json-schema-faker';
import { IMongoProcessInstancePopulated, Status } from '../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../interfaces/processes/processTemplate';
import { IMongoStepInstancePopulated } from '../interfaces/processes/stepInstance';
import { generateMongoId, generateUser } from './permissions';
import { processTemplates } from './templates/processTemplates';

const chance = new Chance();

JSONSchemaFaker.format('fileId', (_value) => '01234567890123456789012345678901bla bla.docx');

function generateProcessInstanceOfTemplate(template: IMongoProcessTemplatePopulated): IMongoProcessInstancePopulated {
    const steps: IMongoStepInstancePopulated[] = template.steps.map((step) => {
        const status = chance.pickone(Object.values(Status));
        return {
            properties: JSONSchemaFaker.generate(step.properties) as Record<string, any>,
            status,
            reviewers: Array.from({ length: chance.integer({ min: 0, max: 10 }) }, () => generateUser()),
            reviewer: status === Status.Pending ? undefined : generateUser(),
            reviewedAt: status === Status.Pending ? undefined : new Date(),
            _id: generateMongoId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            templateId: step._id,
        };
    });

    return {
        _id: generateMongoId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        templateId: template._id,
        name: template.name,
        details: JSONSchemaFaker.generate(template.details.properties) as Record<string, any>,
        startDate: new Date(),
        endDate: new Date(),
        steps,
        status: Status.Pending,
        reviewer: undefined,
        reviewedAt: undefined,
        summaryDetails: JSONSchemaFaker.generate(template.summaryDetails.properties) as Record<string, any>,
    };
}

const generateProcessInstance = () => {
    const template = chance.pickone(processTemplates as IMongoProcessTemplatePopulated[]);
    return generateProcessInstanceOfTemplate(template);
};

const mockProcessInstances = (mock: MockAdapter) => {
    mock.onGet(/\/api\/processes\/instances\/[0-9a-fA-F]{24}/).reply(() => [200, generateProcessInstance()]);

    mock.onPost('/api/processes/instances').reply(({ data: processToCreate }) => {
        return [200, { ...JSON.parse(processToCreate), _id: generateMongoId() }];
    });

    mock.onDelete(/\/api\/processes\/instances\/[0-9a-fA-F]{24}/).reply(() => [200, {}]); // UI does not use returned deleted process

    mock.onPut(/\/api\/processes\/instances\/[0-9a-fA-F]{24}/).reply(({ data: processDataToUpdate, url }) => {
        return [200, { ...JSON.parse(processDataToUpdate), _id: url!.split('/').at(-1) }];
    });

    mock.onPost('/api/processes/instances/search').reply(() => {
        const processes = Array.from({ length: 20 }).map(generateProcessInstance);
        return [200, processes];
    });
};

export { mockProcessInstances, generateProcessInstanceOfTemplate };
