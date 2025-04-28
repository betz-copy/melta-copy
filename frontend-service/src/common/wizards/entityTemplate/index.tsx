/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/no-unstable-nested-components */
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { IConstraint, IUniqueConstraintOfTemplate } from '../../../interfaces/entities';
import { IEntityTemplateMap, IEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import fileDetails from '../../../interfaces/fileDetails';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { createEntityTemplateRequest, formToJSONSchema, updateEntityTemplateRequest } from '../../../services/templates/enitityTemplatesService';
import { getAllRelationshipTemplatesRequest } from '../../../services/templates/relationshipTemplatesService';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { mapTemplates } from '../../../utils/templates';
import { ErrorToast } from '../../ErrorToast';
import { StepType, Wizard, WizardBaseType } from '../index';
import { AddFields, addFieldsSchema } from './AddFields';
import { ChooseCategory, chooseCategorySchema } from './ChooseCategory';
import { ChooseIcon } from './ChooseIcon';
import { CreateTemplateName, useCreateOrEditTemplateNameSchema } from './CreateTemplateName';
import { UploadExportFormats } from './UploadExportFormats';
import { updateUserPermissionForEntityTemplate } from '../../../utils/permissions/templatePermissions';
import { IFilterRelationReference } from './commonInterfaces';

const { errorCodes } = environment;

export interface EntityTemplateFormInputProperties {
    name: string;
    title: string;
    type: string;
    id: string;
    options: string[];
    pattern: string;
    patternCustomErrorMessage: string;
    required: boolean;
    preview: boolean;
    hide: boolean;
    readOnly?: true;
    identifier?: true;
    uniqueCheckbox?: boolean;
    groupName?: string;
    optionColors: Record<string, string>;
    dateNotification: number | null | undefined;
    isDailyAlert: boolean | null | undefined;
    isDatePastAlert: boolean | null | undefined;
    calculateTime: boolean | null | undefined;
    serialStarter: number | undefined;
    deleted?: boolean | undefined;
    relationshipReference?: {
        relationshipTemplateId?: string;
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
        filters?: IFilterRelationReference[];
    };
    archive?: boolean;
    mapSearch?: boolean;
    filterRelationList?: boolean;
}
export interface EntityTemplateWizardValues
    extends Omit<
        IEntityTemplatePopulated,
        'properties' | 'iconFileId' | 'propertiesOrder' | 'propertiesPreview' | 'enumPropertiesColors' | 'uniqueConstraints' | 'documentTemplatesIds'
    > {
    properties: EntityTemplateFormInputProperties[];
    attachmentProperties: EntityTemplateFormInputProperties[];
    archiveProperties: EntityTemplateFormInputProperties[];
    uniqueConstraints?: IUniqueConstraintOfTemplate[];
    icon?: fileDetails;
    documentTemplatesIds?: File[];
}

const EntityTemplateWizard: React.FC<WizardBaseType<EntityTemplateWizardValues>> = ({
    open,
    handleClose,
    initialStep = 0,
    initialValues = {
        name: '',
        displayName: '',
        icon: undefined,
        category: { displayName: '', name: '', _id: '', color: '' },
        disabled: false,
        properties: [],
        archiveProperties: [],
        attachmentProperties: [],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        uniqueConstraints: [],
        documentTemplatesIds: [],
        mapSearchProperties: [],
        filterRelationList: [],
    },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const currentWorkspace = useWorkspaceStore((state) => state.workspace);

    const currentTemplateId = isEditMode ? (initialValues as EntityTemplateWizardValues & { _id: string })._id : undefined;
    const templates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates') || new Map();

    const createTemplateNameSchema = useCreateOrEditTemplateNameSchema(templates, currentTemplateId);

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
                const updatedUserPermissions = updateUserPermissionForEntityTemplate(data, currentUser, currentWorkspace._id);
                setUser(updatedUserPermissions);
                handleClose();
            },
            onError: (error: AxiosError, entityTemplateValues) => {
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
                        charts: `${i18next.t('wizard.entityTemplate.failedToDeleteFieldThatUsedInCharts', { property })}`,
                    };

                    toast.error(errorMessages[type]);
                    return;
                }
                if (isEditMode && errorMetadata?.errorCode === errorCodes.failedToCreateConstraints) {
                    const { constraint }: { constraint: IConstraint } = errorMetadata;

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

                console.log('failed to create/update entity template. error', error);
            },
        },
    );

    const steps: StepType<EntityTemplateWizardValues>[] = [
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

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initialStep={initialStep}
            isEditMode={isEditMode}
            title={
                isEditMode
                    ? `${i18next.t('wizard.entityTemplate.updateTitle')} - ${initialValues.displayName}`
                    : i18next.t('wizard.entityTemplate.createTitle')
            }
            steps={steps}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
        />
    );
};

export { EntityTemplateWizard };
