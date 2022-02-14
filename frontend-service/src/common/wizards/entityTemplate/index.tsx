import React, { useEffect } from 'react';

import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import i18next from 'i18next';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { environment } from '../../../globals';
import { ChooseCategory, chooseCategorySchema } from './ChooseCategory';
import { CreateTemplateName, createTemplateNameSchema } from './CreateTemplateName';
import { AddFields, addFieldsSchema } from './AddFields';
import { useAxios } from '../../../axios';
import { IEntityTemplatePopulated, IMongoEntityTemplatePopulated } from '../../../interfaces';
import { addEntityTemplate, updateEntityTemplate } from '../../../store/globalState';

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

    return { ...restOfProperties, properties: schema, category: values.category._id };
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
    const [{ loading, error, data }, executeRequest] = useAxios<IMongoEntityTemplatePopulated>(
        isEditMode
            ? { method: 'PUT', url: `${environment.api.entityTemplates}/${(initialValues as EntityTemplateWizardValues & { _id: string })._id}` }
            : { method: 'POST', url: environment.api.entityTemplates },
    );
    const dispatch = useDispatch();

    useEffect(() => {
        if (error) {
            toast.error('failed to create template');
        }
    }, [error]);

    useEffect(() => {
        if (data) {
            if (isEditMode) {
                toast.success('updated template successfully');
                dispatch(updateEntityTemplate(data));
            } else {
                toast.success('created template successfully');
                dispatch(addEntityTemplate(data));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, dispatch]); // removed isEditMode, handleClose because of race-condition with close

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.createEntityTemplate')}
            steps={steps}
            isLoading={loading}
            submitFucntion={async (values) => {
                await executeRequest({ data: formToJSONSchema(values) });
                handleClose();
            }}
        />
    );
};

export { EntityTemplateWizard };
