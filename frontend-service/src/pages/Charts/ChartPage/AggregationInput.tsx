import { Grid, TextField, Typography } from '@mui/material';
import { FormikProps, getIn } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { IAggregation, IAggregationType, IBasicChart, isAggregation, OptionsType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { filteredMap } from '../../../utils/filteredMap';
import { FormikAutoComplete } from '../../../common/inputs/FormikAutoComplete';

interface AxisInputProps {
    formik: FormikProps<IBasicChart>;
    formikField: string;
    formikValues: IBasicChart;
    label: string;
    entityTemplate: IMongoEntityTemplatePopulated;
    optionsType: OptionsType;
    titleFormikField?: string;
    byFieldOptionsType?: OptionsType;
}

const AxisInput: React.FC<AxisInputProps> = ({
    formik,
    entityTemplate,
    formikField,
    titleFormikField,
    formikValues,
    label,
    optionsType,
    byFieldOptionsType,
}) => {
    const fieldValue = getIn(formikValues, formikField);
    const titleValue = titleFormikField ? getIn(formikValues, titleFormikField) : undefined;
    const titleError = titleFormikField && getIn(formik.touched, titleFormikField) && getIn(formik.errors, titleFormikField);

    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);
    const entityTemplateNumberFields = filteredMap(Object.entries(entityTemplate.properties.properties), ([property, value]) => ({
        include: value.type === 'number' && !value.serialStarter,
        value: property,
    }));

    const aggregationOptions: IAggregation['type'][] = Object.values(IAggregationType);

    const typeOptions: Record<OptionsType, string[]> = {
        [OptionsType.Aggregation]: aggregationOptions,
        [OptionsType.AllProperties]: entityTemplateFields,
        [OptionsType.NumberProperties]: entityTemplateNumberFields,
        [OptionsType.AggregationAndAllProperties]: [...entityTemplateFields, ...aggregationOptions],
        [OptionsType.AggregationAndNumberProperties]: [...entityTemplateNumberFields, ...aggregationOptions],
    };

    return (
        <Grid container direction="column" spacing={2}>
            {titleFormikField && (
                <>
                    <Grid item>
                        <Typography variant="subtitle2">{label}</Typography>
                    </Grid>
                    <Grid item>
                        <TextField
                            label={`${i18next.t('charts.title')}`}
                            name={titleFormikField}
                            onChange={(e) => formik.setFieldValue(titleFormikField, e.target.value)}
                            value={titleValue || ''}
                            onBlur={formik.handleBlur}
                            error={Boolean(titleError)}
                            helperText={titleError}
                            fullWidth
                            margin="normal"
                            sx={{ width: '90%' }}
                        />
                    </Grid>
                </>
            )}
            <Grid item sx={{ marginTop: titleFormikField ? undefined : 2 }}>
                <FormikAutoComplete
                    formik={formik}
                    formikField={isAggregation(fieldValue) ? `${formikField}.type` : `${formikField}`}
                    options={typeOptions[optionsType]}
                    label={label}
                    multiple={false}
                    onChange={(newValue) => {
                        if (newValue && typeof newValue === 'string' && aggregationOptions.includes(newValue as IAggregation['type']))
                            formik.setFieldValue(`${formikField}`, { type: newValue, byField: '' } as IAggregation);
                        else formik.setFieldValue(`${formikField}`, newValue as string);
                    }}
                    style={{ width: '90%' }}
                />
            </Grid>
            {isAggregation(fieldValue) && fieldValue?.type !== 'countAll' && (
                <Grid item>
                    <FormikAutoComplete
                        formik={formik}
                        formikField={`${formikField}.byField`}
                        options={byFieldOptionsType ? typeOptions[byFieldOptionsType] : []}
                        label={`${i18next.t('charts.byField')}`}
                        multiple={false}
                        style={{
                            width: '90%',
                        }}
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { AxisInput };
