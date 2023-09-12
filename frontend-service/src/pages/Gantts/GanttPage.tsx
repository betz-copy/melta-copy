import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { CircularProgress, Grid } from '@mui/material';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { AxiosError } from 'axios';
import cloneDeep from 'lodash.clonedeep';
import { Form, Formik } from 'formik';
import { deleteGantt, getGanttById, updateGantt } from '../../services/ganttsService';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { GanttSideBar } from './SideBar';
import { ganttValidationSchema, getScheduleComponentResourceData } from '../../utils/gantts';
import { useLocalStorage } from '../../utils/useLocalStorage';
import { environment } from '../../globals';
import { Gantt } from './Gantt';
import { GanttsTopBar } from './TopBar';
import { IBasicGantt } from '../../interfaces/gantts';
import { ErrorToast } from '../../common/ErrorToast';

const { ganttSettings } = environment;

interface IGanttPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const GanttPage: React.FC<IGanttPageProps> = ({ setTitle }) => {
    const { ganttId } = useParams();

    const navigate = useNavigate();

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const [sideBarOpen, setSideBarOpen] = useLocalStorage(ganttSettings.isSidebarOpenLocalStorageKey, true);

    const [edit, setEdit] = useState<boolean>(false);

    const queryKey = ['getGantt', ganttId];
    const { data: gantt } = useQuery(queryKey, () => getGanttById(ganttId!));

    useEffect(() => setTitle(gantt?.name || ''), [gantt, setTitle]);

    const resources = useMemo(() => gantt && getScheduleComponentResourceData(gantt.items, entityTemplates), [gantt, entityTemplates]);

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

    if (!gantt || !resources) return <CircularProgress />;

    return (
        <Formik<IBasicGantt>
            initialValues={{ name: gantt.name, items: cloneDeep(gantt.items) }}
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
                        edit={edit}
                        isLoading={isUpdateGanttLoading || isDeleteGanttLoading}
                    />

                    <Grid container wrap="nowrap" position="relative" alignItems="stretch" height="94vh">
                        <Grid item>
                            <Gantt gantt={gantt} resources={resources} />
                        </Grid>

                        <Grid item>
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
