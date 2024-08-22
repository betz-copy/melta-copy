import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { IFrameWizardBaseType, StepsType, Wizard, WizardBaseType } from '../index';
import fileDetails from '../../../interfaces/fileDetails';
import { ErrorToast } from '../../ErrorToast';
import { IFrame, IMongoIFrame } from '../../../interfaces/iFrames';
import { createIFrame, updateIFrame } from '../../../services/iFramesService';
import { CreateIFrameDetails, createIFrameDetailsSchema } from './CreateIFrameDetails';
import { settingIFramesPermissionsSchema, SettingIFramesPermissions } from './SettingPermissions';
import { ChooseIFrameIcon } from './ChooseIcon';

export interface IFrameWizardValues extends Omit<IFrame, 'iconFileId'> {
    icon?: fileDetails;
}
const steps: StepsType<IFrameWizardValues> = [
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
const updateIFramesOrderOnLocalStorage = (data: IMongoIFrame) => {
    const iFramesOrder = localStorage.getItem('iFramesOrder');

    if (iFramesOrder) {
        let iFramesStored = JSON.parse(iFramesOrder);
        const index = iFramesStored.findIndex((iFrameId) => iFrameId === data._id);

        if (index === -1) {
            console.log('not exist');

            iFramesStored = [data._id, ...iFramesStored];

            localStorage.setItem('iFramesOrder', JSON.stringify(iFramesStored));
        }
    } else localStorage.setItem('iFramesOrder', JSON.stringify([data._id]));
};
const IFrameWizard: React.FC<IFrameWizardBaseType> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', icon: undefined, categoryIds: [], url: '', description: '', apiToken: '', placeInSideBar: false },
    isEditMode = false,
    setIFramesOrder,
}) => {
    const queryClient = useQueryClient();

    const { isLoading, mutateAsync } = useMutation(
        (iFrame: IFrameWizardValues) =>
            isEditMode === true ? updateIFrame((initialValues as IFrameWizardValues & { _id: string })._id, iFrame) : createIFrame(iFrame),
        {
            onSuccess: async (data: IMongoIFrame) => {
                queryClient.invalidateQueries(['searchIFrames']);

                queryClient.setQueryData(['getIFrame', data._id], data);

                updateIFramesOrderOnLocalStorage(data);

                setIFramesOrder(JSON.parse(localStorage.getItem('iFramesOrder')!));
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
                i18next.t(isEditMode ? 'wizard.iFrame.editedSuccefully' : 'wizard.iFame.createdSuccefully');
                handleClose();
            },
            onError: (error: AxiosError) => {
                if (isEditMode) {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.iFrame.failedToEdit')} />);
                } else {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.iFrame.failedToCreate')} />);
                }
            },
        },
    );

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.iFrame.title')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync(values)}
        />
    );
};

export { IFrameWizard };
