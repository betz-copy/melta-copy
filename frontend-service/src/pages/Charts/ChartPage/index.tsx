import { FilterList, Settings } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Grid, Tab, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import React, { CSSProperties, ReactElement, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import { EntitiesTableOfTemplateRef } from '../../../common/EntitiesTableOfTemplate';
import { ErrorToast } from '../../../common/ErrorToast';
import { LayoutItem } from '../../../common/GridLayout/interface';
import { EntitiesTable } from '../../../common/wizards/loadEntities/EntitiesTable';
import { IBasicChart, IChart } from '../../../interfaces/charts';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { createChart, deleteChart, editChart, getChartById } from '../../../services/chartsService';
import { useUserStore } from '../../../stores/user';
import { chartValidationSchema, initialValues as defaultInitialValues } from '../../../utils/charts/getChartAxes';
import { LocalStorage } from '../../../utils/localStorage';
import { filterBackendToFilterDocument, filterModelToFilterOfGraph } from '../../Graph/GraphFilterToBackend';
import { ChartGenerator } from '../chartGenerator.tsx';
import { ChartSideBar } from './ChartSideBar';
import { FilterSideBar } from './filterSideBar';
import { ChartTopBar } from './TopBar';

const ChartPage: React.FC = () => {
    const { templateId, chartId } = useParams<{ templateId: string; chartId?: string }>();

    const { data: chart } = useQuery(['getChart', chartId], () => getChartById(chartId!), {
        enabled: !!chartId,
    });

    const theme = useTheme();
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);
    const bgColor: CSSProperties['backgroundColor'] = theme.palette.mode === 'dark' ? '#131313' : '#fcfeff';

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const currentUser = useUserStore((state) => state.user);

    const template = entityTemplates.get(templateId as string) as IMongoEntityTemplatePopulated;

    const initialValues = useMemo(() => {
        if (chartId && chart) {
            return {
                ...chart,
                filter: chart.filter ? filterBackendToFilterDocument(JSON.parse(chart.filter), template) : undefined,
            };
        }
        return defaultInitialValues;
    }, [chart, chartId, template]);

    const [_, navigate] = useLocation();

    const [edit, setEdit] = useState(!!chartId);
    const [readonly, setReadonly] = useState(!!chartId);
    const [tabValue, setTabValue] = React.useState('generalDetails');

    const { mutateAsync: createChartMutateAsync } = useMutation(
        (newChart: IBasicChart) =>
            createChart({
                ...newChart,
                templateId,
                filter: filterModelToFilterOfGraph(newChart.filter)[templateId].filter,
                createdBy: currentUser._id,
            } as IBasicChart),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('charts.actions.createdSuccessfully'));
                navigate(`/charts/${templateId}/${data._id}/chart`);
                setReadonly(true);
                setEdit(true);
                const savedLayout: LayoutItem[] = LocalStorage.get(`chartsOrder_${templateId}`) || [];

                const maxY = savedLayout.length ? Math.max(...savedLayout.map((item) => item.y)) : 0;
                const lastRowItems = savedLayout.filter((item) => item.y === maxY);

                const cols = 12;
                const itemWidth = 4;

                const gridMap = Array(cols).fill(false);
                lastRowItems.forEach(({ x, w }) => {
                    for (let i = x; i < x + w; i++) gridMap[i] = true;
                });

                const availableX = gridMap.findIndex((__, x) => x <= cols - itemWidth && gridMap.slice(x, x + itemWidth).every((slot) => !slot));

                const availableY = availableX !== -1 ? maxY : maxY + 12;

                const newItem = {
                    i: data._id,
                    x: availableX !== -1 ? availableX : (savedLayout.length % 3) * 4,
                    y: availableY,
                    w: itemWidth,
                    h: 11,
                };

                LocalStorage.set(`chartsOrder_${templateId}`, [...savedLayout, newItem]);
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
                filter: filterModelToFilterOfGraph(updatedChart.filter)[templateId].filter,
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

    const tabsComponentsNames: string[] = ['generalDetails', 'filterDetails'];

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
                        template={template}
                    />
                    <Grid container flexWrap="nowrap" height="94.5vh" justifyContent="space-evenly">
                        <Grid item container flexDirection="column" justifyContent="space-evenly" flexWrap="nowrap" height="100%" alignItems="center">
                            <Grid item container height="100%" alignItems="center" justifyContent="center">
                                <ChartGenerator
                                    formikValues={formik.values}
                                    template={template}
                                    entityTemplate={template}
                                    entitiesTableRef={entitiesTableRef}
                                />
                            </Grid>
                            <Grid container item width="98%" display="flex" flexDirection="column" justifyContent="center">
                                <Grid item>
                                    <EntitiesTable
                                        rowModelType="infinite"
                                        template={template}
                                        defaultExpanded={false}
                                        title="הנתונים המוצגים "
                                        defaultFilter={
                                            formik.values.filter ? filterModelToFilterOfGraph(formik.values.filter)[templateId].filter : undefined
                                        }
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                        <TabContext value={tabValue}>
                            <Grid
                                item
                                // height="100%"
                                sx={{
                                    // marginTop: 2,
                                    width: '18rem',
                                    padding: '20px',
                                    // height: 1041,
                                    // position: 'relative',
                                    // top: 63,
                                    // borderTopLeftRadius: '30.44px',
                                    // borderBottomLeftRadius: '30.44px',
                                    // paddingTop: '25.37px',
                                    // paddingBottom: '15.22px',
                                    backgroundColor: bgColor,
                                    boxShadow: '2px 2px 10.15px 0px #1E277533',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}
                                direction="column"
                            >
                                <Grid item sx={{ marginTop: '5px', justifyContent: 'space-between', width: '92%' }}>
                                    <TabList
                                        onChange={(_event, newValue) => {
                                            setTabValue(newValue);
                                        }}
                                        variant="standard"
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            borderBottom: '1px solid #E0E0E0',
                                        }}
                                    >
                                        {tabsComponentsNames.map((tabName) => (
                                            <Tab
                                                key={tabName}
                                                iconPosition="start"
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                                        {i18next.t(`charts.${tabName}`)}
                                                    </Box>
                                                }
                                                icon={tabName === 'generalDetails' ? <Settings fontSize="small" /> : <FilterList fontSize="small" />}
                                                value={tabName}
                                                wrapped
                                                sx={{
                                                    minHeight: '44px',
                                                    fontWeight: tabValue === tabName ? '600' : '400',
                                                    fontSize: '14px',
                                                    fontFamily: 'Rubik',
                                                    width: '50%',
                                                    '&:focus': {
                                                        fontWeight: '700',
                                                    },
                                                }}
                                            />
                                        ))}
                                    </TabList>
                                </Grid>
                                <Grid item sx={{ width: '100%' }}>
                                    <TabPanel key="generalDetails" value="generalDetails" sx={{ padding: 0 }}>
                                        <ChartSideBar formik={formik} entityTemplate={template} readonly={readonly} edit={edit} />
                                    </TabPanel>
                                    <TabPanel key="filterDetails" value="filterDetails" sx={{ padding: 0 }}>
                                        <FilterSideBar templateId={template._id} formik={formik} template={template} />
                                    </TabPanel>
                                </Grid>
                            </Grid>
                        </TabContext>
                    </Grid>
                </Form>
            )}
        </Formik>
    );
};

export default ChartPage;
