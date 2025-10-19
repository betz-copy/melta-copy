import { Grid, Typography } from '@mui/material';
import { FormikProps, getIn } from 'formik';
import i18next from 'i18next';
import { pickBy } from 'lodash';
import React from 'react';
import { useQueryClient } from 'react-query';
import { FormikAutoComplete } from '../../../common/inputs/FormikAutoComplete';
import { ViewModeTextField } from '../../../common/inputs/ViewModeTextField';
import { IAggregation, IAggregationType, isAggregation, OptionsType } from '../../../interfaces/charts';
import { ChartForm } from '../../../interfaces/dashboard';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { filteredMap } from '../../../utils/filteredMap';

interface AxisInputProps {
    formik: FormikProps<ChartForm>;
    formikField: string;
    label: string;
    entityTemplate: IMongoEntityTemplatePopulated;
    optionsType: OptionsType;
    readonly?: boolean;
    titleFormikField?: string;
}

const AxisInput: React.FC<AxisInputProps> = ({ formik, entityTemplate, formikField, titleFormikField, label, optionsType, readonly }) => {
    const { values, setFieldValue, touched, errors, handleBlur } = formik;
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const fieldValue = getIn(values, formikField);
    const titleValue = titleFormikField ? getIn(values, titleFormikField) : undefined;
    const titleError = titleFormikField && getIn(touched, titleFormikField) && getIn(errors, titleFormikField);

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
                    <Grid>
                        <Typography fontSize="14px" fontWeight="14px" color="#9398C2">
                            {label}
                        </Typography>
                    </Grid>
                    <Grid>
                        <ViewModeTextField
                            label={`${i18next.t('charts.title')}`}
                            name={titleFormikField}
                            onChange={(e) => setFieldValue(titleFormikField, e.target.value)}
                            value={titleValue || ''}
                            onBlur={handleBlur}
                            error={Boolean(titleError)}
                            helperText={titleError}
                            fullWidth
                            readOnly={readonly}
                            sx={{ width: 295 }}
                        />
                    </Grid>
                </>
            )}
            <Grid>
                <FormikAutoComplete
                    formik={formik}
                    formikField={isAggregation(fieldValue) ? `${formikField}.type` : `${formikField}`}
                    options={typeOptions[optionsType]}
                    label={label}
                    getOptionLabel={(option) => getOptionLabel(option)}
                    multiple={false}
                    onChange={(newValue) => {
                        if (newValue && typeof newValue === 'string' && aggregationOptions.includes(newValue as IAggregation['type']))
                            setFieldValue(formikField, { type: newValue, byField: '' } as IAggregation);
                        else setFieldValue(formikField, (newValue as string) ?? '');
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
                    style={{ width: 295 }}
                />
            </Grid>
            {isAggregation(fieldValue) && fieldValue?.type !== IAggregationType.CountAll && (
                <Grid>
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
                        style={{ width: 295 }}
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { AxisInput };
