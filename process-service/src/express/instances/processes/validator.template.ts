import { Request } from 'express';
import ProcessTemplateManager from '../../templates/processes/manager';
import { InstancePropertiesValidationError, ValidationError } from '../../error';
import { IProcessDetails } from '../../templates/processes/interface';
import { CreateAndUpdateProcessReqBody, InstanceDetails } from './interface';
import ProcessInstanceManager from './manager';
import ajv from '../../../utils/ajv';

export const validateStepIds = (validStepIds: string[], stepIdsToCheck: string[]) => {
    if (validStepIds.length !== stepIdsToCheck.length) throw new ValidationError('number of steps not matched the template');
    const unmatchedStepTemplateIds = stepIdsToCheck.filter((item) => !validStepIds.includes(item));
    if (unmatchedStepTemplateIds.length) throw new ValidationError('unmatched step ids');
};
const validateInstanceProperties = (
    instanceProperties: InstanceDetails,
    templateProperties: IProcessDetails['properties'],
    checkFor: 'Details' | 'Summary',
) => {
    const validate = ajv.compile(templateProperties);
    const isValid = validate(instanceProperties.properties);

    if (!isValid) {
        throw new InstancePropertiesValidationError(checkFor, JSON.stringify(validate.errors));
    }
};
const fetchTemplateByRequestContext = async (req: Request) => {
    if (req.method === 'PUT') return ProcessInstanceManager.getProcessTemplateByProcessId(req.params.id);
    return ProcessTemplateManager.getProcessTemplateById(req.body.templateId, false);
};

export const validateProcessInstance = async (req: Request) => {
    const processTemplate = await fetchTemplateByRequestContext(req);
    const { details: instanceDetails, summaryDetails }: CreateAndUpdateProcessReqBody = req.body;

    if (req.method === 'POST') {
        const { steps }: CreateAndUpdateProcessReqBody = req.body;
        validateStepIds(Object.keys(steps), processTemplate.steps);
    }

    if (req.method === 'PUT' && summaryDetails) {
        validateInstanceProperties(summaryDetails, processTemplate.summaryDetails.properties, 'Summary');
    }

    if (instanceDetails) {
        validateInstanceProperties(instanceDetails, processTemplate.details.properties, 'Details');
    }
};
