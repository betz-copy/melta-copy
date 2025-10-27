/* eslint-disable import/prefer-default-export */
/* eslint-disable no-plusplus */

import { IMongoProcessTemplatePopulated } from '@microservices/shared';
import { Axios } from 'axios';
import { JSONSchemaFaker } from 'json-schema-faker';
import pLimit from 'p-limit';
import config from './config';
import createAxiosInstance from './utils/axios';

const limit = pLimit(config.requestLimit);

const { url, processInstanceRoute, minNumberOfProcesses, maxNumberOfProcesses, nameMinLength, nameMaxLength, characters } = config.processService;

const generateName = (): string => {
    const length = Math.floor(Math.random() * (nameMaxLength - nameMinLength + 1)) + nameMinLength;

    const generateString = (currentLength: number): string => {
        if (currentLength === 0) {
            return '';
        }

        const randomIndex = Math.floor(Math.random() * characters.length);
        const randomChar = characters.charAt(randomIndex);

        return randomChar + generateString(currentLength - 1);
    };

    return generateString(length);
};

const generateUniqueName = (generatedNames: Set<string>): string => {
    let name: string;

    do {
        name = generateName();
    } while (generatedNames.has(name));

    generatedNames.add(name);
    return name;
};

const createProcessInstance = (
    axiosInstance: Axios,
    processTemplate: IMongoProcessTemplatePopulated,
    generatedNames: Set<string>,
    userIds: string[],
    chance: Chance.Chance,
) => {
    const randomStartDate = new Date(chance.date()).toLocaleDateString();
    const randomEndDate = new Date(randomStartDate);
    randomEndDate.setDate(randomEndDate.getDate() + 7);

    const requestBody = {
        name: generateUniqueName(generatedNames),
        templateId: processTemplate._id,
        details: JSONSchemaFaker.generate(processTemplate.details.properties) as Record<string, any>,
        startDate: randomStartDate,
        endDate: randomEndDate,
        steps: processTemplate.steps.reduce((acc, step) => {
            const allowedReviewers = userIds.filter((userId) => !step.reviewers.includes(userId));
            if (!allowedReviewers.length) {
                throw new Error(`There are not enough userIds to add unique reviewers to step '${step.name}' of template '${processTemplate.name}'`);
            }

            acc[step._id] = [chance.pickone(allowedReviewers)];
            return acc;
        }, {}),
    };

    return limit(() =>
        axiosInstance
            .post(url + processInstanceRoute, requestBody)
            .then((response) => response.data)
            .catch((error) => {
                console.error(`Error creating instance for template ${processTemplate._id}: `, error);
                throw error;
            }),
    );
};

export const createProcessInstances = async (
    workspaceId: string,
    processTemplates: IMongoProcessTemplatePopulated[],
    userIds: string[],
    chance: Chance.Chance,
    fileId: string,
) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const generatedNames = new Set<string>();
    const instanceNumbers = processTemplates.map(() => chance.integer({ min: minNumberOfProcesses, max: maxNumberOfProcesses }));
    const maxInstances = Math.max(...instanceNumbers);
    JSONSchemaFaker.format('fileId', (_value) => fileId);
    const promises = Array(maxInstances)
        .fill(null)
        .flatMap((_, instanceIndex) =>
            processTemplates
                .filter((__, templateIndex) => instanceIndex < instanceNumbers[templateIndex])
                .map((processTemplate) => createProcessInstance(axiosInstance, processTemplate, generatedNames, userIds, chance)),
        );

    return Promise.all(promises);
};

// TODO update steps instance properties and status
