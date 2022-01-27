import React, { useEffect } from 'react';

import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { environment } from '../../../globals';
import { ChooseCategory, chooseCategorySchema } from './ChooseCategory';
import { CreateTemplateName, createTemplateNameSchema } from './CreateTemplateName';
import { AddFields, addFieldsSchema } from './AddFields';
import { useAxios } from '../../../axios';
import { IEntityTemplatePopulated, IMongoEntityTemplatePopulated } from '../../../interfaces';
import { addEntityTemplate, updateEntityTemplate } from '../../../store/globalState';

export interface EntityTemplateWizardValues extends Omit<IEntityTemplatePopulated, 'properties'> {
    properties: { name: string; title: string; type: string; isRequired: boolean }[];
}

const basePropertyTypes = ['string', 'number', 'boolean'];

const formToJSONSchema = (values: EntityTemplateWizardValues) => {
    const schema = {
        type: 'object',
        properties: {} as any,
        required: [] as string[],
    };

    const { properties } = values;

    properties.forEach(({ name, title, type, isRequired }) => {
        schema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? type : 'string',
            format: basePropertyTypes.includes(type) ? undefined : type,
        };

        if (isRequired) {
            schema.required.push(name);
        }
    });

    return { ...values, properties: schema, category: values.category._id };
};

const steps: StepsType<EntityTemplateWizardValues> = [
    {
        label: 'בחר קטגוריה',
        component: (props) => <ChooseCategory {...props} />,
        validation: chooseCategorySchema,
    },
    {
        label: 'בחר שם תבנית',
        component: (props) => <CreateTemplateName {...props} />,
        validation: createTemplateNameSchema,
    },
    {
        label: 'שדות',
        component: (props) => <AddFields {...props} />,
        validation: addFieldsSchema,
    },
];

const EntityTemplateWizard: React.FC<WizardBaseType<EntityTemplateWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', displayName: '', category: { displayName: '', name: '', _id: '' }, properties: [] },
    isEditMode = false,
}) => {
    const [{ loading, error, data }, executeRequest] = useAxios<IMongoEntityTemplatePopulated>(
        isEditMode
            ? { method: 'PUT', url: `${environment.api.entityTemplates}/${(initialValues as EntityTemplateWizardValues & { _id: string })._id}` }
            : { method: 'POST', url: environment.api.entityTemplates },
        { manual: true },
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
            title="יצירת תבנית יישות"
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
