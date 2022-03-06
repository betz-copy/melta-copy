import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { ChooseCategory, chooseCategorySchema } from './ChooseCategory';
import { CreateTemplateName, createTemplateNameSchema } from './CreateTemplateName';
import { AddFields, addFieldsSchema } from './AddFields';
import { createEntityTemplateRequest } from '../../../services/enitityTemplatesService';
import { IEntityTemplate, IEntityTemplatePopulated, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

export interface EntityTemplateFormInputProperties {
    name: string;
    title: string;
    type: string;
}
export interface EntityTemplateWizardValues extends Omit<IEntityTemplatePopulated, 'properties'> {
    requiredProrerites: EntityTemplateFormInputProperties[];
    optionalProrerites: EntityTemplateFormInputProperties[];
}

const basePropertyTypes = ['string', 'number', 'boolean'];

const formToJSONSchema = (values: EntityTemplateWizardValues) => {
    const { requiredProrerites, optionalProrerites, ...restOfProperties } = values;

    const schema = {
        type: 'object',
        properties: {} as any,
        required: [] as string[],
    };

    requiredProrerites.forEach(({ name, title, type }) => {
        schema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? type : 'string',
            format: basePropertyTypes.includes(type) ? undefined : type,
        };

        schema.required.push(name);
    });

    optionalProrerites.forEach(({ name, title, type }) => {
        schema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? type : 'string',
            format: basePropertyTypes.includes(type) ? undefined : type,
        };
    });

    return { ...restOfProperties, properties: schema, category: values.category._id } as IEntityTemplate;
};

const steps: StepsType<EntityTemplateWizardValues> = [
    {
        label: i18next.t('wizard.chooseCategroy'),
        component: (props) => <ChooseCategory {...props} />,
        validation: chooseCategorySchema,
    },
    {
        label: i18next.t('wizard.chooseEntityTemplateName'),
        component: (props) => <CreateTemplateName {...props} />,
        validation: createTemplateNameSchema,
    },
    {
        label: i18next.t('wizard.requiredProrerites'),
        component: (props) => <AddFields formValueName="requiredProrerites" {...props} />,
        validation: addFieldsSchema('requiredProrerites'),
    },
    {
        label: i18next.t('wizard.optionalProrerites'),
        component: (props) => <AddFields formValueName="optionalProrerites" {...props} />,
        validation: addFieldsSchema('optionalProrerites'),
    },
];

const EntityTemplateWizard: React.FC<WizardBaseType<EntityTemplateWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', displayName: '', category: { displayName: '', name: '', _id: '' }, requiredProrerites: [], optionalProrerites: [] },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation((enitiyTemplate: IEntityTemplate) => createEntityTemplateRequest(enitiyTemplate), {
        onSuccess: (data) => {
            queryClient.setQueryData<IMongoEntityTemplatePopulated[]>(
                'getEntityTemplates',
                (prevData: IMongoEntityTemplatePopulated[] | undefined) => {
                    return [...(prevData || []), data];
                },
            );
            toast.success('created template successfully');
        },
        onError: () => {
            toast.error('failed to create template');
        },
    });

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.createEntityTemplate')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={async (values) => {
                await mutateAsync(formToJSONSchema(values));
                handleClose();
            }}
        />
    );
};

export { EntityTemplateWizard };
