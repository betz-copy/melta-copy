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
export const basePropertyTypes = ['string', 'number', 'boolean'];
export const stringFormats = ['date', 'date-time', 'email', 'entityReference' ];

const processTemplateObjectToProcessTemplateForm = (
    processTemplate: IMongoProcessTemplatePopulated | null,
): ProcessTemplateWizardValues | undefined => {
    if (!processTemplate) return undefined;
    const { details, steps, summaryDetails, ...restOfProcessTemplate } = processTemplate;
    const detailsPropertiesArray: ProcessTemplateFormInputProperties[] = [];
    const detailsAttachmentProperties: ProcessTemplateFormInputProperties[] = [];
    const stepsForm: ProcessTemplateWizardValues['steps'] = [];
    const summaryDetailsPropertiesArray: ProcessTemplateFormInputProperties[] = [];
    const summaryDetailsAttachmentProperties: ProcessTemplateFormInputProperties[] = [];

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
    summaryDetails.propertiesOrder.forEach((key) => {
        const value = summaryDetails.properties.properties[key];

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
            patternCustomErrorMessage: value.patternCustomErrorMessage || '',
        };

        if (value.format === 'fileId') {
            summaryDetailsAttachmentProperties.push(property);
        } else {
            summaryDetailsPropertiesArray.push(property);
        }
    });

    return {
        ...restOfProcessTemplate,
        detailsProperties: detailsPropertiesArray,
        detailsAttachmentProperties,
        steps: stepsForm,
        summaryDetailsProperties: summaryDetailsPropertiesArray,
        summaryDetailsAttachmentProperties,
    };
};
const formToJSONSchema = (values: ProcessTemplateWizardValues): ICreateProcessTemplateBody | IUpdateProcessTemplateBody => {
    const {
        detailsProperties,
        detailsAttachmentProperties,
        steps,
        summaryDetailsProperties,
        summaryDetailsAttachmentProperties,
        ...restOfProperties
    } = values;

    const detailsPropertiesOrder: string[] = [];
    const summaryDetailsPropertiesOrder: string[] = [];
    const stepTemplates: ICreateProcessTemplateBody['steps'] | IUpdateProcessTemplateBody['steps'] = [];

    const detailsSchema: IProcessDetails['properties'] = {
        type: 'object',
        properties: {},
    };
    const summaryDetailsSchema: IProcessDetails['properties'] = {
        type: 'object',
        properties: {},
    };

    detailsProperties.forEach(({ name, title, type, options, pattern, patternCustomErrorMessage }) => {
        detailsSchema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? (type as IProcessSingleProperty['type']) : 'string',
            format: stringFormats.includes(type) ? (type as IProcessSingleProperty['format']) : undefined,
            enum: type === 'enum' ? options : undefined,
            pattern: type === 'pattern' ? pattern : undefined,
            patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
        };

        detailsPropertiesOrder.push(name);
    });

    detailsAttachmentProperties.forEach(({ name, title }) => {
        detailsSchema.properties[name] = {
            title,
            type: 'string',
            format: 'fileId',
        };

        detailsPropertiesOrder.push(name);
    });

    steps.forEach((step) => {
        const stepPropertiesOrder: string[] = [];
        const stepSchema: IProcessDetails['properties'] = {
            type: 'object',
            properties: {},
        };
        step.properties.forEach(({ name, title, type, options, pattern, patternCustomErrorMessage }) => {
            stepSchema.properties[name] = {
                title,
                type: basePropertyTypes.includes(type) ? (type as IProcessSingleProperty['type']) : 'string',
                format: stringFormats.includes(type) ? (type as IProcessSingleProperty['format']) : undefined,
                enum: type === 'enum' ? options : undefined,
                pattern: type === 'pattern' ? pattern : undefined,
                patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
            };

            stepPropertiesOrder.push(name);
        });

        step.attachmentProperties.forEach(({ name, title }) => {
            stepSchema.properties[name] = {
                title,
                type: 'string',
                format: 'fileId',
            };

            stepPropertiesOrder.push(name);
        });
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
    summaryDetailsProperties.forEach(({ name, title, type, options, pattern, patternCustomErrorMessage }) => {
        summaryDetailsSchema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? (type as IProcessSingleProperty['type']) : 'string',
            format: stringFormats.includes(type) ? (type as IProcessSingleProperty['format']) : undefined,
            enum: type === 'enum' ? options : undefined,
            pattern: type === 'pattern' ? pattern : undefined,
            patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
        };

        summaryDetailsPropertiesOrder.push(name);
    });

    summaryDetailsAttachmentProperties.forEach(({ name, title }) => {
        summaryDetailsSchema.properties[name] = {
            title,
            type: 'string',
            format: 'fileId',
        };

        summaryDetailsPropertiesOrder.push(name);
    });
    return {
        ...restOfProperties,
        details: { properties: detailsSchema, propertiesOrder: detailsPropertiesOrder },
        steps: stepTemplates,
        summaryDetails: {
            properties: summaryDetailsSchema,
            propertiesOrder: summaryDetailsPropertiesOrder,
        },
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
    formData.append('summaryDetails', JSON.stringify(processTemplate.summaryDetails));

    const { data } = await axios.post<IMongoProcessTemplatePopulated>(processTemplates, formData);
    return data;
};

const updateProcessTemplateRequest = async (processTemplateId: string, updatedProcessTemplate: ProcessTemplateWizardValues) => {
    const formData = new FormData();
    updatedProcessTemplate.steps
        .filter((step) => step.icon!.file instanceof File)
        .forEach((step, index) => formData.append(String(index), step.icon!.file as File));
    const processTemplate = formToJSONSchema(updatedProcessTemplate);
    formData.append('name', processTemplate.name);
    formData.append('displayName', processTemplate.displayName);
    formData.append('details', JSON.stringify(processTemplate.details));
    formData.append('steps', JSON.stringify(processTemplate.steps));
    formData.append('summaryDetails', JSON.stringify(processTemplate.summaryDetails));
    const { data } = await axios.put<IMongoProcessTemplatePopulated>(`${processTemplates}/${processTemplateId}`, formData);
    return data;
};

const deleteProcessTemplateRequest = async (processTemplateId: string) => {
    const { data } = await axios.delete(`${processTemplates}/${processTemplateId}`);
    return data;
};

export { createProcessTemplateRequest, updateProcessTemplateRequest, deleteProcessTemplateRequest, processTemplateObjectToProcessTemplateForm };
