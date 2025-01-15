import { Grid, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import React, { CSSProperties, useRef, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../../common/EntitiesTableOfTemplate';
import { ErrorToast } from '../../../common/ErrorToast';
import { environment } from '../../../globals';
import { IBasicChart } from '../../../interfaces/charts';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { createChart, deleteChart } from '../../../services/chartsService';
import { chartValidationSchema, initialValues } from '../../../utils/charts/getChartAxes';
import { ChartGenerator } from '../chartGenerator.tsx';
import { ChartSideBar } from './ChartSideBar';
import { ChartTopBar } from './TopBar';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

const ChartPage: React.FC = () => {
    const { templateId } = useParams();
    const theme = useTheme();
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);
    const bgColor: CSSProperties['backgroundColor'] = theme.palette.mode === 'dark' ? '#131313' : '#fcfeff';

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(templateId as string) as IMongoEntityTemplatePopulated;

    const [_, navigate] = useLocation();

    const [edit, setEdit] = useState(true);

    const { mutateAsync: createChartMutateAsync, isLoading } = useMutation(
        (newChart: IBasicChart) => createChart({ ...newChart, templateId } as IBasicChart),
        {
            onSuccess: () => {
                toast.success(i18next.t('charts.actions.createdSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToCreate')} />);
            },
        },
    );

    const { mutateAsync: deleteChartMutateAsync, isLoading: isDeleteChartLoading } = useMutation((id: string) => deleteChart(id), {
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
                console.log('bye', { values });
                createChartMutateAsync(values);
                formikHelpers.setSubmitting(false);
            }}
            onReset={() => setEdit(false)}
            validationSchema={chartValidationSchema}
            enableReinitialize
        >
            {(formik) => (
                <Form>
                    <ChartTopBar edit={edit} onEdit={() => setEdit(true)} isLoading={false} onDelete={() => deleteChartMutateAsync(chart._id)} />
                    <Grid container flexWrap="nowrap" height="94.7vh" width="100%" justifyContent="space-evenly">
                        <Grid item container flexDirection="column" justifyContent="space-evenly" flexWrap="nowrap" height="100%">
                            <Grid item container width="100%" height="70%" alignItems="center" justifyContent="center">
                                <ChartGenerator
                                    formikValues={formik.values}
                                    template={template}
                                    entityTemplate={template}
                                    entitiesTableRef={entitiesTableRef}
                                />
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
                            <ChartSideBar formik={formik} entityTemplate={template} />
                        </Grid>
                    </Grid>
                </Form>
            )}
        </Formik>
    );
};

export default ChartPage;
