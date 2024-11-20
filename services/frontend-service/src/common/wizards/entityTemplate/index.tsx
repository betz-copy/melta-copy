import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import {
    IConstraint,
    IUniqueConstraintOfTemplate,
    IEntityTemplateMap,
    IEntityTemplatePopulated,
    IRelationshipTemplateMap,
} from '@microservices/shared';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { ChooseCategory, chooseCategorySchema } from './ChooseCategory';
import { CreateTemplateName, createTemplateNameSchema } from './CreateTemplateName';
import { AddFields, addFieldsSchema } from './AddFields';
import { createEntityTemplateRequest, formToJSONSchema, updateEntityTemplateRequest } from '../../../services/templates/enitityTemplatesService';
import { ChooseIcon } from './ChooseIcon';
import fileDetails from '../../../interfaces/fileDetails';
import { ErrorToast } from '../../ErrorToast';
import { environment } from '../../../globals';
import { UploadExportFormats } from './UploadExportFormats';
import { getAllRelationshipTemplatesRequest } from '../../../services/templates/relationshipTemplatesService';
import { mapTemplates } from '../../../utils/templates';

const { errorCodes } = environment;

// TODO: implement type array to all types
interface IBaseFormInputPropertyTypes {
    type: string;
    options: string[];
    pattern: string;
    patternCustomErrorMessage: string;
}
export interface EntityTemplateFormInputProperties extends IBaseFormInputPropertyTypes {
    name: string;
    title: string;
    required: boolean;
    preview: boolean;
    hide: boolean;
    readOnly?: true;
    id: string;
    uniqueCheckbox?: boolean;
    groupName?: string;
    optionColors: Record<string, string>;
    dateNotification: number | null | undefined;
    isDailyAlert: boolean | null | undefined;
    calculateTime: boolean | null | undefined;
    serialStarter: number | undefined;
    deleted?: boolean | undefined;
    relationshipReference?: {
        relationshipTemplateId?: string;
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
    };
}
export interface EntityTemplateWizardValues
    extends Omit<
        IEntityTemplatePopulated,
        'properties' | 'iconFileId' | 'propertiesOrder' | 'propertiesPreview' | 'enumPropertiesColors' | 'uniqueConstraints' | 'documentTemplatesIds'
    > {
    properties: EntityTemplateFormInputProperties[];
    attachmentProperties: EntityTemplateFormInputProperties[];
    uniqueConstraints?: IUniqueConstraintOfTemplate[];
    icon?: fileDetails;
    documentTemplatesIds?: File[];
}

const steps: StepsType<EntityTemplateWizardValues> = [
    {
        label: i18next.t('wizard.entityTemplate.chooseCategroy'),
        component: (props) => <ChooseCategory {...props} />,
        validationSchema: chooseCategorySchema,
    },
    {
        label: i18next.t('wizard.entityTemplate.chooseEntityTemplateName'),
        component: (props, { isEditMode }) => <CreateTemplateName {...props} isEditMode={isEditMode} />,
        validationSchema: createTemplateNameSchema,
    },
    {
        label: i18next.t('wizard.entityTemplate.chooseIcon'),
        component: (props) => <ChooseIcon {...props} />,
    },
    {
        label: i18next.t('wizard.entityTemplate.properties'),
        component: (props, { isEditMode, setBlock }) => <AddFields {...props} isEditMode={isEditMode} setBlock={setBlock} />,
        validationSchema: addFieldsSchema,
    },
    {
        label: i18next.t('wizard.entityTemplate.exportDocuments'),
        component: (props) => <UploadExportFormats {...props} />,
    },
];

