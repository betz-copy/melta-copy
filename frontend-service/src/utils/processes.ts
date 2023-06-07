import { IProcessTemplateMap } from '../interfaces/processes/processTemplate';

export const getStepName = (stepTemplateId: string, processTemplatesMap: IProcessTemplateMap) => {
    for (const processTemplate of processTemplatesMap.values()) {
        const stepTemplate = processTemplate.steps.find((currStepTemplate) => currStepTemplate._id === stepTemplateId);

        if (stepTemplate) {
            return stepTemplate.displayName;
        }
    }
    return; // ts warning: not all code paths return a value
};
