/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/no-unstable-nested-components */
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { ICategoryMap } from '../../../interfaces/categories';
import { IConstraint, IUniqueConstraintOfTemplate } from '../../../interfaces/entities';
import { IEntityTemplateMap, IEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import fileDetails from '../../../interfaces/fileDetails';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
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
import { FieldGroupData, IFilterTemplate, PropertyItem } from './commonInterfaces';
import { CreateTemplateName, useCreateOrEditTemplateNameSchema } from './CreateTemplateName';
import { UploadExportFormats } from './UploadExportFormats';
import { IChildTemplateMap, IMongoChildTemplate, IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { getAllChildTemplates } from '../../../services/templates/childTemplatesService';

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
}

type EntityTemplatePropertyByType = { type: 'field'; data: EntityTemplateFormInputProperties };

export interface EntityTemplateWizardValues
    extends Omit<
        IEntityTemplatePopulated,
        'properties' | 'iconFileId' | 'propertiesOrder' | 'propertiesPreview' | 'enumPropertiesColors' | 'uniqueConstraints' | 'documentTemplatesIds'
    > {
    properties: PropertyItem[];
    attachmentProperties: EntityTemplatePropertyByType[];
    archiveProperties: EntityTemplatePropertyByType[];
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
        category: { displayName: '', name: '', _id: '', color: '', templatesOrder: [] },
        disabled: false,
        properties: [],
        archiveProperties: [],
        attachmentProperties: [],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        uniqueConstraints: [],
        documentTemplatesIds: [],
        mapSearchProperties: [],
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
                ? updateEntityTemplateRequest((initialValues as EntityTemplateWizardValues & { _id: string })._id, entityTemplate, queryClient)
                : createEntityTemplateRequest(entityTemplate, queryClient),
        {
            onSuccess: async (data) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => entityTemplateMap!.set(data._id, data));
                queryClient.invalidateQueries(['searchEntityTemplates']);

                if (isEditMode) {
                    toast.success(i18next.t('wizard.entityTemplate.editedSuccessfully'));

                    try {
                        const childTemplates: IMongoChildTemplatePopulated[] = await getAllChildTemplates();
                        queryClient.setQueryData<IChildTemplateMap>(
                            'getChildEntityTemplates',
                            mapTemplates(
                                childTemplates.map((childTemplate) => {
                                    return {
                                        ...childTemplate,
                                        category: childTemplate.category._id,
                                        parentTemplateId: childTemplate.parentTemplate._id,
                                    } as IMongoChildTemplate;
                                }),
                                'name',
                            ),
                        );
                    } catch (error) {
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
                        toast.error(i18next.t('wizard.failedToUpdateSystemData'));
                    }
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
