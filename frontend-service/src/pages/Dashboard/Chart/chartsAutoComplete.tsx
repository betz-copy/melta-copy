import { InfoOutlined } from '@mui/icons-material';
import { Autocomplete, Grid, TextField, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { IChart } from '../../../interfaces/charts';
import { getChartsByUserId } from '../../../services/chartsService';
import { initialValues } from '../../../utils/charts/getChartAxes';

const ChartAutoComplete: React.FC<{ formikProps: FormikProps<IChart> }> = ({ formikProps }) => {
    const [inputValue, setInputValue] = useState('');

    const onChange = (_event: React.SyntheticEvent, chosenChart: IChart | null) => {
        setInputValue('');
        if (chosenChart) formikProps.setValues(chosenChart);
        else formikProps.setValues({ ...initialValues, templateId: formikProps.values.templateId });
    };

    const handleInputChange = (_event: React.SyntheticEvent, newDisplayValue: string) => setInputValue(newDisplayValue);

    const { data: charts, isLoading } = useQuery({
        queryKey: ['getUserCharts', formikProps.values.templateId!, inputValue],
        queryFn: () => getChartsByUserId(formikProps.values.templateId!, inputValue),
        initialData: [],
    });

    return (
        <Autocomplete
            value={formikProps.values}
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
                    // helperText={helperText}
                    label="בחירת תרשים"
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
                                        // todo: readonly competent
                                        <Grid container direction="column" spacing={1}>
                                            <Grid item>שם : {option.name}</Grid>
                                            <Grid item>{option.description}</Grid>
                                            <Grid item>סוג : {option.type}</Grid>
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
