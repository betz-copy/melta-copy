import { FileDetails } from '@packages/common';
import { PropertyType } from '@packages/entity-template';
import {
    ICreateProcessTemplateBody,
    IMongoProcessTemplateReviewerPopulated,
    IProcessDetails,
    IProcessSingleProperty,
    ISearchProcessTemplatesBody,
    IUpdateProcessTemplateBody,
    ProcessPropertyFormats,
} from '@packages/process';
import { v4 as uuid } from 'uuid';
import axios from '../../axios';
import { ProcessTemplateFormInputProperties, ProcessTemplatePropertyByType, ProcessTemplateWizardValues } from '../../common/wizards/processTemplate';
import { environment } from '../../globals';
import { extractProperties } from './entityTemplatesService';

const { processTemplates } = environment.api;

export type ExtractedProcessProps = {
    properties: ProcessTemplateFormInputProperties[];
    propertiesPath: Record<string, string>;
};

const processTemplateObjectToProcessTemplateForm = (
    processTemplate: IMongoProcessTemplateReviewerPopulated | null,
): ProcessTemplateWizardValues | undefined => {
    if (!processTemplate) return undefined;
    const { details, steps, ...restOfProcessTemplate } = processTemplate;
    const detailsPropertiesArray: ProcessTemplatePropertyByType[] = [];
    const detailsAttachmentProperties: ProcessTemplatePropertyByType[] = [];
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
            detailsAttachmentProperties.push({ type: 'field', data: property });
        } else if (value.items?.format === 'fileId') {
            property.type = 'multipleFiles';

            detailsAttachmentProperties.push({ type: 'field', data: property });
        } else {
            detailsPropertiesArray.push({ type: 'field', data: property });
        }
    });
    steps.forEach((step) => {
        const stepsPropertiesArray: ProcessTemplatePropertyByType[] = [];
        const stepsAttachmentProperties: ProcessTemplatePropertyByType[] = [];
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
                stepsAttachmentProperties.push({ type: 'field', data: property });
            } else if (value.items?.format === 'fileId') {
                property.type = 'multipleFiles';

                stepsAttachmentProperties.push({ type: 'field', data: property });
            } else {
                stepsPropertiesArray.push({ type: 'field', data: property });
            }
        });

        const stepForm: ProcessTemplateWizardValues['steps'][number] = {
            draggableId: step._id || uuid(),
            properties: stepsPropertiesArray,
            attachmentProperties: stepsAttachmentProperties,
            name: step.name,
            displayName: step.displayName,
            icon: {
                file: { name: step.iconFileId },
                name: step.iconFileId,
            } as FileDetails,
            reviewers: step.reviewers,
            disableAddingReviewers: step.disableAddingReviewers,
        };

        if (step._id && step._id !== '') {
            stepForm._id = step._id;
        }

        stepsForm.push(stepForm);
    });

    return {
        ...restOfProcessTemplate,
        detailsProperties: detailsPropertiesArray,
        detailsAttachmentProperties,
        steps: stepsForm,
    };
};

const createFileAttachmentProperty = (type: string, required: boolean): Omit<IProcessSingleProperty, 'title'> & { required?: boolean } => {
    if (type === 'multipleFiles') {
        return {
            type: PropertyType.array,
            items: {
                type: PropertyType.string,
                format: 'fileId',
            },
            ...(required && { required: true }),
        };
    }
    return {
        type: PropertyType.string,
        format: 'fileId',
        ...(required && { required: true }),
    };
};

const addAttachmentProperties = (
    properties: Record<string, IProcessSingleProperty>,
    propertiesOrder: string[],
    attachmentProperties: ProcessTemplateFormInputProperties[],
    detailsSchema: {
        type: 'object';
        properties: Record<string, IProcessSingleProperty>;
        required: string[];
    },
) => {
    attachmentProperties.forEach(({ name, title, type, required, deleted }) => {
        if (!deleted) {
            const { required: _requiredFile, ...attachmentProperty } = createFileAttachmentProperty(type, required);
            properties[name] = {
                title,
                ...attachmentProperty,
            };
            propertiesOrder.push(name);
        }
        if (required) detailsSchema.required.push(name);
    });
};

