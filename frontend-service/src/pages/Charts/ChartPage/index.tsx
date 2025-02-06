import { FilterModel } from '@ag-grid-community/core';
import { Grid, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import React, { CSSProperties, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../../common/EntitiesTableOfTemplate';
import { ErrorToast } from '../../../common/ErrorToast';
import { environment } from '../../../globals';
import { IBasicChart, IChart } from '../../../interfaces/charts';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { createChart, deleteChart, editChart, getChartById } from '../../../services/chartsService';
import { useUserStore } from '../../../stores/user';
import { filterModelToFilterOfTemplate, filterOfTemplateToFilterModel } from '../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { chartValidationSchema, initialValues as defaultInitialValues } from '../../../utils/charts/getChartAxes';
import { ChartGenerator } from '../chartGenerator.tsx';
import { ChartSideBar } from './ChartSideBar';
import { ChartTopBar } from './TopBar';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

const ChartPage: React.FC = () => {
    const { templateId, chartId } = useParams<{ templateId: string; chartId?: string }>();

    const { data: chart } = useQuery(['getChart', chartId], () => getChartById(chartId!), {
        enabled: !!chartId,
    });

    const initialValues = chartId && chart ? chart : defaultInitialValues;

    const theme = useTheme();
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);
    const bgColor: CSSProperties['backgroundColor'] = theme.palette.mode === 'dark' ? '#131313' : '#fcfeff';

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const currentUser = useUserStore((state) => state.user);

    const template = entityTemplates.get(templateId as string) as IMongoEntityTemplatePopulated;

    const [_, navigate] = useLocation();

    const [edit, setEdit] = useState(!!chartId);
    const [readonly, setReadonly] = useState(!!chartId);

    const { mutateAsync: createChartMutateAsync } = useMutation(
        (newChart: IBasicChart) =>
            createChart({
                ...newChart,
                templateId,
                filter: filterModelToFilterOfTemplate(entitiesTableRef.current?.getFilterModel() as FilterModel, template),
                createdBy: currentUser._id,
            } as IBasicChart),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('charts.actions.createdSuccessfully'));
                navigate(`/charts/${templateId}/${data._id}/chart`);
                setReadonly(true);
                setEdit(true);
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToCreate')} />);
            },
        },
    );

    const { mutateAsync: editChartMutateAsync } = useMutation(
        (updatedChart: IChart) =>
            editChart(chartId!, {
                ...updatedChart,
                filter: filterModelToFilterOfTemplate(entitiesTableRef.current?.getFilterModel() as FilterModel, template),
            } as IChart),
        {
            onSuccess: () => {
                toast.success(i18next.t('charts.actions.editedSuccessfully'));
                setReadonly(true);
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToEdit')} />);
            },
        },
    );

    const { mutateAsync: deleteChartMutateAsync } = useMutation((id: string) => deleteChart(id), {
        onSuccess: () => {
            navigate(`/charts/${templateId}`);
            toast.success(i18next.t('charts.actions.deletedSuccessfully'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
        },
    });

    return (
        <Formik<IBasicChart>
            initialValues={initialValues}
            onSubmit={async (values, formikHelpers) => {
                if (edit) editChartMutateAsync(values);
                else createChartMutateAsync(values);
                formikHelpers.setSubmitting(false);
            }}
            validationSchema={chartValidationSchema}
            enableReinitialize
        >
            {(formik) => (
                <Form>
                    <ChartTopBar
                        edit={edit}
                        onEdit={() => setReadonly(false)}
                        isLoading={false}
                        onDelete={() => deleteChartMutateAsync(chartId as string)}
                        readonly={readonly}
                        setReadOnly={setReadonly}
                        formik={formik}
                    />
                    <Grid container flexWrap="nowrap" height="94.7vh" width="100%" justifyContent="space-evenly">
                        <Grid item container flexDirection="column" justifyContent="space-evenly" flexWrap="nowrap" height="100%">
                            <Grid item container width="100%" height="70%" alignItems="center" justifyContent="center">
                                <ChartGenerator formikValues={formik.values} template={template} entityTemplate={template} ref={entitiesTableRef} />
                            </Grid>
                            <Grid item width="100%" sx={{ borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#444' : '#dddddd'}` }}>
                                <EntitiesTableOfTemplate
                                    ref={entitiesTableRef}
                                    template={template}
                                    getRowId={(currentEntity) => currentEntity.properties._id}
                                    getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                                    rowModelType="infinite"
                                    rowHeight={defaultRowHeight}
                                    fontSize={`${defaultFontSize}px`}
                                    editable={false}
                                    saveStorageProps={{
                                        shouldSaveFilter: false,
                                        shouldSaveWidth: false,
                                        shouldSaveVisibleColumns: false,
                                        shouldSaveSorting: false,
                                        shouldSaveColumnOrder: false,
                                        shouldSavePagination: false,
                                        shouldSaveScrollPosition: false,
                                    }}
                                    showNavigateToRowButton={false}
                                    withoutResizeBox
                                    initialFilter={chart && chart.filter ? filterOfTemplateToFilterModel(chart.filter, template) : undefined}
                                />
                            </Grid>
                        </Grid>
                        <Grid
                            item
                            width="400px"
                            height="100%"
                            sx={{
                                borderLeft: `1px solid ${theme.palette.mode === 'dark' ? '#444' : '#dddddd'}`,
                                background: bgColor,
                            }}
                        >
                            <ChartSideBar formik={formik} entityTemplate={template} readonly={readonly} edit={edit} />
                        </Grid>
                    </Grid>
                </Form>
            )}
        </Formik>
    );
};

export default ChartPage;
