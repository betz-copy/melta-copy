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
import { addEntityTemplate } from '../../../store/globalState';

export interface EntityTemplateWizardValues extends Omit<IEntityTemplatePopulated, 'properties'> {
    properties: { name: string; displayName: string; type: string; isRequired: boolean }[];
}

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
        { method: 'POST', url: environment.api.entityTemplates },
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
            toast.success('created template successfully');
            dispatch(addEntityTemplate(data));
        }
    }, [data, dispatch]);

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title="יצירת תבנית יישות"
            steps={steps}
            submitOptions={{
                func: async (values: EntityTemplateWizardValues) => {
                    await executeRequest({ data: values });
                    handleClose();
                },
                loading,
            }}
        />
    );
};

export { EntityTemplateWizard };
