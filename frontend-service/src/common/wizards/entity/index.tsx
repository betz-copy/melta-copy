import React from 'react';

import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import i18next from 'i18next';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Divider, Grid } from '@mui/material';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { ChooseTemplate, chooseTemplateSchema } from './ChooseTemplate';
import { FillFields, fillFieldsValidate } from './FillFields';
import { createEntityRequest } from '../../../services/entitiesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { FileFields, fileFieldsSchema } from './FileFields';
import { environment } from '../../../globals';
import { toastConstraintValidationError } from './toastConstraintValidationError';
import { BlueTitle } from '../../BlueTitle';

const { errorCodes } = environment;

export interface EntityWizardValues {
    template: IMongoEntityTemplatePopulated;
    properties: object & { disabled: boolean };
    attachmentsProperties: Record<string, File | undefined>;
}

const steps: StepsType<EntityWizardValues> = [
    {
        label: i18next.t('wizard.entity.chooseEntityTemplate'),
        component: (props) => (
            <Grid container flexDirection="column" gap="40px" height="fit-content">
                <Grid item container flexDirection="column" gap="40px">
                    <Grid item>
                        <BlueTitle
                            title={i18next.t('wizard.entity.chooseEntityTemplate')}
                            component="h6"
                            variant="h6"
                            style={{ fontSize: '15px', fontWeight: '500' }}
                        />
                    </Grid>
                    <Grid item>
                        <ChooseTemplate {...props} />
                    </Grid>
                </Grid>
                {Object.keys(props?.values?.template?.properties?.properties || {}).length > 0 && (
                    <Grid container>
                        <Grid item container flexDirection="column" gap="10px">
                            <Divider sx={{ backgroundColor: '#EBEFFA' }} />
                            <Grid item>
                                <FillFields {...props} />
                            </Grid>
                        </Grid>
                        {Object.values(props.values.template.properties.properties).filter((value) => value.format === 'fileId').length > 0 && (
                            <Grid item container marginTop="30px" flexDirection="column" gap="20px">
                                <Divider sx={{ backgroundColor: '#EBEFFA', marginTop: '10px' }} />
                                <Grid item>
                                    <BlueTitle
                                        title={i18next.t('wizard.entity.fileFields')}
                                        component="h6"
                                        variant="h6"
                                        style={{ fontSize: '15px', fontWeight: '500', marginTop: '10px' }}
                                    />
                                </Grid>
                                <Grid item padding="5px" alignItems="center">
                                    <FileFields {...props} />
                                </Grid>
                            </Grid>
                        )}
                    </Grid>
                )}
            </Grid>
        ),
        validationSchema: chooseTemplateSchema.concat(fileFieldsSchema),
        validate: fillFieldsValidate,
    },
];

const EntityWizard: React.FC<WizardBaseType<EntityWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = {
        template: {
            _id: '',
            displayName: '',
            name: '',
            category: {
                _id: '',
                name: '',
                displayName: '',
                color: '',
            },
            properties: {
                properties: {},
                required: [],
                type: 'object',
                hide: [],
            },
            propertiesOrder: [],
            propertiesPreview: [],
            uniqueConstraints: [],
            disabled: false,
        },
        properties: { disabled: false },
        attachmentsProperties: {},
    },
    isEditMode = false,
}) => {
    const navigate = useNavigate();

    const { isLoading, mutateAsync } = useMutation((entity: any) => createEntityRequest(entity), {
        onSuccess: (newEntity) => {
            toast.success(i18next.t('wizard.entity.createdSuccessfully'));
            handleClose();
            navigate(`/entity/${newEntity.properties._id}`);
        },
        onError: (err: AxiosError, { template }: EntityWizardValues) => {
            const errorMetadata = err.response?.data?.metadata;
            if (errorMetadata?.errorCode === errorCodes.failedConstraintsValidation) {
                toastConstraintValidationError(errorMetadata, template);
                return;
            }

            toast.error(i18next.t('wizard.entity.failedToCreate'));
        },
    });

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.entity.title')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync(values)}
        />
    );
};

export { EntityWizard };
