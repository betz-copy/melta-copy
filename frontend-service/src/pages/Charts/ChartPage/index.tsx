import { ArrowForwardIosOutlined, FilterList, Settings } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Button, CircularProgress, Grid, Tab, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import { ErrorToast } from '../../../common/ErrorToast';
import { IBasicChart, IChart } from '../../../interfaces/charts';
import { IGraphFilterBodyBatch } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { createChart, deleteChart, editChart, getChartById } from '../../../services/chartsService';
import { useUserStore } from '../../../stores/user';
import { generateNewItemSizes } from '../../../utils/charts/defaultChartSizes';
import { chartValidationSchema, initialValues as defaultInitialValues } from '../../../utils/charts/getChartAxes';
import { markTouched } from '../../../utils/charts/markTouchedRecursive';
import { FilterOfGraphToFilterRecord, filterModelToFilterOfGraph } from '../../Graph/GraphFilterToBackend';
import { ChartGenerator } from '../chartGenerator.tsx';
import { ChartSideBar } from './ChartSideBar';
import { FilterSideBar } from './filterSideBar';
import { ChartTopBar } from './TopBar';
import { EntitiesTable } from '../../../common/wizards/excel/excelSteps/EntitiesTable';

const ChartPage: React.FC = () => {
    const { templateId, chartId } = useParams<{ templateId: string; chartId?: string }>();
    const [_, navigate] = useLocation();
    const queryClient = useQueryClient();
    const { data: chart, isLoading } = useQuery(['getChart', chartId], () => getChartById(chartId!), {
        enabled: !!chartId,
    });

    const theme = useTheme();
    const bgColor: CSSProperties['backgroundColor'] = theme.palette.mode === 'dark' ? '#131313' : '#fcfeff';
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const currentUser = useUserStore((state) => state.user);
    const template = entityTemplates.get(templateId as string) as IMongoEntityTemplatePopulated;
    const initialValues = chartId && chart ? chart : defaultInitialValues;
    const sideBarTabs = [
        { name: 'generalDetails', labelKey: 'generalDetails', icon: <Settings fontSize="small" /> },
        { name: 'filterDetails', labelKey: 'filterDetails', icon: <FilterList fontSize="small" /> },
    ];

    const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>({});
    const [filters, setFilters] = useState<number[]>([]);
    const [edit, setEdit] = useState(!!chartId);
    const [readonly, setReadonly] = useState(!!chartId);
    const [tabValue, setTabValue] = useState('generalDetails');

    useEffect(() => {
        if (chart?.filter) {
            const parsedFilter = JSON.parse(chart.filter);
            const formattedFilter = FilterOfGraphToFilterRecord(parsedFilter, template);
            setFilterRecord(formattedFilter);
            setFilters(Object.keys(formattedFilter).map(Number));
        }
    }, [chart, template]);

    const memoizedFilter = useMemo(
        () => (filterRecord && Object.keys(filterRecord).length > 0 ? filterModelToFilterOfGraph(filterRecord)[templateId].filter : undefined),
        [filterRecord, templateId],
    );

    const { mutateAsync: createChartMutateAsync, isLoading: isCreateLoading } = useMutation(
        (newChart: IBasicChart) =>
            createChart({
                ...newChart,
                templateId,
                filter: Object.keys(filterRecord).length > 0 ? filterModelToFilterOfGraph(filterRecord)[templateId].filter : undefined,
                createdBy: currentUser._id,
            } as IBasicChart),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('charts.actions.createdSuccessfully'));
                navigate(`/charts/${templateId}/${data._id}/chart`);
                setReadonly(true);
                setEdit(true);
                generateNewItemSizes(templateId, data._id);
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToCreate')} />);
            },
        },
    );

    const { mutateAsync: editChartMutateAsync, isLoading: isUpdateLoading } = useMutation(
        (updatedChart: IBasicChart) =>
            editChart(chartId!, {
                ...updatedChart,
                _id: chartId,
                createdAt: (initialValues as IChart).createdAt,
                updatedAt: (initialValues as IChart).updatedAt,
                filter: Object.keys(filterRecord).length > 0 ? filterModelToFilterOfGraph(filterRecord)[templateId].filter : undefined,
            } as IChart),
        {
            onSuccess: () => {
                toast.success(i18next.t('charts.actions.editedSuccessfully'));
                setReadonly(true);
                queryClient.invalidateQueries(['getChart', chartId]);
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

    if (isLoading) return <CircularProgress />;

    return (
        <Formik<IBasicChart>
            initialValues={initialValues}
            onSubmit={async (values, formikHelpers) => {
                if (edit) await editChartMutateAsync(values);
                else await createChartMutateAsync(values);
                formikHelpers.setSubmitting(false);
            }}
            validationSchema={chartValidationSchema}
            enableReinitialize
        >
            {(formik) => (
                <Form>
                    <ChartTopBar
                        edit={edit}
                        isLoading={isCreateLoading || isUpdateLoading}
                        onDelete={() => deleteChartMutateAsync(chartId as string)}
                        readonly={readonly}
                        setReadOnly={setReadonly}
                        formik={formik}
                        template={template}
                        filterRecord={filterRecord}
                        setFilterRecord={setFilterRecord}
                        setFilters={setFilters}
                    />
                    <Grid container flexWrap="nowrap" height="94.5vh" justifyContent="space-evenly">
                        <Grid container item flexDirection="column" flexWrap="nowrap" height="100%" alignItems="center">
                            <Grid item alignSelf="flex-start">
                                <Button
                                    variant="text"
                                    sx={{ fontWeight: '400', fontSize: '18px', top: '30px', left: '30px' }}
                                    startIcon={<ArrowForwardIosOutlined sx={{ width: '12px', height: '12px' }} />}
                                    onClick={() => navigate(`/charts/${templateId}`)}
                                >
                                    {i18next.t('charts.actions.back')}
                                </Button>
                            </Grid>
                            <Grid container item height="100%" alignItems="center" justifyContent="center">
                                <ChartGenerator
                                    formikValues={formik.values}
                                    template={template}
                                    entityTemplate={template}
                                    filterRecord={filterRecord}
                                />
                            </Grid>
                            <Grid item width="98%">
                                <EntitiesTable
                                    rowModelType="infinite"
                                    template={template}
                                    defaultExpanded={false}
                                    title={i18next.t('charts.viewData')}
                                    defaultFilter={memoizedFilter}
                                    infiniteModeWithoutExpand
                                    disableFilter
                                    overrideSx={{
                                        '&.MuiPaper-root': {
                                            boxShadow: '0px -2px 10.15px 0px #1E277533',
                                            borderTopLeftRadius: '13px',
                                            borderTopRightRadius: '13px',
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                        <TabContext value={tabValue}>
                            <Grid
                                item
                                sx={{
                                    width: 375,
                                    backgroundColor: bgColor,
                                    boxShadow: '2px 2px 10.15px 0px #1E277533',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}
                            >
                                <Grid item sx={{ marginTop: '5px', justifyContent: 'space-between', width: '92%' }}>
                                    <TabList
                                        onChange={async (_event, newValue) => {
                                            if (!readonly) {
                                                const allTouched = markTouched(formik.values);
                                                await formik.setTouched(allTouched);

                                                const errors = await formik.validateForm();

                                                if (Object.keys(errors).length === 0) setTabValue(newValue);
                                            } else setTabValue(newValue);
                                        }}
                                        variant="standard"
                                        sx={{
                                            borderBottom: '1px solid #E0E0E0',
                                        }}
                                    >
                                        {sideBarTabs.map(({ name, icon, labelKey }) => (
                                            <Tab
                                                key={name}
                                                iconPosition="start"
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                                        {i18next.t(`charts.${labelKey}`)}
                                                    </Box>
                                                }
                                                icon={icon}
                                                value={name}
                                                wrapped
                                                sx={{
                                                    minHeight: '44px',
                                                    fontWeight: tabValue === name ? '600' : '400',
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
                                <Grid item sx={{ width: '100%', padding: '20px' }}>
                                    {sideBarTabs.map(({ name }) => (
                                        <TabPanel key={name} value={name} sx={{ padding: 0 }}>
                                            {name === 'generalDetails' ? (
                                                <ChartSideBar formik={formik} entityTemplate={template} readonly={readonly} edit={edit} />
                                            ) : (
                                                <FilterSideBar
                                                    templateId={template._id}
                                                    filterRecord={filterRecord}
                                                    setFilterRecord={setFilterRecord}
                                                    filters={filters}
                                                    setFilters={setFilters}
                                                    readonly={readonly}
                                                />
                                            )}
                                        </TabPanel>
                                    ))}
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
