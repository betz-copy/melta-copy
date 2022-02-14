import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { environment } from '../../../globals';
import { useAxios } from '../../../axios';
import { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema } from './CreateRelationshipTemplate';
import { IMongoCategory } from '../../../interfaces';

export interface RelationshipTemplateWizardValues {
    name: string;
    sourceEntity: IMongoCategory;
    destinationEntity: IMongoCategory;
}

const steps: StepsType<RelationshipTemplateWizardValues> = [
    {
        label: i18next.t('wizard.createRelationshipTemplate'),
        component: (props) => <CreateRelationshipTemplateName {...props} />,
        validation: createRelationshipTemplateNameSchema,
    },
];

const RelationshipTemplateWizard: React.FC<WizardBaseType<RelationshipTemplateWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', sourceEntity: { _id: '', displayName: '', name: '' }, destinationEntity: { _id: '', displayName: '', name: '' } },
    isEditMode = false,
}) => {
    const [{ loading, error, data }, executeRequest] = useAxios({ method: 'POST', url: environment.api.relationshipTemplates });

    useEffect(() => {
        if (error) {
            toast.error('failed to create rel template');
        }
    }, [error]);

    useEffect(() => {
        if (data) {
            toast.success('created rel template successfully');
        }
    }, [data]);

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.createRelationshipTemplate')}
            steps={steps}
            isLoading={loading}
            submitFucntion={(values) => executeRequest({ data: values })}
        />
    );
};

export { RelationshipTemplateWizard };
