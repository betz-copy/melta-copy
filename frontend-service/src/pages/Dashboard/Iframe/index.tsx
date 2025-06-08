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
import { IFrame as Iframetype } from '../../../interfaces/iFrames';
import { createIFrame, getIFrameById, updateIFrame } from '../../../services/iFramesService';
import { DashboardItem } from '../DashboardItem';
import { BodyComponent } from './bodyCompenent';
import { SideBarDetails } from './sideBarDetails';

const Iframe1: React.FC = () => {
    const { iframeId } = useParams<{ iframeId: string }>();
    const [_, navigate] = useLocation();

    const [viewMode, setViewMode] = useState<ViewMode>(iframeId ? ViewMode.ReadOnly : ViewMode.Add);

    const queryClient = useQueryClient();
    const { data: iframeData, isLoading: isLoadingGetTable } = useQuery(['getIframe', iframeId], () => getIFrameById(iframeId!), {
        enabled: !!iframeId,
    });

    useEffect(() => {
        if (iframeId && iframeData) setViewMode(ViewMode.ReadOnly);
    }, [iframeId, iframeData]);

    const { isLoading, mutateAsync } = useMutation(
        (chartData: Iframetype) => (viewMode === ViewMode.Edit ? updateIFrame(iframeId, chartData) : createIFrame(chartData, true)),
        {
            onSuccess: async (data) => {
                if (viewMode === ViewMode.Edit) {
                    queryClient.invalidateQueries(['getIframe', iframeId]);
                    setViewMode(ViewMode.ReadOnly);
                } else {
                    navigate(`/iframe/${data._id}`);
                }

                toast.success(i18next.t(viewMode === ViewMode.Edit ? 'wizard.category.editedSuccessfully' : 'wizard.category.createdSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(
                    <ErrorToast
                        axiosError={error}
                        defaultErrorMessage={
                            ViewMode.Edit ? i18next.t('wizard.entityTemplate.failedToEdit') : i18next.t('wizard.entityTemplate.failedToCreate')
                        }
                    />,
                );
            },
        },
    );

    const steps: StepType<Iframetype>[] = [
        {
            label: i18next.t('charts.generalDetails'),
            component: (props) => <SideBarDetails viewMode={viewMode} {...props} />,
            validationSchema: createIFrameDetailsSchema,
        },
        {
            label: 'הגדרת הרשאות',
            component: (props) => <SettingIFramesPermissions viewMode={viewMode} {...props} />,
            validationSchema: settingIFramesPermissionsSchema,
        },
    ];

    if (isLoadingGetTable) return <CircularProgress />;

    return (
        <DashboardItem<Iframetype>
            title={viewMode === ViewMode.Add ? i18next.t('dashboard.iframes.addIFrame') : i18next.t('dashboard.iframes.editIFrame')}
            backPath={{ path: '/dashboard', title: 'מסך ראשי' }}
            onDelete={() => console.log('delete')}
            steps={steps}
            initialValues={iframeData || ({ name: '', url: '' } as Iframetype)}
            // eslint-disable-next-line react/no-unstable-nested-components
            bodyComponent={(props) => <BodyComponent {...props} />}
            submitFunction={(values) => mutateAsync(values)}
            isLoading={isLoading}
            viewMode={{
                value: viewMode,
                set: setViewMode,
            }}
            type={DashboardItemType.Iframe}
        />
    );
};

export default Iframe1;
