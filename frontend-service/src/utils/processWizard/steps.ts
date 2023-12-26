import { IMongoProcessInstancePopulated, StepsObjectPopulated } from '../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { IMongoStepInstancePopulated } from '../../interfaces/processes/stepInstance';
import { IMongoStepTemplatePopulated } from '../../interfaces/processes/stepTemplate';

export const setInitialStepsObject = (steps: IMongoStepTemplatePopulated[]): Record<string, []> => {
    return steps.reduce((acc, obj) => {
        acc[obj._id] = [];
        return acc;
    }, {});
};

export const getStepInstanceByStepTemplateId = (stepTemplateId: string, processInstance: IMongoProcessInstancePopulated) => {
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
    processTemplate: IMongoProcessTemplatePopulated,
): IMongoStepTemplatePopulated => {
    return processTemplate.steps.find((step) => stepInstance.templateId === step._id)!;
};
