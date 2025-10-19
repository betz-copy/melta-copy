import { Close } from '@mui/icons-material';
import { Autocomplete, Divider, Grid, IconButton, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import { FormikErrors, FormikProps, FormikTouched, getIn } from 'formik';
import i18next from 'i18next';
import React, { useMemo, useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useQueryClient } from 'react-query';
import { handleRemoveFilter, initializedFilterField, renderFilterInput } from '../../../common/FilterComponent';
import { StyledFilterInput } from '../../../common/inputs/FilterInputs/StyledFilterInput';
import { IFilterTemplate } from '../../../common/wizards/entityTemplate/commonInterfaces';
import { ChartForm, TableForm, ViewMode } from '../../../interfaces/dashboard';
import { IEntitySingleProperty, IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getRelevantEntityTemplate } from '../../Dashboard/DashboardItemDetails/Chart/BodyComponent';

const FilterCompetent = <T extends TableForm | ChartForm>({
    formik: { values, errors, touched, setFieldValue },
    viewMode,
}: {
    formik: FormikProps<T>;
    viewMode: ViewMode;
}) => {
    const queryClient = useQueryClient();
    const theme = useTheme();

    const filters: IFilterTemplate[] = useMemo(() => getIn(values, 'filter') || [], [values]);
    const readonly = viewMode === ViewMode.ReadOnly;

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = getRelevantEntityTemplate(entityTemplates, values.templateId, values.childTemplateId);
    const [inputValue, setInputValue] = useState<string>('');

    const properties = entityTemplate?.properties.properties;
    const notIncludedFormats = ['fileId', 'signature', 'location', 'comment'];
    const filterProperties = Object.entries(properties ?? {})
        .filter(([_, value]) => !notIncludedFormats.includes(value.format ?? '') && value.items?.format !== 'fileId')
        .map(([key]) => key);

    const handleFilterChange = (newFiltersArray: IFilterTemplate[]) => setFieldValue('filter', newFiltersArray);

    let backgroundColor = '#EBEFFA33';
    if (readonly) backgroundColor = darkMode ? '#121212' : 'white';
    else backgroundColor = darkMode ? '#4a4a5033' : '#EBEFFA33';

    return (
        <Box display="flex" flexDirection="column" style={{ paddingLeft: '10px' }}>
            <Box zIndex="100">
                {filters?.map((filter, index) => {
                    const filterType = filter.filterField?.filterType;
                    const selectedProperty = entityTemplate?.properties.properties[filter.filterProperty] ?? ({} as IEntitySingleProperty);

                    const fieldBase = `filter[${index}]`; // e.g., 'relationshipReference.filters[2]'

                    const filterError: FormikErrors<IFilterTemplate> = getIn(errors, `${fieldBase}`);
                    const filterTouched: FormikTouched<IFilterTemplate> = getIn(touched, `${fieldBase}`);

                    return (
                        <Grid key={fieldBase}>
                            <Grid sx={{ borderRadius: '10px', backgroundColor }}>
                                <Grid
                                    sx={{
                                        height: !readonly ? '90px' : undefined,
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    {!readonly && (
                                        <Autocomplete
                                            id={`autocomplete-${index}`}
                                            popupIcon={<IoIosArrowDown size="15px" />}
                                            clearIcon={<Close sx={{ fontSize: '16px' }} />}
                                            size="small"
                                            options={filterProperties}
                                            onChange={(_e, selectedField) => {
                                                const selectedKey = selectedField || '';
                                                const selectedProp = entityTemplate?.properties.properties[selectedKey];
                                                const { format, type, enum: enumValues } = selectedProp || {};
                                                const newFilterField =
                                                    (enumValues && initializedFilterField['array']) ||
                                                    (format && initializedFilterField[format]) ||
                                                    (type && initializedFilterField[type]);

                                                const newFiltersArray = [...filters];
                                                newFiltersArray[index] = {
                                                    filterProperty: selectedKey,
                                                    filterField: newFilterField,
                                                };

                                                setFieldValue('filter', newFiltersArray);
                                            }}
                                            sx={{ width: '90%', marginLeft: '5%' }}
                                            value={filter.filterProperty}
                                            getOptionLabel={(option) =>
                                                entityTemplate?.properties.properties[option]
                                                    ? entityTemplate.properties.properties[option].title
                                                    : ''
                                            }
                                            isOptionEqualToValue={(option, value) => option === value}
                                            getOptionDisabled={(option) => {
                                                const propertyTemplate = entityTemplate?.properties.properties[option];

                                                if (propertyTemplate?.format === 'relationshipReference') {
                                                    const relatedTemplateId = propertyTemplate.relationshipReference?.relatedTemplateId!;
                                                    return !entityTemplates?.get(relatedTemplateId);
                                                }
                                                return false;
                                            }}
                                            renderInput={(params) => (
                                                <StyledFilterInput
                                                    {...params}
                                                    variant="outlined"
                                                    error={Boolean(filterTouched && filterError?.filterProperty)}
                                                    helperText={filterTouched ? filterError?.filterProperty : ''}
                                                    sx={{ borderRadius: '5px' }}
                                                    label={i18next.t('charts.field')}
                                                />
                                            )}
                                        />
                                    )}
                                    {!readonly && (
                                        <IconButton onClick={() => handleRemoveFilter(filters, index, handleFilterChange)}>
                                            <Close fontSize="small" sx={{ color: theme.palette.primary.main }} />
                                        </IconButton>
                                    )}
                                </Grid>

                                {filterType && (
                                    <Grid container justifyContent="center">
                                        <Grid style={{ width: '90%', paddingBottom: '10px' }}>
                                            {renderFilterInput(
                                                filters,
                                                filter,
                                                index,
                                                selectedProperty,
                                                handleFilterChange,
                                                filterTouched?.filterField,
                                                filterError?.filterField,
                                                undefined,
                                                viewMode,
                                                { value: inputValue, set: setInputValue },
                                            )}
                                        </Grid>
                                    </Grid>
                                )}
                            </Grid>
                            {readonly ? (
                                <Box sx={{ height: '3px', width: '100%', my: 1 }} />
                            ) : (
                                <Divider sx={{ width: '100%', my: 1, borderColor: '#EBEFFA' }} />
                            )}
                        </Grid>
                    );
                })}
            </Box>
        </Box>
    );
};

export default FilterCompetent;
