import { InfoOutlined } from '@mui/icons-material';
import { Autocomplete, Grid, TextField, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { getFilterFieldReadonly } from '../../../common/inputs/FilterInputs/ReadonlyFilterInput';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { IMongoChart, IChartType, IColumnOrLineMetaData, INUmberMetaData, IPieMetaData, IChart } from '../../../interfaces/charts';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { getChartsByUserId } from '../../../services/chartsService';
import { initialValues } from '../../../utils/charts/getChartAxes';
import { FilterOfGraphToFilterRecord } from '../../Graph/GraphFilterToBackend';

const renderMetaDtaChartByType = (option: IMongoChart) => {
    switch (option.type) {
        case IChartType.Column:
        case IChartType.Line:
            const columnLineData = option.metaData as IColumnOrLineMetaData;

            return (
                <>
                    <Grid item>
                        {`${i18next.t('charts.axis')} x`} : {columnLineData.xAxis.title}
                    </Grid>
                    <Grid item>
                        {`${i18next.t('charts.axis')} y`} : {columnLineData.yAxis.title}
                    </Grid>
                </>
            );
        case IChartType.Pie:
            const pieData = option.metaData as IPieMetaData;
            return (
                <>
                    <Grid item>
                        {i18next.t('charts.dividedBy')}: {pieData.dividedByField}
                    </Grid>
                    <Grid item>
                        {i18next.t('charts.sumBy')} : {pieData.aggregationType.type}
                    </Grid>
                </>
            );
        case IChartType.Number:
            const numberData = option.metaData as INUmberMetaData;
            return (
                <Grid item>
                    {i18next.t('charts.accumulateAccordingTo')} : {numberData.accumulator.type}
                </Grid>
            );
        default:
            return null;
    }
};

const ChartAutoComplete: React.FC<{ formikProps: FormikProps<IChart & { _id?: string }> }> = ({ formikProps }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = entityTemplates.get(formikProps.values.templateId!);

    const [inputValue, setInputValue] = useState('');

    const translateFieldFilter = (filter: string) =>
        FilterOfGraphToFilterRecord(JSON.parse(filter), entityTemplates.get(formikProps.values.templateId!)!);

    const renderFilters = (filter: string) => {
        if (!filter) return <span>{i18next.t('charts.noFilters')}</span>;

        const translatedFilter = translateFieldFilter(filter);
        return Object.values(translatedFilter).map((filter, index) => (
            <span key={index}>
                {getFilterFieldReadonly(filter.filterField, entityTemplate?.properties.properties[filter.selectedProperty!].type!)}
                {index < Object.values(translatedFilter).length - 1 ? ', ' : ''}
            </span>
        ));
    };

    const onChange = (_event: React.SyntheticEvent, chosenChart: IMongoChart | null) => {
        setInputValue('');

        if (chosenChart)
            formikProps.setValues({
                ...chosenChart,
                filter: chosenChart.filter ? translateFieldFilter(chosenChart.filter as unknown as string) : undefined,
            });
        else
            formikProps.setValues((prev) => ({
                ...prev,
                ...initialValues,
                templateId: formikProps.values.templateId,
            }));
    };

    const handleInputChange = (_event: React.SyntheticEvent, newDisplayValue: string) => setInputValue(newDisplayValue);

    const { data: charts, isLoading } = useQuery({
        queryKey: ['getUserCharts', formikProps.values.templateId!, inputValue],
        queryFn: () => getChartsByUserId(formikProps.values.templateId!, inputValue),
        initialData: [],
    });

    return (
        <Autocomplete<IMongoChart>
            value={formikProps.values as IMongoChart}
            inputValue={inputValue}
            onChange={onChange}
            onInputChange={handleInputChange}
            options={charts ?? []}
            loading={isLoading}
            loadingText={i18next.t('templateEntitiesAutocomplete.loading')}
            noOptionsText={i18next.t('templateEntitiesAutocomplete.noOptions')}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, currValue) => option._id === currValue._id}
            filterOptions={(options) => options}
            renderInput={(params) => (
                <TextField
                    {...params}
                    fullWidth
                    label={i18next.t('dashboard.charts.chooseChart')}
                    InputProps={{ ...params.InputProps, endAdornment: params.InputProps.endAdornment }}
                    sx={{ width: '95%' }}
                />
            )}
            renderOption={(props, option) => {
                return (
                    <li {...props}>
                        <Grid container justifyContent="space-between" direction="row" spacing={1}>
                            {charts?.map((chart, index) => (
                                <Grid item key={chart._id} xs={4} overflow="hidden">
                                    <MeltaTooltip placement="right" title={chart.name}>
                                        <Typography color={index > 0 ? '#166BD4' : 'black'} overflow="hidden">
                                            {chart.name}
                                        </Typography>
                                    </MeltaTooltip>
                                </Grid>
                            ))}
                            <Grid item xs={0}>
                                <MeltaTooltip
                                    title={
                                        <Grid container direction="column" spacing={1}>
                                            <Grid item>
                                                {i18next.t('charts.name')} : {option.name}
                                            </Grid>
                                            <Grid item>
                                                {i18next.t('charts.description')} : {option.description}
                                            </Grid>
                                            <Grid item>
                                                {i18next.t('charts.chartType')}: {option.type}
                                            </Grid>
                                            <Grid item>{renderMetaDtaChartByType(option)}</Grid>
                                            <Grid item>
                                                {i18next.t('charts.filters')} : {renderFilters(option.filter as unknown as string)}
                                            </Grid>
                                        </Grid>
                                    }
                                >
                                    <InfoOutlined sx={{ color: '#166BD4' }} />
                                </MeltaTooltip>
                            </Grid>
                        </Grid>
                    </li>
                );
            }}
            // size={size}
        />
    );
};

export { ChartAutoComplete };
