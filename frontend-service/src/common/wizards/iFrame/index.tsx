import React from 'react';

import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { StepsType, Wizard, WizardBaseType } from '../index';
// import { CreateIFrameName, createIFrameNameSchema } from './CreateIFrameName';
import fileDetails from '../../../interfaces/fileDetails';
import { ErrorToast } from '../../ErrorToast';
import { IFrame, IFrameMap } from '../../../interfaces/iFrames';
import { createIFrame, updateIFrame } from '../../../services/iFramesService';
import { CreateCategoryName, createCategoryNameSchema } from '../category/CreateCategoryName';
import { ChooseIcon } from '../entityTemplate/ChooseIcon';
import { CreateIFrameDetails, createIFrameDetailsSchema } from './CreateIFrameDetails';
// import { ChooseIcon } from '../entityTemplate/ChooseIcon';
// import { ChooseColor } from '../category/ChooseColor';

export interface IFrameWizardValues extends Omit<IFrame, 'iconFileId'> {
    icon?: fileDetails;
}
const steps: StepsType<IFrameWizardValues> = [
    {
        label: i18next.t('wizard.iFrame.editDetails'),
        component: (props) => <CreateIFrameDetails {...props} />,
        // validationSchema: createIFrameDetailsSchema,
    },
    // {
    //     label: i18next.t('wizard.iFrame.settingPermissions'),
    //     component: (props) => <SettingPrmissions {...props} />,
    //     // validationSchema: createCategoryNameSchema,
    // },
    {
        label: i18next.t('wizard.iFrame.chooseIcon'),
        component: (props) => <ChooseIcon {...props} />,
    },
    // {
    //     label: i18next.t('wizard.iFrame.chooseColor'),
    //     component: (props) => <ChooseColor {...props} />,
    //     validationSchema: chooseColorSchema,
    // },
];

const IFrameWizard: React.FC<WizardBaseType<IFrameWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', icon: undefined, categoryIds: [], url: '', description: '', apiToken: '', placeInSideBar: false },
    isEditMode = false,
}) => {
    console.log({ initialValues });

    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation(
        (iFrame: IFrameWizardValues) =>
            isEditMode === true ? updateIFrame((initialValues as IFrameWizardValues & { _id: string })._id, iFrame) : createIFrame(iFame),

        {
            onSuccess: (data) => {
                console.log('helooo im here');

                // queryClient.setQueryData<IFrameMap>('getIFrames', (iFrames) => iFrames!.set(data._id, data));

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
