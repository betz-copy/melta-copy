import { v4 as uuid } from 'uuid';
import axios from '../../axios';
import { environment } from '../../globals';
import fileDetails from '../../interfaces/fileDetails';
import { ProcessTemplateFormInputProperties, ProcessTemplateWizardValues } from '../../common/wizards/processTemplate';
import {
    IMongoProcessTemplatePopulated,
    ICreateProcessTemplateBody,
    IUpdateProcessTemplateBody,
    IProcessDetails,
    IProcessSingleProperty,
} from '../../interfaces/processes/processTemplate';

const { processTemplates } = environment.api;
export const basePropertyTypes = ['string', 'number', 'boolean', 'array'];
export const stringFormats = ['date', 'date-time', 'email', 'entityReference', 'fileId'];

const processTemplateObjectToProcessTemplateForm = (
    processTemplate: IMongoProcessTemplatePopulated | null,
): ProcessTemplateWizardValues | undefined => {
    if (!processTemplate) return undefined;
    const { details, steps, ...restOfProcessTemplate } = processTemplate;
    const detailsPropertiesArray: ProcessTemplateFormInputProperties[] = [];
    const detailsAttachmentProperties: ProcessTemplateFormInputProperties[] = [];
    const stepsForm: ProcessTemplateWizardValues['steps'] = [];

    details.propertiesOrder.forEach((key) => {
        const value = details.properties.properties[key];

        let type: string = value.format || value.type;
        if (value.enum) {
            type = 'enum';
        }
        if (value.pattern) {
            type = 'pattern';
        }

        const property: ProcessTemplateFormInputProperties = {
            id: uuid(),
            name: key,
            title: value.title,
            type,
            options: value.enum || [],
            pattern: value.pattern || '',
            required: details.properties.required ? details.properties.required.includes(key) : false,
            patternCustomErrorMessage: value.patternCustomErrorMessage || '',
        };

        if (value.format === 'fileId') {
            detailsAttachmentProperties.push(property);
        } else {
            detailsPropertiesArray.push(property);
        }
    });
    steps.forEach((step) => {
        const stepsPropertiesArray: ProcessTemplateFormInputProperties[] = [];
        const stepsAttachmentProperties: ProcessTemplateFormInputProperties[] = [];
        step.propertiesOrder.forEach((key) => {
            const value = step.properties.properties[key];

            let type: string = value.format || value.type;
            if (value.enum) {
                type = 'enum';
            }
            if (value.pattern) {
                type = 'pattern';
            }

            const property: ProcessTemplateFormInputProperties = {
                id: uuid(),
                name: key,
                title: value.title,
                type,
                options: value.enum || [],
                pattern: value.pattern || '',
                required: step.properties.required ? step.properties.required.includes(key) : false,
                patternCustomErrorMessage: value.patternCustomErrorMessage || '',
            };

            if (value.format === 'fileId') {
                stepsAttachmentProperties.push(property);
            } else {
                stepsPropertiesArray.push(property);
            }
        });

        stepsForm.push({
            _id: step._id,
            draggableId: step._id,
            properties: stepsPropertiesArray,
            attachmentProperties: stepsAttachmentProperties,
            name: step.name,
            displayName: step.displayName,
            icon: {
                file: { name: step.iconFileId !== null ? step.iconFileId : '' },
                name: step.iconFileId !== null ? step.iconFileId : '',
            } as fileDetails,
            reviewers: step.reviewers,
        });
    });

    return {
        ...restOfProcessTemplate,
        detailsProperties: detailsPropertiesArray,
        detailsAttachmentProperties,
        steps: stepsForm,
    };
};

const createFileAttachmentProperty = (type: string, required: boolean): any => {
    if (type === 'multipleFiles') {
        return {
            type: 'array',
            items: {
                type: 'string',
                format: 'fileId',
            },
            ...(required && { required: true }),
        };
    } else {
        return {
            type: 'string',
            format: 'fileId',
            ...(required && { required: true }),
        };
    }
};

const addAttachmentProperties = (
    properties: Record<string, IProcessSingleProperty>,
    propertiesOrder: string[],
    attachmentProperties: ProcessTemplateFormInputProperties[],
) => {
    attachmentProperties.forEach(({ name, title, type, required }) => {
        const attachmentProperty = createFileAttachmentProperty(type, required);
        properties[name] = {
            title,
            ...attachmentProperty,
        };
        propertiesOrder.push(name);
    });
};

