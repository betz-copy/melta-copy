/* eslint-disable react/no-unstable-nested-components */

import { CircularProgress } from '@mui/material';
import { DashboardItemType } from '@packages/dashboard';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import { ErrorToast } from '../../../../common/ErrorToast';
import { IFrameWizardValues, updateIFramesOrderOnLocalStorage } from '../../../../common/wizards/iFrame';
import { createIFrameDetailsSchema } from '../../../../common/wizards/iFrame/CreateIFrameDetails';
import { SettingIFramesPermissions, settingIFramesPermissionsSchema } from '../../../../common/wizards/iFrame/SettingPermissions';
import { environment } from '../../../../globals';
import { TabStepComponent, ViewMode } from '../../../../interfaces/dashboard';
import { deleteDashboardItem } from '../../../../services/dashboardService';
import { createIFrame, getIFrameById, updateIFrame } from '../../../../services/iFramesService';
import { dashboardInitialValues } from '../../../../utils/dashboard/formik';
import DashboardItemDetails from '..';
import BodyComponent from './bodyComponent';
import SideBarDetails from './sideBarDetails';

const { dashboardPath, iFramePath } = environment.dashboard;

const DashboardIframe: React.FC = () => {
    const { iframeId } = useParams<{ iframeId: string }>();
    const [_, navigate] = useLocation();
    const queryClient = useQueryClient();
    const dashboardId: string = window.history.state?.dashboardId ?? '';

    const [viewMode, setViewMode] = useState<ViewMode>(iframeId ? ViewMode.ReadOnly : ViewMode.Add);

    const { data: iframeData, isLoading: isLoadingGetTable } = useQuery(['getIframe', iframeId], () => getIFrameById(iframeId!), {
        enabled: !!iframeId,
    });

    const { isLoading, mutateAsync } = useMutation(
        (chartData: IFrameWizardValues) => (viewMode === ViewMode.Edit ? updateIFrame(iframeId, chartData) : createIFrame(chartData, true)),
        {
            onSuccess: async (data) => {
                if (viewMode === ViewMode.Edit) {
                    queryClient.invalidateQueries(['getIframe', iframeId]);
                    setViewMode(ViewMode.ReadOnly);
                } else {
                    updateIFramesOrderOnLocalStorage(data, queryClient);

                    navigate(`${iFramePath}/${data._id}`);
                }

                toast.success(i18next.t(`wizard.iFrame.${viewMode === ViewMode.Edit ? 'edited' : 'created'}Successfully`));
            },
            onError: (error: AxiosError) => {
                toast.error(
                    <ErrorToast axiosError={error} defaultErrorMessage={i18next.t(`wizard.iFrame.failedTo${ViewMode.Edit ? 'Edit' : 'Create'}`)} />,
                );
            },
        },
    );

    const { mutateAsync: deleteMutateAsync } = useMutation(() => deleteDashboardItem(dashboardId), {
        onSuccess: () => {
            navigate(dashboardPath);
            toast.success(i18next.t('wizard.iFrame.deletedSuccessfully'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.iFrame.failedToDelete')} />);
        },
    });

    useEffect(() => {
        if (iframeId && iframeData) setViewMode(ViewMode.ReadOnly);
    }, [iframeId, iframeData]);

    const steps: TabStepComponent<IFrameWizardValues>[] = [
        {
            label: i18next.t('charts.generalDetails'),
            component: (props) => <SideBarDetails viewMode={viewMode} {...props} />,
            validationSchema: createIFrameDetailsSchema,
        },
        {
            label: i18next.t('wizard.iFrame.selectCategories'),
            component: (props) => <SettingIFramesPermissions viewMode={viewMode} {...props} />,
            validationSchema: settingIFramesPermissionsSchema,
        },
    ];

    if (isLoadingGetTable) return <CircularProgress />;

    return (
        <DashboardItemDetails<IFrameWizardValues>
            title={i18next.t(`dashboard.iframes.${viewMode === ViewMode.Add ? 'add' : 'edit'}IFrame`)}
            backPath={{ path: dashboardPath, title: i18next.t('dashboard.mainScreen') }}
            onDelete={deleteMutateAsync}
            steps={steps}
            initialValues={iframeData || dashboardInitialValues.iframe}
            bodyComponent={(props) => <BodyComponent {...props} />}
            submitFunction={(values) => mutateAsync(values)}
            isLoading={isLoading}
            viewMode={{ value: viewMode, set: setViewMode }}
            type={DashboardItemType.Iframe}
        />
    );
};

export default DashboardIframe;
