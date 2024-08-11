import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { StepsType, Wizard, WizardBaseType } from '../index';
import fileDetails from '../../../interfaces/fileDetails';
import { ErrorToast } from '../../ErrorToast';
import { IFrame, IFrameMap } from '../../../interfaces/iFrames';
import { createIFrame, updateIFrame } from '../../../services/iFramesService';
import { CreateIFrameDetails, createIFrameDetailsSchema } from './CreateIFrameDetails';
import { settingIFramesPermissionsSchema, SettingIFramesPermissions } from './SettingPermissions';
import { ChooseIFrameIcon } from './ChooseIcon';
import { mapTemplates } from '../../../utils/templates';

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

const IFrameWizard: React.FC<WizardBaseType<IFrameWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', icon: undefined, categoryIds: [], url: '', description: '', apiToken: '', placeInSideBar: false },
    isEditMode = false,
}) => {
    // console.log({ initialValues });
    const queryClient = useQueryClient();
    // const i = queryClient.getQueryData<IFrameMap>('getIFrames');
    // const iFramesArray = Array.from(i!.values());
    // console.log({ i });
    // const refetch = () => queryClient.invalidateQueries({ queryKey: ['searchEntities', templateIds, searchInput], exact: true });
    // useImperativeHandle(ref, () => ({ refetch }));

    // const categories = queryClient.getQueryData('searchIFrames')!;
    // console.log({ categories });
    // // queryClient.setQueryData('searchIFrames', mapTemplates(categories));

    const { isLoading, mutateAsync } = useMutation(
        (iFrame: IFrameWizardValues) =>
            isEditMode === true ? updateIFrame((initialValues as IFrameWizardValues & { _id: string })._id, iFrame) : createIFrame(iFrame),
        {
            onSuccess: async (data) => {
                queryClient.setQueryData(['searchIFrames', null], (oldData: any) => {
                    console.log({ oldData });

                    // const updatedIFrames = oldData.map((iframe) => (iframe._id === data._id ? data : iframe));
                    // console.log({ updatedIFrames });
                    // return updatedIFrames;
                    // console.log('lllllllllllllllllllllllllllllll ', { iFrames });
                    if (!oldData) return;
                    const updatedPages = oldData.pages.map((page) => page.map((iframe) => (iframe._id === data._id ? data : iframe)));

                    // eslint-disable-next-line consistent-return
                    return {
                        ...oldData,
                        pages: updatedPages,
                    };
                });
                // queryClient.invalidateQueries(['searchIFrames', null]);
                queryClient.invalidateQueries({ queryKey: ['searchIFrames', null], exact: true });
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
