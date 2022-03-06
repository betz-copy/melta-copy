import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation } from 'react-query';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema } from './CreateRelationshipTemplate';
import { createRelationshipTemplateRequest } from '../../../services/relationshipTemplatesService';
import { IMongoCategory } from '../../../interfaces/categories';

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
    const { isLoading, mutateAsync } = useMutation((relationshipTemplate: any) => createRelationshipTemplateRequest(relationshipTemplate), {
        onSuccess: () => {
            toast.success('created rel template successfully');
        },
        onError: () => {
            toast.error('failed to create rel template');
        },
    });

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.createRelationshipTemplate')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync({ data: values })}
        />
    );
};

export { RelationshipTemplateWizard };
