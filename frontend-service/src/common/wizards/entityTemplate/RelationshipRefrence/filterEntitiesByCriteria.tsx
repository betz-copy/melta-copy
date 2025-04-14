import React, { useMemo } from 'react';
import { useFormikContext, getIn } from 'formik';
import { Grid, TextField, Button, Typography, IconButton, Autocomplete, MenuItem } from '@mui/material';
import { Add, Clear } from '@mui/icons-material';
import i18next from 'i18next';
import { IAGGridFilter, IFilterRelationReference } from '../commonInterfaces';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridTextFilter } from '../../../../utils/agGrid/interfaces';

interface FilterEntitiesByCriteriaProps {
    name: string; // e.g. "properties[0].relationshipReference.filters"
    selectedEntityTemplate: IMongoEntityTemplatePopulated | null;
}

export const FilterEntitiesByCriteria: React.FC<FilterEntitiesByCriteriaProps> = ({ name, selectedEntityTemplate }) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const filters: IFilterRelationReference[] = useMemo(() => getIn(values, name) || [], [values, name]);

    const selectedEntityTemplatePropOptions = useMemo(
        () =>
            Object.entries(selectedEntityTemplate?.properties?.properties || {})
                .filter(
                    ([key, _prop]) =>
                        selectedEntityTemplate?.properties.required.includes(key) &&
                        selectedEntityTemplate?.properties?.properties[key].format !== 'signature',
                )
                .map(([key, prop]) => ({ key, title: prop.title })),
        [selectedEntityTemplate],
    );

    const filterInitialValues: IFilterRelationReference = {
        filterProperty: '',
        filterField: {} as IAGGridFilter,
    };

    const filterTypeOptions = {
        text: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith', 'blank', 'notBlank'],
        number: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange', 'blank', 'notBlank'],
        date: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange', 'blank', 'notBlank'],
    };

    const handleFilterFieldChange = (index: number, updatedFields: Partial<IAGGridFilter>) => {
        const current = filters[index].filterField;

        let newFilterField: IAGGridFilter;

        if (updatedFields.filterType === 'text') {
            newFilterField = {
                ...(current as IAGGridTextFilter),
                ...updatedFields,
                filterType: 'text',
            };
        } else if (updatedFields.filterType === 'number') {
            newFilterField = {
                ...(current as IAGGidNumberFilter),
                ...updatedFields,
                filterType: 'number',
            };
        } else if (updatedFields.filterType === 'date') {
            newFilterField = {
                ...(current as IAGGridDateFilter),
                ...updatedFields,
                filterType: 'date',
            };
        } else {
            throw new Error(`Unsupported filterType: ${updatedFields.filterType}`);
        }

        const updatedFilter: IFilterRelationReference = {
            ...filters[index],
            filterField: newFilterField,
        };

        const newFiltersArray = [...filters];
        newFiltersArray[index] = updatedFilter;

        setFieldValue(name, newFiltersArray);
    };

    const handleAddFilter = () => {
        const updatedFilters = [...filters, filterInitialValues];
        setFieldValue(name, updatedFilters);
    };

    const handleRemoveFilter = (index: number) => {
        const updatedFilters = filters.filter((_, i) => i !== index);
        setFieldValue(name, updatedFilters);
    };

    const initializedFilterField: Record<string, IAGGridFilter> = {
        'date-time': { filterType: 'date', type: 'equals', dateFrom: '', dateTo: '' },
        date: { filterType: 'date', type: 'equals', dateFrom: '', dateTo: '' },
        number: { filterType: 'number', type: 'equals' },
        string: { filterType: 'text', type: 'contains' },
        boolean: { filterType: 'text', type: 'equals' },
    };

    const renderFilterField = (filter: IFilterRelationReference, index: number) => {
        const field = filter.filterField;
        if (!field?.filterType || !field.type) return null;

        const isInRange = field.type === 'inRange';

        switch (field.filterType) {
            case 'text':
                return (
                    <TextField
                        label={i18next.t('wizard.entityTemplate.filterValue')}
                        value={field.filter || ''}
                        onChange={(e) => handleFilterFieldChange(index, { filter: e.target.value })}
                        fullWidth
                    />
                );

            case 'number':
                return isInRange ? (
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <TextField
                                type="number"
                                label={i18next.t('wizard.entityTemplate.from')}
                                value={(field as IAGGidNumberFilter).filter || ''}
                                onChange={(e) => handleFilterFieldChange(index, { filter: Number(e.target.value) })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                type="number"
                                label={i18next.t('wizard.entityTemplate.to')}
                                value={(field as IAGGidNumberFilter).filterTo || ''}
                                onChange={(e) => handleFilterFieldChange(index, { filterTo: Number(e.target.value) })}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                ) : (
                    <TextField
                        type="number"
                        label={i18next.t('wizard.entityTemplate.filterValue')}
                        value={(field as IAGGidNumberFilter).filter || ''}
                        onChange={(e) => handleFilterFieldChange(index, { filter: Number(e.target.value) })}
                        fullWidth
                    />
                );

            case 'date':
                return isInRange ? (
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <TextField
                                type="date"
                                label={i18next.t('wizard.entityTemplate.dateFrom')}
                                value={field.dateFrom || ''}
                                onChange={(e) => handleFilterFieldChange(index, { dateFrom: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                type="date"
                                label={i18next.t('wizard.entityTemplate.dateTo')}
                                value={field.dateTo || ''}
                                onChange={(e) => handleFilterFieldChange(index, { dateTo: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                ) : (
                    <TextField
                        type="date"
                        label={i18next.t('wizard.entityTemplate.date')}
                        value={field.dateFrom || ''}
                        onChange={(e) => handleFilterFieldChange(index, { dateFrom: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                );

            default:
                return null;
        }
    };

    return (
        <Grid container direction="column" gap="0.8rem">
            {selectedEntityTemplate && (
                <Grid container direction="column">
                    {filters.map((filter, index) => {
                        const isNewProperty = !filter.filterProperty;
                        const isDisabled = !isNewProperty;

                        const getSelectedFilterPropTitle =
                            selectedEntityTemplate &&
                            filter.filterProperty !== '' &&
                            selectedEntityTemplate.properties?.properties?.[filter.filterProperty]
                                ? {
                                      key: filter.filterProperty,
                                      title: selectedEntityTemplate.properties.properties[filter.filterProperty].title,
                                  }
                                : null;

                        const filterType = filter.filterField?.filterType;
                        const selectedType = filter.filterField?.type;

                        return (
                            <Grid container wrap="nowrap" direction="row" alignItems="flex-start" key={filter.filterProperty || index} spacing={1}>
                                <Grid item xs={3}>
                                    <Autocomplete
                                        id={`autocomplete-${index}`}
                                        options={selectedEntityTemplatePropOptions}
                                        onChange={(_e, selectedField) => {
                                            const selectedKey = selectedField?.key || '';
                                            const selectedProp = selectedEntityTemplate?.properties.properties[selectedKey];
                                            const { format, type } = selectedProp || {};
                                            const newFilterField =
                                                (format && initializedFilterField[format]) || (type && initializedFilterField[type]);

                                            const newFiltersArray = [...filters];
                                            newFiltersArray[index] = {
                                                filterProperty: selectedKey,
                                                filterField: newFilterField,
                                            };

                                            setFieldValue(name, newFiltersArray);
                                        }}
                                        isOptionEqualToValue={(option, val) => option.key === val.key}
                                        sx={{ marginRight: '5px' }}
                                        value={getSelectedFilterPropTitle}
                                        disabled={isDisabled}
                                        getOptionLabel={(option) => option.title || ''}
                                        fullWidth
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                sx={{ '& .MuiInputBase-root': { borderRadius: '10px' } }}
                                                variant="outlined"
                                                label={i18next.t('wizard.entityTemplate.filterField')}
                                            />
                                        )}
                                    />
                                </Grid>

                                {filterType && (
                                    <Grid item xs={3}>
                                        <TextField
                                            select
                                            fullWidth
                                            value={selectedType || ''}
                                            onChange={(e) =>
                                                handleFilterFieldChange(index, {
                                                    type: e.target.value as IAGGridFilter['type'],
                                                })
                                            }
                                            label={i18next.t('wizard.entityTemplate.filterType')}
                                        >
                                            {filterTypeOptions[filterType].map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                )}

                                <Grid item xs={4}>
                                    {renderFilterField(filter, index)}
                                </Grid>

                                <Grid item>
                                    <IconButton onClick={() => handleRemoveFilter(index)}>
                                        <Clear />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        );
                    })}

                    <Button type="button" variant="text" style={{ alignSelf: 'start' }} onClick={handleAddFilter}>
                        <Typography style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <Add />
                            {i18next.t('wizard.entityTemplate.addRelationFilter')}
                        </Typography>
                    </Button>
                </Grid>
            )}
        </Grid>
    );
};
