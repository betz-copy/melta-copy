/* eslint-disable react/no-unstable-nested-components */
import { CircularProgress } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import { ErrorToast } from '../../../common/ErrorToast';
import { StepType } from '../../../common/wizards';
import { createIFrameDetailsSchema } from '../../../common/wizards/iFrame/CreateIFrameDetails';
import { SettingIFramesPermissions, settingIFramesPermissionsSchema } from '../../../common/wizards/iFrame/SettingPermissions';
import { DashboardItemType, ViewMode } from '../../../interfaces/dashboard';
import { IFrame } from '../../../interfaces/iFrames';
import { createIFrame, getIFrameById, updateIFrame } from '../../../services/iFramesService';
import { DashboardItem } from '../DashboardItem';
import { BodyComponent } from './bodyComponent';
import { SideBarDetails } from './sideBarDetails';
import { environment } from '../../../globals';
import { dashboardInitialValues } from '../../../utils/dashboard/formik';
import { deleteDashboardItem } from '../../../services/dashboardService';

const { dashboardPath, iFramePath } = environment.dashboard;

const DashboardIframe: React.FC = () => {
    const { iframeId } = useParams<{ iframeId: string }>();
    const [_, navigate] = useLocation();
    const queryClient = useQueryClient();

    const [viewMode, setViewMode] = useState<ViewMode>(iframeId ? ViewMode.ReadOnly : ViewMode.Add);

    const { data: iframeData, isLoading: isLoadingGetTable } = useQuery(['getIframe', iframeId], () => getIFrameById(iframeId!), {
        enabled: !!iframeId,
    });

    const { isLoading, mutateAsync } = useMutation(
        (chartData: IFrame) => (viewMode === ViewMode.Edit ? updateIFrame(iframeId, chartData) : createIFrame(chartData, true)),
        {
            onSuccess: async (data) => {
                if (viewMode === ViewMode.Edit) {
                    queryClient.invalidateQueries(['getIframe', iframeId]);
                    setViewMode(ViewMode.ReadOnly);
                } else {
                    navigate(`${iFramePath}/${data._id}`);
                }

                toast.success(i18next.t(`wizard.category.${viewMode === ViewMode.Edit ? 'edited' : 'created'}Successfully`));
            },
            onError: (error: AxiosError) => {
                toast.error(
                    <ErrorToast
                        axiosError={error}
                        defaultErrorMessage={i18next.t(`wizard.entityTemplate.failedTo${ViewMode.Edit ? 'Edit' : 'Create'}`)}
                    />,
                );
            },
        },
    );

    const { mutateAsync: deleteMutateAsync } = useMutation(() => deleteDashboardItem(iframeId), {
        onSuccess: () => {
            navigate(dashboardPath);
            toast.success(i18next.t('charts.actions.deletedSuccessfully'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
        },
    });

    useEffect(() => {
        if (iframeId && iframeData) setViewMode(ViewMode.ReadOnly);
    }, [iframeId, iframeData]);

    const steps: StepType<IFrame>[] = [
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
        <DashboardItem<IFrame>
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
