import React, { useEffect } from 'react';

import { toast } from 'react-toastify';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { environment } from '../../../globals';
import { useAxios } from '../../../axios';
import { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema } from './CreateRelationshipTemplateName';
import { ChooseTemplate, chooseTemplateSchema } from './ChooseTemplate';
import { IMongoCategory } from '../../../interfaces';

export interface RelationshipTemplateWizardValues {
    name: string;
    sourceEntity: IMongoCategory;
    destinationEntity: IMongoCategory;
}

const steps: StepsType<RelationshipTemplateWizardValues> = [
    {
        label: 'בחר שם תבנית קשר',
        component: (props) => <CreateRelationshipTemplateName {...props} />,
        validation: createRelationshipTemplateNameSchema,
    },
    {
        label: 'בחר תבנית מקור',
        component: (props) => <ChooseTemplate {...props} fieldName="sourceEntity" />,
        validation: chooseTemplateSchema('sourceEntity'),
    },
    {
        label: 'בחר תבנית יעד',
        component: (props) => <ChooseTemplate {...props} fieldName="destinationEntity" />,
        validation: chooseTemplateSchema('destinationEntity'),
    },
];

const RelationshipTemplateWizard: React.FC<WizardBaseType<RelationshipTemplateWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', sourceEntity: { _id: '', displayName: '', name: '' }, destinationEntity: { _id: '', displayName: '', name: '' } },
    isEditMode = false,
}) => {
    const [{ loading, error, data }, executeRequest] = useAxios({ method: 'POST', url: environment.api.relationshipTemplates }, { manual: true });

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
            title="יצירת תבנית קשר"
            steps={steps}
            submitOptions={{
                func: (values: RelationshipTemplateWizardValues) => executeRequest({ data: values }),
                loading,
            }}
        />
    );
};

export { RelationshipTemplateWizard };
