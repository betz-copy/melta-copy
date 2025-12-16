import { IMongoUnit } from '@microservices/shared';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { ErrorToast } from '../../../../../common/ErrorToast';
import { StepType, Wizard, WizardBaseType } from '../../../../../common/wizards';
import { createUnit, updateUnit } from '../../../../../services/userService';
import { useWorkspaceStore } from '../../../../../stores/workspace';
import { CreateOrEditStep, createOrEditSchema } from './CreateOrEdit';

export type UnitWizardValues = Omit<IMongoUnit, 'workspaceId'>;

export const defaultInitialValues: UnitWizardValues = {
    _id: '',
    name: '',
    parentId: '',
    disabled: false,
    depth: 0,
};

const steps: StepType<UnitWizardValues>[] = [
    {
        label: i18next.t('wizard.unit.title'),
        component: (props, { isEditMode }) => <CreateOrEditStep {...props} isEditMode={isEditMode} />,
        validationSchema: createOrEditSchema,
    },
];

export const useUnitMutation = (onSuccess?: (unit: Partial<IMongoUnit> & { _id: string }) => void) => {
    const queryClient = useQueryClient();
    const workspace = useWorkspaceStore((w) => w.workspace);

    return useMutation(
        ({
            unit,
            isEditMode,
            effectChildrenOnEnable,
        }: {
            unit: Partial<IMongoUnit> & { _id: string };
            isEditMode: boolean;
            effectChildrenOnEnable?: boolean;
        }) => {
            const { _id, depth: _depth, ...rest } = unit;

            if (isEditMode) {
                const { name, parentId, disabled } = unit;
                return updateUnit(_id, { name, parentId, disabled }, effectChildrenOnEnable);
            }

            return createUnit({ ...(rest as IMongoUnit), workspaceId: workspace._id });
        },
        {
            onSuccess: (_data, { unit }) => {
                queryClient.invalidateQueries('unitHierarchy');
                queryClient.invalidateQueries('getUnits');
                onSuccess?.(unit);
            },
            onError: (error: AxiosError, { isEditMode }) => {
                let errorMessage = 'wizard.unit.';

                if ((error.response?.data as any)?.type === 'MongoServerError') {
                    errorMessage += 'duplicateUnitError';
                } else if ((error.response?.data as any)?.metadata?.type === 'cyclical') {
                    errorMessage += 'cyclicalError';
                } else if ((error.response?.data as any)?.metadata?.type === 'disabled') {
                    errorMessage += 'disabledError';
                } else if (isEditMode) {
                    errorMessage += 'failedToEdit';
                } else {
                    errorMessage += 'failedToCreate';
                }

                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t(errorMessage)} />);
            },
        },
    );
};

export const UnitWizard: React.FC<WizardBaseType<UnitWizardValues> & { onSuccess: (unit: Partial<IMongoUnit> & { _id: string }) => void }> = ({
    open,
    handleClose,
    initialStep = 0,
    initialValues = { ...defaultInitialValues },
    isEditMode = false,
    onSuccess,
}) => {
    const { mutateAsync, isLoading } = useUnitMutation(onSuccess);

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initialStep={initialStep}
            isEditMode={isEditMode}
            title={i18next.t(isEditMode ? 'wizard.unit.updateTitle' : 'wizard.unit.createTitle')}
            steps={steps}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync({ unit: values, isEditMode })}
        />
    );
};
