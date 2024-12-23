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
import { IBasicChart, IChartType } from '../../../interfaces/charts';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ChartGenerator } from '../chartsType';
import { ChartSideBar } from './ChartSideBar';

const data = {
    xAxis: 'name',
    yAxis: 'score',
    aggregation: 'average',
    data: [
        {
            x: 'Duis commodo voluptate laboris ut',
            y: 32460000,
        },
        {
            x: 'Excepteur incididunt',
            y: 14280000,
        },
        {
            x: 'Lorem velit dolore esse',
            y: 15060000,
        },
        {
            x: 'ad ex cupidatat',
            y: null,
        },
        {
            x: 'ad sint veniam',
            y: 15240000.000000015,
        },
        {
            x: 'aliqua',
            y: -17180000,
        },
        {
            x: 'amet commodo dolore',
            y: -58400000,
        },
        {
            x: 'amet commodo pariatur qui dolor',
            y: -71220000,
        },
        {
            x: 'amet ut',
            y: -6960000,
        },
        {
            x: 'aute',
            y: -50280000,
        },
        {
            x: 'cillum eiusmod aliqua proident',
            y: -25760000,
        },
        {
            x: 'ea pariatur aute',
            y: 13999999.999999985,
        },
        {
            x: 'elit voluptate Lorem velit',
            y: 77200000,
        },
        {
            x: 'enim dolor commodo ullamco',
            y: -60700000,
        },
        {
            x: 'enim ut cupidatat ut laborum',
            y: -87100000,
        },
        {
            x: 'est',
            y: 22220000,
        },
        {
            x: 'est nulla',
            y: null,
        },
        {
            x: 'et minim',
            y: 45400000,
        },
        {
            x: 'eu ad esse amet',
            y: -89260000,
        },
        {
            x: 'ex',
            y: 98320000,
        },
        {
            x: 'exercitation tempor est labore Duis',
            y: 16360000,
        },
        {
            x: 'in',
            y: -33460000,
        },
        {
            x: 'in amet consequat',
            y: 16520000,
        },
        {
            x: 'in anim est',
            y: -460000,
        },
        {
            x: 'in esse',
            y: -87800000,
        },
        {
            x: 'incididunt et',
            y: -40220000,
        },
        {
            x: 'ipsum fugiat Excepteur',
            y: 28460000,
        },
        {
            x: 'irure',
            y: -93780000,
        },
        {
            x: 'laboris quis',
            y: -90780000,
        },
        {
            x: 'minim eiusmod',
            y: 80700000,
        },
        {
            x: 'nisi veniam esse laborum sint',
            y: 97280000,
        },
        {
            x: 'non',
            y: 27906666.666666664,
        },
        {
            x: 'non enim',
            y: -32020000,
        },
        {
            x: 'nulla eu',
            y: -46700000,
        },
        {
            x: 'occaecat',
            y: 59120000,
        },
        {
            x: 'occaecat mollit consequat proident',
            y: -24060000,
        },
        {
            x: 'occaecat voluptate sunt nisi',
            y: 57760000,
        },
        {
            x: 'pariatur',
            y: 89740000,
        },
        {
            x: 'proident commodo in',
            y: 74460000,
        },
        {
            x: 'quis Ut',
            y: -3080000,
        },
        {
            x: 'sint labore',
            y: -38620000,
        },
        {
            x: 'sit eiusmod incididunt aute elit',
            y: null,
        },
        {
            x: 'sunt qui labore et',
            y: null,
        },
        {
            x: 'tempor mollit',
            y: 50240000,
        },
        {
            x: 'voluptate',
            y: -8520000,
        },
        {
            x: null,
            y: -34813333.333333336,
        },
    ],
};

export const chartValidationSchema = Yup.object({
    name: Yup.string().min(2, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    description: Yup.string().min(2, i18next.t('validation.variableName')),
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
                                <ChartGenerator res={data} formikValues={formik.values} template={template} />
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
                            <button type="submit">dff</button>
                        </Grid>
                    </Grid>
                </Form>
            )}
        </Formik>
    );
};

export default ChartPage;
