import { ICategoryMap, IMongoCategory } from '@packages/category';
import { IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { IConstraint } from '@packages/entity';
import { IRelationshipTemplateMap } from '@packages/relationship-template';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { IErrorResponse } from '../../../interfaces/error';
import { EntityTemplateWizardValues, IChildTemplateMap, IEntityTemplateMap } from '../../../interfaces/template';
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
import { ChooseIcon } from './ChooseIcon';
import { useCreateOrEditTemplateNameSchema } from './CreateTemplateName';
import { CreateTemplateSettings } from './CreateTemplateSettings';
import { PropertyItem } from './commonInterfaces';
import { UploadExportFormats } from './UploadExportFormats';
import { WalletTransferSettings, walletTransferSettingsSchema } from './WalletTransferSettings';

const { errorCodes } = environment;

export const hasAccountBalanceField = (properties: PropertyItem[]) =>
    properties.some((property) => (property.type === 'field' ? !!property.data?.accountBalance : property.fields?.some((f) => !!f.accountBalance)));

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

    const [exportFormats, setExportFormats] = useState<boolean>(false);
    const [isAccountTemplate, setIsAccountTemplate] = useState<boolean>(false);
    const [isTransferTemplate, setIsTransferTemplate] = useState<boolean>(false);

    // biome-ignore lint/correctness/useExhaustiveDependencies: lol
    useEffect(() => {
        const isWalletTemplate = hasAccountBalanceField(initialValues.properties);
        setIsAccountTemplate(isWalletTemplate ?? false);
    }, [initialValues.properties, open]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: lol
    useEffect(() => {
        setExportFormats((initialValues.documentTemplatesIds?.length ?? 0) > 0);
        setIsTransferTemplate(!!initialValues.walletTransfer || false);
    }, [open]);

    const currentTemplateId = isEditMode ? (initialValues as EntityTemplateWizardValues & { _id: string })._id : undefined;
    const templates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const createTemplateSettingsSchema = useCreateOrEditTemplateNameSchema(templates, currentTemplateId);
    const walletTransferSchema = walletTransferSettingsSchema();
    const addFieldsSettingsSchema = addFieldsSchema(isAccountTemplate);

    const { isLoading, mutateAsync } = useMutation(
        (entityTemplate: EntityTemplateWizardValues) => {
            // TODO: CHECK IF WORKS
            if (isEditMode) {
                return updateEntityTemplateRequest((initialValues as EntityTemplateWizardValues & { _id: string })._id, entityTemplate, queryClient);
            } else return createEntityTemplateRequest(entityTemplate, queryClient);
        },
        {
            onSuccess: async (data) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => entityTemplateMap!.set(data._id, data));

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
            label: i18next.t('wizard.entityTemplate.entitySettings'),
            component: (props, { isEditMode }) => (
                <CreateTemplateSettings
                    {...props}
                    isEditMode={isEditMode}
                    exportFormats={{ value: exportFormats, set: setExportFormats }}
                    isAccountTemplate={{ value: isAccountTemplate, set: setIsAccountTemplate }}
                />
            ),
            alignItems: 'start',
            validationSchema: createTemplateSettingsSchema,
        },
        {
            label: i18next.t('wizard.entityTemplate.chooseIcon'),
            component: (props) => <ChooseIcon {...props} />,
        },
        {
            label: i18next.t('wizard.entityTemplate.properties'),
            component: (props, { isEditMode, setBlock }) => (
                <AddFields
                    {...props}
                    isEditMode={isEditMode}
                    setBlock={setBlock}
                    isAccountTemplate={isAccountTemplate}
                    setIsTransferTemplate={setIsTransferTemplate}
                />
            ),
            validationSchema: addFieldsSettingsSchema,
        },
        ...(isTransferTemplate && !isAccountTemplate
            ? [
                  {
                      label: i18next.t('wizard.entityTemplate.walletTransfer.walletTransferSettings'),
                      component: (props) => <WalletTransferSettings {...props} isAccountTemplate={isAccountTemplate} isEditMode={isEditMode} />,
                      alignItems: 'start',
                      validationSchema: walletTransferSchema,
                  },
              ]
            : []),
        ...(exportFormats
            ? [
                  {
                      label: i18next.t('wizard.entityTemplate.exportDocuments'),
                      component: (props) => <UploadExportFormats {...props} />,
                  } satisfies StepType<EntityTemplateWizardValues>,
              ]
            : []),
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