const formToJSONSchema = (values: ProcessTemplateWizardValues): ICreateProcessTemplateBody | IUpdateProcessTemplateBody => {
    const { detailsProperties, detailsAttachmentProperties, steps, ...restOfProperties } = values;
    const detailsPropertiesOrder: string[] = [];
    const stepTemplates: ICreateProcessTemplateBody['steps'] | IUpdateProcessTemplateBody['steps'] = [];

    const detailsSchema: IProcessDetails['properties'] = {
        type: 'object',
        properties: {},
        required: [],
    };

    detailsProperties.forEach(({ name, title, type, required, options, pattern, patternCustomErrorMessage }) => {
        detailsSchema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? (type as IProcessSingleProperty['type']) : 'string',
            format: stringFormats.includes(type) ? (type as IProcessSingleProperty['format']) : undefined,
            enum: type === 'enum' ? options : undefined,
            pattern: type === 'pattern' ? pattern : undefined,
            patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
        };

        detailsPropertiesOrder.push(name);

        if (required) detailsSchema.required.push(name);
    });

    addAttachmentProperties(detailsSchema.properties, detailsPropertiesOrder, detailsAttachmentProperties);

    steps.forEach((step) => {
        const stepPropertiesOrder: string[] = [];
        const stepSchema: IProcessDetails['properties'] = {
            type: 'object',
            properties: {},
            required: [],
        };
        step.properties.forEach(({ name, title, type, required, options, pattern, patternCustomErrorMessage }) => {
            stepSchema.properties[name] = {
                title,
                type: basePropertyTypes.includes(type) ? (type as IProcessSingleProperty['type']) : 'string',
                format: stringFormats.includes(type) ? (type as IProcessSingleProperty['format']) : undefined,
                enum: type === 'enum' ? options : undefined,
                pattern: type === 'pattern' ? pattern : undefined,
                patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
            };

            stepPropertiesOrder.push(name);

            if (required) stepSchema.required.push(name);
        });

        addAttachmentProperties(stepSchema.properties, stepPropertiesOrder, step.attachmentProperties);

        const reviewersIds: string[] = step.reviewers.map((reviewer) => reviewer.id);
        stepTemplates.push({
            _id: step._id!,
            properties: stepSchema,
            displayName: step.displayName,
            iconFileId: step.icon!.file instanceof File ? null : step.icon!.file.name!,
            name: step.name,
            propertiesOrder: stepPropertiesOrder,
            reviewers: reviewersIds,
        });
    });

    return {
        ...restOfProperties,
        details: { properties: detailsSchema, propertiesOrder: detailsPropertiesOrder },
        steps: stepTemplates,
    };
};
const createProcessTemplateRequest = async (newProcessTemplate: ProcessTemplateWizardValues) => {
    const formData = new FormData();
    newProcessTemplate.steps.map((step, index) => formData.append(String(index), step.icon!.file as File));
    const processTemplate = formToJSONSchema(newProcessTemplate);

    formData.append('displayName', processTemplate.displayName);
    formData.append('name', processTemplate.name);
    formData.append('details', JSON.stringify(processTemplate.details));
    formData.append('steps', JSON.stringify(processTemplate.steps));

    const { data } = await axios.post<IMongoProcessTemplatePopulated>(processTemplates, formData);
    return data;
};

const updateProcessTemplateRequest = async (processTemplateId: string, updatedProcessTemplate: ProcessTemplateWizardValues) => {
    const formData = new FormData();
    updatedProcessTemplate.steps.forEach((step, index) => {
        if (step.icon!.file instanceof File) {
            formData.append(String(index), step.icon!.file as File);
        }
    });
    const processTemplate = formToJSONSchema(updatedProcessTemplate);
    formData.append('name', processTemplate.name);
    formData.append('displayName', processTemplate.displayName);
    formData.append('details', JSON.stringify(processTemplate.details));
    formData.append('steps', JSON.stringify(processTemplate.steps));
    const { data } = await axios.put<IMongoProcessTemplatePopulated>(`${processTemplates}/${processTemplateId}`, formData);

    return data;
};

const deleteProcessTemplateRequest = async (processTemplateId: string) => {
    const { data } = await axios.delete(`${processTemplates}/${processTemplateId}`);
    return data;
};

export { createProcessTemplateRequest, updateProcessTemplateRequest, deleteProcessTemplateRequest, processTemplateObjectToProcessTemplateForm };
