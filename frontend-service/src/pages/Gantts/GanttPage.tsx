import { CircularProgress, Grid } from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import { ErrorToast } from '../../common/ErrorToast';
import { environment } from '../../globals';
import { IBasicGantt } from '../../interfaces/gantts';
import { deleteGantt, getGanttById, updateGantt } from '../../services/ganttsService';
import { formikInitialGanttData, ganttValidationSchema } from '../../utils/gantts';
import { useLocalStorage } from '../../utils/hooks/useLocalStorage';
import { Gantt } from './Gantt';
import { GanttSideBar } from './SideBar';
import { GanttsTopBar } from './TopBar';

const { ganttSettings } = environment;

const GanttPage: React.FC = () => {
    const { ganttId } = useParams<{ ganttId: string }>();
    const queryClient = useQueryClient();

    const [_, navigate] = useLocation();

    const [sideBarOpen, setSideBarOpen] = useLocalStorage(ganttSettings.isSidebarOpenLocalStorageKey, true);

    const [edit, setEdit] = useState<boolean>(false);

    const queryKey = ['getGantt', ganttId];
    const { data: gantt } = useQuery(queryKey, () => getGanttById(ganttId!));

    const { mutateAsync: updateGanttMutateAsync, isLoading: isUpdateGanttLoading } = useMutation(
        (params: Parameters<typeof updateGantt>) => updateGantt(...params),
        {
            onSuccess: (updatedGantt) => {
                queryClient.setQueryData(queryKey, updatedGantt);
                setEdit(false);
                toast.success(i18next.t('gantts.actions.updatedSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('gantts.actions.failedToUpdate')} />);
            },
        },
    );
    const { mutateAsync: deleteGanttMutateAsync, isLoading: isDeleteGanttLoading } = useMutation((id: string) => deleteGantt(id), {
        onSuccess: () => {
            navigate('/gantts');
            toast.success(i18next.t('gantts.actions.deletedSuccessfully'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('gantts.actions.failedToDelete')} />);
        },
    });

    if (!gantt) return <CircularProgress />;

    return (
        <Formik<IBasicGantt>
            initialValues={formikInitialGanttData(gantt)}
            onSubmit={async (updatedGantt, formikHelpers) => {
                updateGanttMutateAsync([gantt._id, updatedGantt]);
                formikHelpers.setSubmitting(false);
            }}
            onReset={() => setEdit(false)}
            validationSchema={ganttValidationSchema}
            enableReinitialize
        >
            {(formik) => (
                <Form>
                    <GanttsTopBar
                        title={gantt.name}
                        formik={formik}
                        onDelete={() => deleteGanttMutateAsync(gantt._id)}
                        onEdit={() => setEdit(true)}
                        onAddGroupBy={() => {
                            formik.setValues((prev) => ({
                                ...prev,
                                groupBy: { entityTemplateId: '', groupNameField: '' },
                                items: prev.items.map((item) => ({ ...item, groupByRelationshipId: '' })),
                            }));
                        }}
                        edit={edit}
                        isGroupBy={Boolean(formik.values.groupBy)}
                        isLoading={isUpdateGanttLoading || isDeleteGanttLoading}
                    />

                    <Grid container wrap="nowrap" position="relative" alignItems="stretch" height="94vh">
                        <Grid sx={{ flex: 1, minWidth: 0 }}>
                            <Gantt gantt={gantt} />
                        </Grid>

                        <Grid sx={{ flexShrink: 0 }}>
                            <GanttSideBar
                                gantt={gantt}
                                open={sideBarOpen}
                                toggle={() => setSideBarOpen(!sideBarOpen)}
                                formik={formik}
                                edit={edit}
                                isLoading={isUpdateGanttLoading || isDeleteGanttLoading}
                            />
                        </Grid>
                    </Grid>
                </Form>
            )}
        </Formik>
    );
};

export default GanttPage;
