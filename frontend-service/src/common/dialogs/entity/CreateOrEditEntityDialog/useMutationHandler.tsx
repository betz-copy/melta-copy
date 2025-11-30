import { Button, Grid } from '@mui/material';
import { AxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import i18next from 'i18next';
import { Dispatch, SetStateAction } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import { environment } from '../../../../globals';
import { ICreateOrUpdateWithRuleBreachDialogState, IExternalErrors, IMutationProps } from '../../../../interfaces/CreateOrEditEntityDialog';
import { IChildTemplateMapPopulated, IMongoChildTemplatePopulated } from '../../../../interfaces/childTemplates';
import { IEntity, IUniqueConstraint } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IErrorResponse } from '../../../../interfaces/error';
import { ActionTypes } from '../../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreach } from '../../../../interfaces/ruleBreaches/ruleBreach';
import { createEntityClientSideRequest } from '../../../../services/clientSideService';
import { createEntityRequest, updateEntityRequestForMultiple } from '../../../../services/entitiesService';
import { isChildTemplate } from '../../../../utils/templates';
import { EntityWizardValues } from '..';

const { errorCodes } = environment;

type MutateAsyncFn = (args: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) => Promise<IEntity>;

const useMutationHandler = (
    externalErrors: IExternalErrors,
    shouldNavigateToEntityPage: boolean,
    entityTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    { actionType, payload, onError, onSuccess }: IMutationProps,
    setExternalErrors: Dispatch<SetStateAction<IExternalErrors>>,
    setCreateOrUpdateWithRuleBreachDialogState: Dispatch<SetStateAction<ICreateOrUpdateWithRuleBreachDialogState>>,
    clientSideUserEntity?: IEntity,
) => {
    const queryClient = useQueryClient();

    const [_, navigate] = useLocation();
    let isLoading = false;
    let mutateAsync: MutateAsyncFn | undefined;
    let childTemplate: IMongoChildTemplatePopulated | undefined;

    const handleMutationError = (
        err: AxiosError,
        template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
        newEntityData?: EntityWizardValues | undefined,
    ) => {
        if (err.response?.status === StatusCodes.REQUEST_TOO_LONG) setExternalErrors((prev) => ({ ...prev, files: true }));
        const errorMetadata = (err.response?.data as IErrorResponse)?.metadata;

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
            updateEntityRequestForMultiple(payload!.properties._id, newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                onSuccess?.(data);

                if (Object.values(externalErrors.unique).length === 0 || !externalErrors.files || externalErrors.action.length === 0) {
                    if (shouldNavigateToEntityPage === true) {
                        const childTemplateIdParam = isChildTemplate(entityTemplate) ? `?childTemplateId=${entityTemplate._id}` : '';
                        navigate(`/entity/${data.properties._id}${childTemplateIdParam}`);
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
                onSuccess?.(data);

                if (Object.values(externalErrors.unique).length === 0 || !externalErrors.files || externalErrors.action.length === 0) {
                    if (shouldNavigateToEntityPage && data) {
                        const childTemplateIdParam = isChildTemplate(entityTemplate) ? `?childTemplateId=${entityTemplate._id}` : '';
                        navigate(`/entity/${data.properties._id}${childTemplateIdParam}`);
                    }
                }
            },
            onError: (err: AxiosError, { newEntityData }) => {
                handleMutationError(err, entityTemplate, newEntityData);
            },
        },
    );

    if (Object.keys(clientSideUserEntity || {}).length) {
        const childTemplates = queryClient.getQueryData<IChildTemplateMapPopulated>('getClientSideChildTemplates')!;
        childTemplate = Array.from(childTemplates.values()).find((childTemplate) => childTemplate.parentTemplate._id === entityTemplate._id);
    }
    const { isLoading: isClientSideCreateLoading, mutateAsync: clientSideCreateMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            createEntityClientSideRequest(newEntityData, childTemplate!, ignoredRules, clientSideUserEntity),
        {
            onSuccess: (data) => {
                onSuccess?.(data);
            },
            onError: (err: AxiosError, { newEntityData }) => {
                handleMutationError(err, entityTemplate, newEntityData);
            },
        },
    );

    switch (actionType) {
        case ActionTypes.CreateEntity:
            isLoading = isCreateLoading;
            mutateAsync = createMutation;
            break;
        case ActionTypes.UpdateEntity:
            isLoading = isUpdateLoading;
            mutateAsync = updateMutation;
            break;
        case ActionTypes.CreateClientSideEntity:
            isLoading = isClientSideCreateLoading;
            mutateAsync = clientSideCreateMutation;
            break;
        default:
            isLoading = false;
            mutateAsync = undefined;
    }

    const mutationPromiseToastify = async (values: EntityWizardValues, ignoredRules?: IRuleBreach['brokenRules']) => {
        if (!mutateAsync) return;

        toast.dismiss();

        const mutationPromise = mutateAsync({ newEntityData: values, ignoredRules });
        const isUpdate = actionType === ActionTypes.UpdateEntity;

        await new Promise<void>((resolve) => {
            toast.promise(
                mutationPromise,
                {
                    pending: `${i18next.t(`actions.${isUpdate ? 'update' : 'create'}`)} ${
                        entityTemplate.displayName.length ? entityTemplate.displayName : i18next.t('entity')
                    }`,
                    success: {
                        render({ data }: { data?: IEntity }) {
                            return (
                                <Grid display="flex" alignItems="center">
                                    <span>{i18next.t(`wizard.entity.${isUpdate ? 'edited' : 'created'}Successfully`)}</span>
                                    {data?.properties?._id && (
                                        <Button
                                            variant="text"
                                            onClick={() => {
                                                const childTemplateIdParam = isChildTemplate(entityTemplate)
                                                    ? `?childTemplateId=${entityTemplate._id}`
                                                    : '';
                                                navigate(`/entity/${data.properties._id}${childTemplateIdParam}`);
                                            }}
                                            sx={{ marginRight: '5px' }}
                                        >
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
                                    <span>{i18next.t(`wizard.entity.failedTo${isUpdate ? 'Edit' : 'Create'}`)}</span>
                                    <Button
                                        variant="text"
                                        onClick={() => {
                                            if (data) onError?.(values);
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
                { style: { width: '335px' } },
            );

            mutationPromise.finally(resolve);
        });
    };

    return [isLoading, mutationPromiseToastify] as const;
};

export default useMutationHandler;
