import { InfoOutlined } from '@mui/icons-material';
import { Autocomplete, Grid, TextField, Typography } from '@mui/material';
import { IAggregation, IChartType, IColumnOrLineMetaData, IMongoChart, INUmberMetaData, IPieMetaData } from '@packages/chart';
import { IEntityTemplateMap } from '@packages/entity-template';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { getFilterFieldReadonly } from '../../../../common/inputs/FilterInputs/ReadonlyFilterInput';
import MeltaTooltip from '../../../../common/MeltaDesigns/MeltaTooltip';
import { FilterModelToFilterRecord } from '../../../../common/wizards/entityTemplate/RelationshipReference/TemplateFilterToBackend';
import { ChartForm } from '../../../../interfaces/dashboard';
import { getChartsByUserId } from '../../../../services/chartsService';
import { initialValues } from '../../../../utils/charts/getChartAxes';

const renderMetaDtaChartByType = (option: IMongoChart) => {
    switch (option.type) {
        case IChartType.Column:
        case IChartType.Line: {
            const columnLineData = option.metaData as IColumnOrLineMetaData;

            return (
                <>
                    <Grid>
                        {i18next.t('charts.xAxis')} : {columnLineData.xAxis.title}
                    </Grid>
                    <Grid>
                        {i18next.t('charts.yAxis')} : {columnLineData.yAxis.title}
                    </Grid>
                </>
            );
        }
        case IChartType.Pie: {
            const pieData = option.metaData as IPieMetaData;
            return (
                <>
                    <Grid>
                        {i18next.t('charts.dividedBy')}: {pieData.dividedByField}
                    </Grid>
                    <Grid>
                        {i18next.t('charts.sumBy')} : {pieData.aggregationType.type}
                    </Grid>
                </>
            );
        }
        case IChartType.Number: {
            const numberData = option.metaData as INUmberMetaData;
            const { type } = numberData.accumulator as IAggregation;
            return (
                <Grid>
                    {i18next.t('charts.accumulateAccordingTo')} : {type}
                </Grid>
            );
        }
        default:
            return null;
    }
};

const ChartAutoComplete: React.FC<{ formikProps: FormikProps<ChartForm> }> = ({ formikProps: { values, setValues } }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = entityTemplates.get(values.templateId!);

    const [inputValue, setInputValue] = useState('');

    const translateFieldFilter = (filter: string) => FilterModelToFilterRecord(JSON.parse(filter), entityTemplate?._id!, queryClient);

    const renderFilters = (filter: string | undefined) => {
        if (!filter) return <span>{i18next.t('charts.noFilters')}</span>;

        const translatedFilter = translateFieldFilter(filter);
        return Object.values(translatedFilter).map((filter, index) => (
            <span key={index}>
                {getFilterFieldReadonly(filter.filterField, entityTemplate?.properties.properties[filter.filterProperty!].type!)}
                {index < Object.values(translatedFilter).length - 1 ? ', ' : ''}
            </span>
        ));
    };

    const onChange = (_event: React.SyntheticEvent, chosenChart: IMongoChart | null) => {
        setInputValue('');

        if (chosenChart)
            setValues({
                ...chosenChart,
                filter: chosenChart.filter ? translateFieldFilter(chosenChart.filter) : undefined,
            });
        else
            setValues((prev) => ({
                ...prev,
                ...initialValues,
                filter: undefined,
                templateId: values.templateId,
            }));
    };

    const handleInputChange = (_event: React.SyntheticEvent, newDisplayValue: string) => setInputValue(newDisplayValue);

    const { data: charts, isLoading } = useQuery({
        queryKey: ['getUserCharts', values.templateId!, inputValue],
        queryFn: () => getChartsByUserId(values.templateId, inputValue, values.childTemplateId),
        initialData: [],
    });

    return (
        <Autocomplete<IMongoChart>
            value={values as IMongoChart}
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
                    slotProps={{ input: { ...params.InputProps, endAdornment: params.InputProps.endAdornment } }}
                    sx={{ width: '95%' }}
                />
            )}
            renderOption={(props, option) => {
                return (
                    <li {...props}>
                        <Grid container justifyContent="space-between" direction="row" spacing={1}>
                            <Grid key={option._id} size={{ xs: 4 }} overflow="hidden">
                                <MeltaTooltip placement="right" title={option.name}>
                                    <Typography overflow="hidden">{option.name}</Typography>
                                </MeltaTooltip>
                            </Grid>
                            <Grid size={{ xs: 0 }}>
                                <MeltaTooltip
                                    title={
                                        <Grid container direction="column" spacing={1}>
                                            <Grid>
                                                {i18next.t('charts.name')} : {option.name}
                                            </Grid>
                                            {option.description && (
                                                <Grid>
                                                    {i18next.t('charts.description')} : {option.description}
                                                </Grid>
                                            )}
                                            <Grid>
                                                {i18next.t('charts.chartType')}: {i18next.t(`charts.types.${option.type}Chart`)}
                                            </Grid>
                                            <Grid>{renderMetaDtaChartByType(option)}</Grid>
                                            <Grid>
                                                {i18next.t('charts.filters')} : {renderFilters(option.filter)}
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
        />
    );
};

export default ChartAutoComplete;
