import { IProcessTemplateMap } from '@microservices/shared-interfaces';

export const getStepName = (stepTemplateId: string, processTemplatesMap: IProcessTemplateMap) => {
    for (const processTemplate of processTemplatesMap.values()) {
        const stepTemplate = processTemplate.steps.find((currStepTemplate) => currStepTemplate._id === stepTemplateId);

        if (stepTemplate) {
            return stepTemplate.displayName;
        }
    }
    return undefined;
};
