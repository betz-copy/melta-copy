import { Grid, useTheme } from '@mui/material';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import * as Yup from 'yup';
import EntitiesTableOfTemplate from '../../../common/EntitiesTableOfTemplate';
import { TopBar } from '../../../common/TopBar';
import { environment } from '../../../globals';
import { IAxisField, IBasicChart, IChartType, IPermission } from '../../../interfaces/charts';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ChartSideBar } from './ChartSideBar';
import { ChartGenerator } from '../chartGenerator.tsx';

export const chartValidationSchema = Yup.object({
    name: Yup.string().min(2, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    description: Yup.string().min(2, i18next.t('validation.variableName')),
    type: Yup.mixed<IChartType>().oneOf(Object.values(IChartType)).required(i18next.t('validation.required')),
    xAxis: Yup.object({
        field: Yup.mixed<IAxisField>().required(i18next.t('validation.required')),
        title: Yup.string().min(2, i18next.t('validation.variableName')),
    }).required(i18next.t('validation.required')),
    yAxis: Yup.object({
        field: Yup.mixed<IAxisField>().required(i18next.t('validation.required')),
        title: Yup.string().min(2, i18next.t('validation.variableName')),
    }).required(i18next.t('validation.required')),
    permission: Yup.mixed<IPermission>().oneOf(Object.values(IPermission)).required(i18next.t('validation.required')),
});

const initialValues: IBasicChart = {
    name: '',
    description: '',
    xAxis: {
        title: '',
        field: '',
    },
    yAxis: {
        title: '',
        field: '',
    },
    type: IChartType.Line,
    permission: IPermission.Private,
};

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

const ChartPage: React.FC = () => {
    const { templateId } = useParams();
    const theme = useTheme();
    const bgColor: CSSProperties['backgroundColor'] = theme.palette.mode === 'dark' ? '#131313' : '#fcfeff';

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(templateId as string) as IMongoEntityTemplatePopulated;

    return (
        <Formik<IBasicChart>
            initialValues={initialValues}
            onSubmit={(values) => console.log('bye', { values })}
            onReset={() => console.log('hi')}
            validationSchema={chartValidationSchema}
            enableReinitialize
        >
            {(formik) => (
                <Form>
                    <TopBar title={i18next.t('charts.chart')} />
                    <Grid container style={{ height: '65vh' }} spacing={4}>
                        <Grid item xs={9}>
                            <Grid
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '66%',
                                }}
                            >
                                <ChartGenerator formikValues={formik.values} template={template} />
                            </Grid>
                            <Grid sx={{ height: '30vh', borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#444' : '#dddddd'}` }}>
                                <EntitiesTableOfTemplate
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
                            xs={3}
                            height="95vh"
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
