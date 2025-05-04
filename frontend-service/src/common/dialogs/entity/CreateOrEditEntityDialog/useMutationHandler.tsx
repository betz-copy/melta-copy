import { AxiosError } from 'axios';
import { useMutation } from 'react-query';
import { useLocation } from 'wouter';
import { StatusCodes } from 'http-status-codes';
import i18next from 'i18next';
import React, { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-toastify';
import { Button, Grid } from '@mui/material';
import { EntityWizardValues } from '..';
import { IEntity, IMultipleSelect, IUniqueConstraint } from '../../../../interfaces/entities';
import { IRuleBreach } from '../../../../interfaces/ruleBreaches/ruleBreach';
import { updateEntityRequestForMultiple, createEntityRequest, updateMultipleEntitiesRequest } from '../../../../services/entitiesService';
import { MutationActionType, ICreateOrUpdateWithRuleBreachDialogState, IExternalErrors, IMutationProps } from './interface';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { ITablesResults } from '../../../../interfaces/excel';

const useMutationHandler = (
    onSuccess: ((entity: IEntity) => void) | ((entity: ITablesResults) => void),
    externalErrors: IExternalErrors,
    shouldNavigateToEntityPage: boolean,
    entityTemplate: IMongoEntityTemplatePopulated,
    { actionType, payload }: IMutationProps,
    setExternalErrors: Dispatch<SetStateAction<IExternalErrors>>,
    errorCodes,
    setCreateOrUpdateWithRuleBreachDialogState: Dispatch<SetStateAction<ICreateOrUpdateWithRuleBreachDialogState>>,
    onError: (values: EntityWizardValues) => void,
) => {
    const [_, navigate] = useLocation();
    let isLoading = false;
    let mutateAsync:
        | (({
              newEntityData,
              ignoredRules,
          }: {
              newEntityData: EntityWizardValues;
              ignoredRules?: IRuleBreach['brokenRules'];
          }) => Promise<IEntity | ITablesResults>)
        | undefined;

    const handleMutationError = (err: AxiosError, template: IMongoEntityTemplatePopulated, newEntityData?: EntityWizardValues | undefined) => {
        if (err.response?.status === StatusCodes.REQUEST_TOO_LONG) setExternalErrors((prev) => ({ ...prev, files: true }));

        const errorMetadata = err.response?.data?.metadata;

        switch (errorMetadata?.errorCode) {
            case errorCodes.failedConstraintsValidation: {
                const { properties } = errorMetadata.constraint as Omit<IUniqueConstraint, 'constraintName'>;

                const constraintPropsDisplayNames = properties.map((prop) => `${prop}-${template.properties.properties[prop].title}`);

                constraintPropsDisplayNames.forEach((uniqueProp) => {
                    const [propKey, propTitle] = uniqueProp.split('-');

                    setExternalErrors((prev) => ({
                        ...prev,
                        unique: {
                            ...prev.unique,
                            [propKey]: `${i18next.t(
                                `wizard.entity.someEntityAlreadyHasTheSameField${constraintPropsDisplayNames.length > 1 ? 's' : ''}`,
                            )} ${propTitle}`,
                        },
                    }));
                });
                break;
            }

            case errorCodes.actionsCustomError:
                setExternalErrors((prev) => ({ ...prev, action: errorMetadata?.message }));
                break;

            case errorCodes.ruleBlock: {
                const { brokenRules, rawBrokenRules, actions, rawActions } = errorMetadata;

                setCreateOrUpdateWithRuleBreachDialogState!({
                    isOpen: true,
                    brokenRules,
                    rawBrokenRules,
                    newEntityData,
                    actions,
                    rawActions,
                });
                break;
            }

            default:
                break;
        }
    };

    const { isLoading: isUpdateLoading, mutateAsync: updateMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            updateEntityRequestForMultiple((payload as IEntity).properties._id, newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                (onSuccess as (entity: IEntity) => void)(data);

                if (Object.values(externalErrors.unique).length === 0 || !externalErrors.files || externalErrors.action.length === 0) {
                    if (shouldNavigateToEntityPage === true) {
                        navigate(`/entity/${data.properties._id}`);
                    }
                }
            },
            onError: (err: AxiosError, { newEntityData }) => {
                handleMutationError(err, entityTemplate, newEntityData);
            },
        },
    );

    const { isLoading: isCreateLoading, mutateAsync: createMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            createEntityRequest(newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                (onSuccess as (entity: IEntity) => void)(data);

                if (Object.values(externalErrors.unique).length === 0 || !externalErrors.files || externalErrors.action.length === 0) {
                    if (shouldNavigateToEntityPage && data) {
                        navigate(`/entity/${data.properties._id}`);
                    }
                }
            },
            onError: (err: AxiosError, { newEntityData }) => {
                handleMutationError(err, entityTemplate, newEntityData);
            },
        },
    );

    const { isLoading: isMultipleUpdateLoading, mutateAsync: updateMultipleMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            updateMultipleEntitiesRequest(payload as IMultipleSelect<boolean>, newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                (onSuccess as (entity: ITablesResults) => void)(data);
            },
            onError: (err: AxiosError, { newEntityData }) => {
                handleMutationError(err, entityTemplate, newEntityData);
            },
        },
    );

    switch (actionType) {
        case MutationActionType.Create:
            isLoading = isCreateLoading;
            mutateAsync = createMutation;
            break;
        case MutationActionType.Update:
            isLoading = isUpdateLoading;
            mutateAsync = updateMutation;
            break;
        case MutationActionType.UpdateMultiple:
            isLoading = isMultipleUpdateLoading;
            mutateAsync = updateMultipleMutation;
            break;
        default:
            isLoading = false;
            mutateAsync = undefined;
    }

    const mutationPromiseToastify = async (values: EntityWizardValues, ignoredRules?: IRuleBreach['brokenRules']) => {
        if (!mutateAsync) return;

        toast.dismiss();

        const mutationPromise = mutateAsync({ newEntityData: values, ignoredRules });

        await new Promise<void>((resolve) => {
            toast.promise(
                mutationPromise,
                {
                    pending: `${i18next.t(`actions.${actionType === MutationActionType.Update ? 'update' : 'create'}`)} ${
                        entityTemplate.displayName.length > 0 ? entityTemplate.displayName : i18next.t('entity')
                    }`,
                    success: {
                        render({ data }: { data?: IEntity }) {
                            return (
                                <Grid display="flex" alignItems="center">
                                    <span>
                                        {i18next.t(
                                            `wizard.entity.${
                                                actionType === MutationActionType.Update ? 'editedSuccessfully' : 'createdSuccessfully'
                                            }`,
                                        )}
                                    </span>
                                    {data?.properties?._id && (
                                        <Button variant="text" onClick={() => navigate(`/entity/${data.properties._id}`)} sx={{ marginRight: '5px' }}>
                                            {i18next.t('entityPage.linkToEntityPage')}
                                        </Button>
                                    )}
                                </Grid>
                            );
                        },
                    },
                    error: {
                        render({ data }: { data?: IEntity }) {
                            return (
                                <Grid display="flex" alignItems="center">
                                    <span>
                                        {i18next.t(`wizard.entity.${actionType === MutationActionType.Update ? 'failedToEdit' : 'failedToCreate'}`)}
                                    </span>
                                    <Button
                                        variant="text"
                                        onClick={() => {
                                            if (data) onError({ ...values, properties: { ...data?.properties } });
                                        }}
                                        sx={{ marginRight: '5px' }}
                                    >
                                        {i18next.t('entityPage.error')}
                                    </Button>
                                </Grid>
                            );
                        },
                    },
                },
                {
                    autoClose: false,
                    style: { width: '335px' },
                },
            );

            mutationPromise.finally(resolve);
        });
    };

    return [isLoading, mutationPromiseToastify] as const;
};

export default useMutationHandler;