const EntityTemplateWizard: React.FC<WizardBaseType<EntityTemplateWizardValues>> = ({
    open,
    handleClose,
    initialStep = 0,
    initialValues = {
        name: '',
        displayName: '',
        icon: undefined,
        category: { displayName: '', name: '', _id: '', color: '', iconFileId: '' },
        disabled: false,
        properties: [],
        attachmentProperties: [],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        uniqueConstraints: [],
        documentTemplatesIds: [],
        _id: '',
    } as EntityTemplateWizardValues,
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();

    const { isLoading, mutateAsync } = useMutation(
        (entityTemplate: EntityTemplateWizardValues) =>
            isEditMode
                ? updateEntityTemplateRequest((initialValues as EntityTemplateWizardValues & { _id: string })._id, entityTemplate)
                : createEntityTemplateRequest(entityTemplate),
        {
            onSuccess: async (data) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => entityTemplateMap!.set(data._id, data));
                queryClient.invalidateQueries(['searchEntityTemplates']);
                if (isEditMode) {
                    toast.success(i18next.t('wizard.entityTemplate.editedSuccessfully'));
                } else {
                    toast.success(i18next.t('wizard.entityTemplate.createdSuccessfully'));
                }

                try {
                    const relationshipTemplates = await getAllRelationshipTemplatesRequest();
                    queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', mapTemplates(relationshipTemplates));
                } catch (error) {
                    toast.error(i18next.t('wizard.failedToUpdateSystemData'));
                }
                handleClose();
            },
            onError: (
                error: AxiosError<{
                    metadata: { errorCode: string; type?: string; property?: string; relatedTemplateName?: string; constraint?: IConstraint };
                }>,
                entityTemplateValues,
            ) => {
                const errorMetadata = error.response?.data?.metadata;

                if (isEditMode && errorMetadata?.errorCode === errorCodes.failedToDeleteField) {
                    const { type, property, relatedTemplateName } = errorMetadata;

                    const errorMessages = {
                        rules: `${i18next.t('wizard.entityTemplate.failedToDeleteFieldThatUsedInRules', { property })}`,
                        gantts: `${i18next.t('wizard.entityTemplate.failedToDeleteFieldThatUsedInGantts', { property })}`,
                        relationshipReference: `${i18next.t('wizard.entityTemplate.failedToDeleteFieldThatUsedInRelationshipReference', {
                            property,
                            relatedTemplateName,
                        })}`,
                    };

                    toast.error(errorMessages[type ?? '']);
                    return;
                }
                if (isEditMode && errorMetadata?.errorCode === errorCodes.failedToCreateConstraints) {
                    const { constraint }: any = errorMetadata; // TODO: yona - fix

                    const newEntityTemplate = formToJSONSchema(entityTemplateValues, false);

                    if (constraint.type === 'REQUIRED') {
                        const { title: constraintPropertyDisplayName } = newEntityTemplate.properties.properties[constraint.property];
                        toast.error(
                            `${i18next.t(
                                'wizard.entityTemplate.failedToUpdateRequiredConstraintsBecauseOfEntitiesWithMissing',
                            )} ${constraintPropertyDisplayName}`,
                        );
                    } else {
                        const constraintPropsDisplayNames = constraint.properties.map((prop) => newEntityTemplate.properties.properties[prop].title);

                        const constraintPropsListString = constraintPropsDisplayNames.map((prop) => `"${prop}"`).join('+');
                        toast.error(
                            `${i18next.t(
                                'wizard.entityTemplate.failedToUpdateUniqueConstraintsBecauseOfEntitiesWithDuplicates',
                            )} ${constraintPropsListString}`,
                        );
                    }

                    return;
                }

                if (isEditMode) {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToEdit')} />);
                } else {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToCreate')} />);
                }

                // eslint-disable-next-line no-console
                console.log('failed to create/update entity template. error', error);
            },
        },
    );

    return (
        <Wizard<EntityTemplateWizardValues>
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initialStep={initialStep}
            isEditMode={isEditMode}
            title={isEditMode ? i18next.t('wizard.entityTemplate.editTitle') : i18next.t('wizard.entityTemplate.title')}
            steps={steps as StepsType<EntityTemplateWizardValues>}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
        />
    );
};

export { EntityTemplateWizard };
