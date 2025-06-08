import { Grid, Typography } from '@mui/material';
import { FormikProps, getIn } from 'formik';
import i18next from 'i18next';
import { pickBy } from 'lodash';
import React from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useQueryClient } from 'react-query';
import { ReadOnlyTextField } from '../../../common/inputs/FilterInputs/StyledFilterInput';
import { FormikAutoComplete } from '../../../common/inputs/FormikAutoComplete';
import { IAggregation, IAggregationType, IBasicChart, isAggregation, OptionsType } from '../../../interfaces/charts';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { filteredMap } from '../../../utils/filteredMap';

interface AxisInputProps {
    formik: FormikProps<IBasicChart>;
    formikField: string;
    formikValues: IBasicChart;
    label: string;
    entityTemplate: IMongoEntityTemplatePopulated;
    optionsType: OptionsType;
    readonly?: boolean;
    titleFormikField?: string;
}

const AxisInput: React.FC<AxisInputProps> = ({
    formik,
    entityTemplate,
    formikField,
    titleFormikField,
    formikValues,
    label,
    optionsType,
    readonly,
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const fieldValue = getIn(formikValues, formikField);
    const titleValue = titleFormikField ? getIn(formikValues, titleFormikField) : undefined;
    const titleError = titleFormikField && getIn(formik.touched, titleFormikField) && getIn(formik.errors, titleFormikField);

    const entityTemplateFields = Object.keys(pickBy(entityTemplate?.properties.properties, ({ format }) => format !== 'comment'));
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

    const getOptionLabel = (option: string) =>
        Object.values(IAggregationType).includes(option as IAggregationType)
            ? i18next.t(`charts.aggregationTypes.${option}`)
            : entityTemplate?.properties.properties[option]?.title || '';

    return (
        <Grid container direction="column" spacing={2}>
            {titleFormikField && (
                <>
                    <Grid item>
                        <Typography fontSize="14px" fontWeight="14px" color="#9398C2">
                            {label}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <ReadOnlyTextField
                            label={`${i18next.t('charts.title')}`}
                            name={titleFormikField}
                            onChange={(e) => formik.setFieldValue(titleFormikField, e.target.value)}
                            value={titleValue || ''}
                            onBlur={formik.handleBlur}
                            error={Boolean(titleError)}
                            helperText={titleError}
                            fullWidth
                            variant={readonly ? 'standard' : 'outlined'}
                            readOnly={readonly}
                            sx={{ width: 295 }}
                        />
                    </Grid>
                </>
            )}
            <Grid item>
                <FormikAutoComplete
                    formik={formik}
                    formikField={isAggregation(fieldValue) ? `${formikField}.type` : `${formikField}`}
                    options={typeOptions[optionsType]}
                    label={i18next.t('charts.fieldToView')}
                    getOptionLabel={(option) => getOptionLabel(option)}
                    multiple={false}
                    onChange={(newValue) => {
                        if (newValue && typeof newValue === 'string' && aggregationOptions.includes(newValue as IAggregation['type']))
                            formik.setFieldValue(formikField, { type: newValue, byField: '' } as IAggregation);
                        else formik.setFieldValue(formikField, (newValue as string) ?? '');
                    }}
                    readonly={readonly}
                    getOptionDisabled={(option) => {
                        const propertyTemplate = entityTemplate.properties.properties[option];
                        if (propertyTemplate?.format === 'relationshipReference') {
                            const relatedTemplateId = propertyTemplate.relationshipReference?.relatedTemplateId!;
                            return !entityTemplates?.get(relatedTemplateId);
                        }
                        return false;
                    }}
                    popupIcon={<IoIosArrowDown fontSize="Medium" />}
                    style={{ width: 295 }}
                />
            </Grid>
            {isAggregation(fieldValue) && fieldValue?.type !== IAggregationType.CountAll && (
                <Grid item>
                    <FormikAutoComplete
                        formik={formik}
                        formikField={`${formikField}.byField`}
                        options={
                            fieldValue?.type === IAggregationType.CountDistinct
                                ? typeOptions[OptionsType.AllProperties]
                                : typeOptions[OptionsType.NumberProperties]
                        }
                        label={`${i18next.t('charts.byField')}`}
                        getOptionLabel={(option) => getOptionLabel(option)}
                        multiple={false}
                        readonly={readonly}
                        popupIcon={<IoIosArrowDown fontSize="Medium" />}
                        style={{ width: 295 }}
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { AxisInput };
