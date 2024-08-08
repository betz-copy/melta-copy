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
                console.log('shirel ', { data });
                // const before = await queryClient.getQueryData('searchIFrames');

                queryClient.setQueryData(['searchIFrames', ''], (iFrames: any) => {
                    console.log({ iFrames });

                    // const iFrames = mapTemplates(iframes, 'name');
                    // console.log('2: ', { iFrames });
                    const updatedIFrames = new Map(iFrames);
                    const uu = updatedIFrames.set(data._id, data);
                    // const r = iFrames.set(data._id, data);
                    console.log({ uu });
                    // return updateIFrame;
                });
                // const after = await queryClient.getQueryData('searchIFrames');
                // console.log({ before, after });

                // queryClient.invalidateQueries('getIFrame');
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
