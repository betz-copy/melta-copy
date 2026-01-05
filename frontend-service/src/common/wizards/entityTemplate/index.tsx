/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/no-unstable-nested-components */
import { ICategoryMap, IMongoCategory } from '@packages/category';
import { IChildTemplateMap, IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { FileDetails } from '@packages/common';
import { IConstraint, IUniqueConstraintOfTemplate } from '@packages/entity';
import { FieldGroupData, IEntityTemplateMap, IEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IRelationshipTemplateMap } from '@packages/relationship-template';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { IErrorResponse } from '../../../interfaces/error';
import { getAllChildTemplates } from '../../../services/templates/childTemplatesService';
import { createEntityTemplateRequest, formToJSONSchema, updateEntityTemplateRequest } from '../../../services/templates/entityTemplatesService';
import { getAllRelationshipTemplatesRequest } from '../../../services/templates/relationshipTemplatesService';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { updateUserPermissionForEntityTemplate } from '../../../utils/permissions/templatePermissions';
import { mapTemplates } from '../../../utils/templates';
import { ErrorToast } from '../../ErrorToast';
import { StepType, Wizard, WizardBaseType } from '../index';
import { AddFields, addFieldsSchema } from './AddFields';
import { ChooseCategory, chooseCategorySchema } from './ChooseCategory';
import { ChooseIcon } from './ChooseIcon';
import { CreateTemplateName, useCreateOrEditTemplateNameSchema } from './CreateTemplateName';
import { IFilterTemplate, PropertyItem } from './commonInterfaces';
import { UploadExportFormats } from './UploadExportFormats';

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
        filters?: IFilterTemplate[];
    };
    expandedUserField?: {
        relatedUserField: string;
        kartoffelField: string;
    };
    archive?: boolean;
    mapSearch?: boolean;
    fieldGroup?: FieldGroupData;
    hideFromDetailsPage?: boolean;
    comment?: string;
    color?: string;
    isProfileImage?: boolean;
}

type EntityTemplatePropertyByType = { type: 'field'; data: EntityTemplateFormInputProperties };

export interface EntityTemplateWizardValues
    extends Omit<
        IEntityTemplateWithConstraintsPopulated,
        'properties' | 'iconFileId' | 'propertiesOrder' | 'propertiesPreview' | 'enumPropertiesColors' | 'uniqueConstraints' | 'documentTemplatesIds'
    > {
    properties: PropertyItem[];
    attachmentProperties: EntityTemplatePropertyByType[];
    archiveProperties: EntityTemplatePropertyByType[];
    uniqueConstraints?: IUniqueConstraintOfTemplate[];
    icon?: FileDetails;
    documentTemplatesIds?: File[];
    enumPropertiesColors?: string[];
}

const defaultInitialValues: EntityTemplateWizardValues = {
    _id: '',
    name: '',
    displayName: '',
    icon: undefined,
    category: { displayName: '', name: '', _id: '', color: '', templatesOrder: [], createdAt: new Date(), updatedAt: new Date(), iconFileId: null },
    disabled: false,
    properties: [],
    archiveProperties: [],
    attachmentProperties: [],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    uniqueConstraints: [],
    documentTemplatesIds: [],
    mapSearchProperties: [],
};

const EntityTemplateWizard: React.FC<
    WizardBaseType<EntityTemplateWizardValues> & { searchEntityTemplatesQueryKey: (string | IMongoCategory[])[] }
> = ({ open, handleClose, searchEntityTemplatesQueryKey, initialStep = 0, initialValues = defaultInitialValues, isEditMode = false }) => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const currentWorkspace = useWorkspaceStore((state) => state.workspace);

    const currentTemplateId = isEditMode ? (initialValues as EntityTemplateWizardValues & { _id: string })._id : undefined;
    const templates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates') || new Map();

    const createTemplateNameSchema = useCreateOrEditTemplateNameSchema(templates, currentTemplateId);

    const { isLoading, mutateAsync } = useMutation(
        async (entityTemplate: EntityTemplateWizardValues) => {
            if (isEditMode) {
                return await updateEntityTemplateRequest(
                    (initialValues as EntityTemplateWizardValues & { _id: string })._id,
                    entityTemplate,
                    queryClient,
                );
            }
            const createdTemplate = await createEntityTemplateRequest(entityTemplate, queryClient);
            return { template: createdTemplate, childTemplates: [] };
        },
        {
            onSuccess: async ({ template: data, childTemplates }) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => entityTemplateMap!.set(data._id, data));
                queryClient.setQueryData<IChildTemplateMap>('getChildTemplates', (childTemplateMap) => {
                    childTemplates.forEach((child) => childTemplateMap!.set(child._id, child));
                    return childTemplateMap!;
                });

                queryClient.invalidateQueries(searchEntityTemplatesQueryKey);

                if (isEditMode) {
                    toast.success(i18next.t('wizard.entityTemplate.editedSuccessfully'));

                    try {
                        const childTemplates: IMongoChildTemplateWithConstraintsPopulated[] = await getAllChildTemplates();
                        queryClient.setQueryData<IChildTemplateMap>('getChildTemplates', mapTemplates(childTemplates, 'name'));
                    } catch (error) {
                        console.error(error);
                        toast.error(i18next.t('wizard.failedToUpdateSystemData'));
                    }
                } else {
                    toast.success(i18next.t('wizard.entityTemplate.createdSuccessfully'));
                    try {
                        queryClient.setQueryData<ICategoryMap>('getCategories', (categories) => {
                            const newCategoryMap = new Map(categories!);
                            newCategoryMap.set(data.category._id, data.category);

                            return newCategoryMap;
                        });
                    } catch (error) {
                        console.error(error);
                        toast.error(i18next.t('wizard.failedToUpdateSystemData'));
                    }
                }

                try {
                    const relationshipTemplates = await getAllRelationshipTemplatesRequest();
                    queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', mapTemplates(relationshipTemplates));
                } catch (error) {
                    console.error(error);
                    toast.error(i18next.t('wizard.failedToUpdateSystemData'));
                }

                const updatedUserPermissions = updateUserPermissionForEntityTemplate(data, currentUser, currentWorkspace._id);
                setUser(updatedUserPermissions);
                handleClose();
            },
            onError: (error: AxiosError, entityTemplateValues) => {
                const errorMetadata = (error.response?.data as IErrorResponse)?.metadata;

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

                    const newEntityTemplate = formToJSONSchema(entityTemplateValues, false, queryClient);

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

                toast.error(
                    <ErrorToast
                        axiosError={error}
                        defaultErrorMessage={i18next.t(`wizard.entityTemplate.${isEditMode ? 'failedToEdit' : 'failedToCreate'}`)}
                    />,
                );

                console.error('failed to create/update entity template. error', error);
            },
        },
    );

    const steps: StepType<EntityTemplateWizardValues>[] = [
        {
            label: i18next.t('wizard.entityTemplate.chooseCategory'),
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
            title={`${i18next.t(`wizard.entityTemplate.${isEditMode ? 'update' : 'create'}Title`)}${isEditMode ? `- ${initialValues.displayName}` : ''}`}
            steps={steps}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
        />
    );
};

export { EntityTemplateWizard };
