/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { StepType, Wizard, WizardBaseType } from '../index';
import { ChooseCategory, chooseCategorySchema } from './ChooseCategory';
import { CreateTemplateName, useCreateOrEditTemplateNameSchema } from './CreateTemplateName';
import { AddFields, addFieldsSchema } from './AddFields';
import { createEntityTemplateRequest, formToJSONSchema, updateEntityTemplateRequest } from '../../../services/templates/enitityTemplatesService';
import { IEntityTemplateMap, IEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ChooseIcon } from './ChooseIcon';
import fileDetails from '../../../interfaces/fileDetails';
import { ErrorToast } from '../../ErrorToast';
import { environment } from '../../../globals';
import { IConstraint, IUniqueConstraintOfTemplate } from '../../../interfaces/entities';
import { UploadExportFormats } from './UploadExportFormats';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { getAllRelationshipTemplatesRequest } from '../../../services/templates/relationshipTemplatesService';
import { mapCategories, mapTemplates } from '../../../utils/templates';
import { ICategoryMap } from '../../../interfaces/categories';
import { getAllCategoryRequest } from '../../../services/templates/categoriesService';
import { getOrderConfigByNameRequest } from '../../../services/templates/configService';

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
    };
    archive?: boolean;
    mapSearch?: boolean;
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
    },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();

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

                try {
                    const categories = await getAllCategoryRequest();
                    const categoryOrder = await getOrderConfigByNameRequest('categoryOrder');
                    queryClient.setQueryData<ICategoryMap>('getCategories', mapCategories(categories, categoryOrder.order));
                } catch (error) {
                    toast.error(i18next.t('wizard.failedToUpdateSystemData'));
                }

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