const formToJSONSchema = (values: ProcessTemplateWizardValues): ICreateProcessTemplateBody | IUpdateProcessTemplateBody => {
    const { detailsProperties, detailsAttachmentProperties, steps, ...restOfProperties } = values;

    const { properties: extractDetailsProperties } = extractProperties<ProcessTemplateFormInputProperties>(detailsProperties);
    const { properties: extractDetailsAttachmentProperties } = extractProperties<ProcessTemplateFormInputProperties>(detailsAttachmentProperties);

    const detailsPropertiesOrder: string[] = [];
    const stepTemplates: ICreateProcessTemplateBody['steps'] | IUpdateProcessTemplateBody['steps'] = [];

    const detailsSchema: IProcessDetails['properties'] = {
        type: 'object',
        properties: {},
        required: [],
    };

    extractDetailsProperties.forEach(({ name, title, type, required, options, pattern, patternCustomErrorMessage, deleted }) => {
        if (!deleted) {
            detailsSchema.properties[name] = {
                title,
                type: Object.values(PropertyType).includes(type) ? (type as IProcessSingleProperty['type']) : PropertyType.string,
                format: Object.values(ProcessPropertyFormats).includes(type) ? (type as IProcessSingleProperty['format']) : undefined,
                enum: type === 'enum' ? options : undefined,
                pattern: type === 'pattern' ? pattern : undefined,
                patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
            };

            detailsPropertiesOrder.push(name);

            if (required) detailsSchema.required.push(name);
        }
    });

    addAttachmentProperties(detailsSchema.properties, detailsPropertiesOrder, extractDetailsAttachmentProperties, detailsSchema);

    steps.forEach((step) => {
        const stepPropertiesOrder: string[] = [];
        const stepSchema: IProcessDetails['properties'] = {
            type: 'object',
            properties: {},
            required: [],
        };
        const { properties: extractStepProperties } = extractProperties<ProcessTemplateFormInputProperties>(step.properties);
        const { properties: extractStepAttachmentProperties } = extractProperties<ProcessTemplateFormInputProperties>(step.attachmentProperties);

        extractStepProperties.forEach(({ name, title, type, required, options, pattern, patternCustomErrorMessage, deleted }) => {
            if (!deleted) {
                stepSchema.properties[name] = {
                    title,
                    type: Object.values(PropertyType).includes(type) ? (type as IProcessSingleProperty['type']) : PropertyType.string,
                    format: Object.values(ProcessPropertyFormats).includes(type) ? (type as IProcessSingleProperty['format']) : undefined,
                    enum: type === 'enum' ? options : undefined,
                    pattern: type === 'pattern' ? pattern : undefined,
                    patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
                };

                stepPropertiesOrder.push(name);

                if (required) stepSchema.required.push(name);
            }
        });

        addAttachmentProperties(stepSchema.properties, stepPropertiesOrder, extractStepAttachmentProperties, stepSchema);

        const reviewersIds: string[] = step.reviewers.map((reviewer) => reviewer._id);
        stepTemplates.push({
            _id: step._id!,
            properties: stepSchema,
            displayName: step.displayName,
            disableAddingReviewers: step.disableAddingReviewers,
            iconFileId: !step.icon || step.icon!.file instanceof File || step.icon.name === '' ? null : step.icon!.file.name!,
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
    newProcessTemplate.steps.forEach((step, index) => {
        if (step.icon && step.icon!.file && step.icon!.file.name && step.icon!.file.name !== '') {
            formData.append(String(index), step.icon!.file as File);
        }
    });
    const processTemplate = formToJSONSchema(newProcessTemplate);

    formData.append('displayName', processTemplate.displayName);
    formData.append('name', processTemplate.name);
    formData.append('details', JSON.stringify(processTemplate.details));
    formData.append('steps', JSON.stringify(processTemplate.steps));

    const { data } = await axios.post<IMongoProcessTemplateReviewerPopulated>(processTemplates, formData);
    return data;
};

const updateProcessTemplateRequest = async (processTemplateId: string, updatedProcessTemplate: ProcessTemplateWizardValues) => {
    const formData = new FormData();
    updatedProcessTemplate.steps.forEach((step, index) => {
        if (step.icon && step.icon!.file && step.icon!.file.name && step.icon!.file.name !== '' && step.icon!.file instanceof File) {
            formData.append(String(index), step.icon!.file as File);
        }
    });
    const processTemplate = formToJSONSchema(updatedProcessTemplate);
    formData.append('name', processTemplate.name);
    formData.append('displayName', processTemplate.displayName);
    formData.append('details', JSON.stringify(processTemplate.details));
    formData.append('steps', JSON.stringify(processTemplate.steps));
    const { data } = await axios.put<IMongoProcessTemplateReviewerPopulated>(`${processTemplates}/${processTemplateId}`, formData);

    return data;
};

const deleteProcessTemplateRequest = async (processTemplateId: string) => {
    const { data } = await axios.delete(`${processTemplates}/${processTemplateId}`);
    return data;
};

const searchProcessTemplates = async (searchBody: ISearchProcessTemplatesBody) => {
    const { data } = await axios.post<IMongoProcessTemplateReviewerPopulated[]>(`${processTemplates}/search`, searchBody);
    return data;
};

export {
    createProcessTemplateRequest,
    updateProcessTemplateRequest,
    deleteProcessTemplateRequest,
    processTemplateObjectToProcessTemplateForm,
    searchProcessTemplates,
};
