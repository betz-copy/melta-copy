/* eslint-disable no-param-reassign */
import {
    IMongoProcessInstanceReviewerPopulated,
    IMongoProcessTemplateReviewerPopulated,
    IMongoStepInstancePopulated,
    IMongoStepTemplatePopulated,
    StepsObjectPopulated,
} from '@microservices/shared';

export const setInitialStepsObject = (steps: IMongoStepTemplatePopulated[]): Record<string, []> => {
    return steps.reduce((acc, obj) => {
        acc[obj._id] = [];
        return acc;
    }, {});
};

export const getStepInstanceByStepTemplateId = (stepTemplateId: string, processInstance: IMongoProcessInstanceReviewerPopulated) => {
    const stepInstance = processInstance.steps.find((step) => step.templateId === stepTemplateId);
    return stepInstance;
};

export const getStepsObjectPopulated = (steps: IMongoStepInstancePopulated[]): StepsObjectPopulated => {
    return steps.reduce((acc, obj) => {
        acc[obj._id] = obj.reviewers;
        return acc;
    }, {});
};

export const getStepTemplateByStepInstance = (
    stepInstance: IMongoStepInstancePopulated,
    processTemplate: IMongoProcessTemplateReviewerPopulated,
): IMongoStepTemplatePopulated => {
    return processTemplate.steps.find((step) => stepInstance.templateId === step._id)!;
};
