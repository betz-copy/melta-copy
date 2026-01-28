import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { QueryClient, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import fileDetails from '../../../interfaces/fileDetails';
import { IFrame, IMongoIFrame } from '../../../interfaces/iFrames';
import { createIFrame, updateIFrame } from '../../../services/iFramesService';
import { ErrorToast } from '../../ErrorToast';
import { StepType, Wizard, WizardBaseType } from '../index';
import { ChooseIFrameIcon } from './ChooseIcon';
import { CreateIFrameDetails, createIFrameDetailsSchema } from './CreateIFrameDetails';
import { SettingIFramesPermissions, settingIFramesPermissionsSchema } from './SettingPermissions';

export interface IFrameWizardValues extends Omit<IFrame, 'iconFileId'> {
    icon?: fileDetails;
}
export type IFrameWizardBaseType = WizardBaseType<IFrameWizardValues> & {
    setIFramesOrder: (value: string[]) => void;
};

const steps: StepType<IFrameWizardValues>[] = [
    {
        label: i18next.t('wizard.iFrame.editDetails'),
        component: (props) => <CreateIFrameDetails {...props} />,
        validationSchema: createIFrameDetailsSchema,
    },
    {
        label: i18next.t('wizard.iFrame.settingPermissions'),
        component: (props) => <SettingIFramesPermissions {...props} />,
        validationSchema: settingIFramesPermissionsSchema,
    },
    {
        label: i18next.t('wizard.iFrame.chooseIcon'),
        component: (props) => <ChooseIFrameIcon {...props} />,
    },
];
export const updateIFramesOrderOnLocalStorage = (data: IMongoIFrame, queryClient: QueryClient) => {
    const iFramesOrder = localStorage.getItem('iFramesOrder');

    let iFramesStored: string[];
    if (iFramesOrder) {
        try {
            iFramesStored = JSON.parse(iFramesOrder);
        } catch (error) {
            iFramesStored = [];
            console.warn('Failed to parse iFramesOrder from localStorage:', error);
        }
        const index = iFramesStored.indexOf(data._id);

        if (index === -1) {
            iFramesStored = [data._id, ...iFramesStored];
        }
    } else iFramesStored = [data._id];

    localStorage.setItem('iFramesOrder', JSON.stringify(iFramesStored));
    queryClient.setQueryData<IMongoIFrame[]>('allIFrames', (oldData) => {
        if (!oldData) {
            return [data];
        }

        const index = oldData.findIndex((existingIframe) => existingIframe._id === data._id);

        if (index === -1) {
            return [data, ...oldData];
        }
        const updatedData = [...oldData];
        updatedData[index] = data;
        return [...updatedData];
    });
    return iFramesStored;
};
const IFrameWizard: React.FC<IFrameWizardBaseType> = ({
    open,
    handleClose,
    initialStep = 0,
    initialValues = { name: '', icon: undefined, categoryIds: [], url: '', description: '', placeInSideBar: false },
    isEditMode = false,
    setIFramesOrder,
}) => {
    const queryClient = useQueryClient();

    const { isLoading, mutateAsync } = useMutation(
        (iFrame: IFrameWizardValues) =>
            isEditMode ? updateIFrame((initialValues as IFrameWizardValues & { _id: string })._id, iFrame) : createIFrame(iFrame),
        {
            onSuccess: async (data: IMongoIFrame) => {
                queryClient.setQueryData(['getIFrame', data._id], data);
                const iFramesStored = updateIFramesOrderOnLocalStorage(data, queryClient);
                setIFramesOrder(iFramesStored);
                i18next.t(isEditMode ? 'wizard.iFrame.editedSuccessfully' : 'wizard.iFrame.createdSuccessfully');
                handleClose();
            },
            onError: (error: AxiosError) => {
                toast.error(
                    <ErrorToast
                        axiosError={error}
                        defaultErrorMessage={i18next.t(`wizard.iFrame.${isEditMode ? 'failedToEdit' : 'failedToCreate'}`)}
                    />,
                );
            },
        },
    );

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initialStep={initialStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.iFrame.title')}
            steps={steps}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
        />
    );
};

export { IFrameWizard };
