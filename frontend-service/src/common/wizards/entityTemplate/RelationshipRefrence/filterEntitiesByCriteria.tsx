import React from 'react';
import { useFormikContext, getIn } from 'formik';
import { Grid, TextField, Button, Typography, IconButton, Autocomplete } from '@mui/material';
import { Add, Clear } from '@mui/icons-material';
import i18next from 'i18next';
import { IFilterRelationReference } from '../commonInterfaces';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';

interface FilterEntitiesByCriteriaProps {
    name: string; // e.g. "properties[0].relationshipReference.filters"
    selectedEntityTemplate: IMongoEntityTemplatePopulated | null;
}

export const FilterEntitiesByCriteria: React.FC<FilterEntitiesByCriteriaProps> = ({ name, selectedEntityTemplate }) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const filters: Record<string, IFilterRelationReference> = getIn(values, name) || {};
    const selectedEntityTemplateFieldsOptions = Object.entries(selectedEntityTemplate?.properties?.properties || {})
        .filter(
            ([key, _prop]) =>
                selectedEntityTemplate?.properties.required.includes(key) &&
                selectedEntityTemplate?.properties?.properties[key].format !== 'signature',
        )
        .map(([key, prop]) => ({ key, title: prop.title }));

    const filterInitialValues: IFilterRelationReference = {
        relatedTemplateFilterField: '',
        filterBy: '',
        filterValue: '',
    };

    const handleChange = (key: string, field: keyof IFilterRelationReference, value: string | number) => {
        const updatedFilter = { ...filters[key], [field]: value };
        setFieldValue(`${name}.${key}`, updatedFilter);
    };

    const handleAddFilter = () => {
        const newKey = `${Object.keys(filters).length + 1}`;
        setFieldValue(`${name}.${newKey}`, filterInitialValues);
    };

    const handleRemoveFilter = (key: string) => {
        const updatedFilters = { ...filters };
        delete updatedFilters[key];
        setFieldValue(name, updatedFilters);
    };

    return (
        <Grid container direction="column" gap="0.8rem">
            {Object.entries(filters).map(([key, filter]) => {
                const isNewProperty = filterInitialValues !== filter;
                const isDisabled = !isNewProperty;

                const getSelectedFilterFieldTitle =
                    selectedEntityTemplate && filter.relatedTemplateFilterField
                        ? {
                              key: filter.relatedTemplateFilterField,
                              title: selectedEntityTemplate.properties.properties[filter.relatedTemplateFilterField].title,
                          }
                        : null;

                return (
                    <Grid container wrap="nowrap" key={key}>
                        <TextField
                            label={i18next.t('wizard.entityTemplate.filterField')}
                            value={filter.relatedTemplateFilterField}
                            onChange={(e) => handleChange(key, 'relatedTemplateFilterField', e.target.value)}
                            disabled={isDisabled}
                            sx={{ marginRight: '5px' }}
                            fullWidth
                        />

                        {selectedEntityTemplate && (
                            <Autocomplete
                                id={key}
                                options={selectedEntityTemplateFieldsOptions}
                                onChange={(_e, selectedField) => {
                                    setFieldValue('relatedTemplateFilterField', selectedField?.key);
                                }}
                                isOptionEqualToValue={(option, val) => option.key === val.key}
                                sx={{ marginRight: '5px' }}
                                value={getSelectedFilterFieldTitle}
                                disabled={isDisabled}
                                getOptionLabel={(option) => option.title}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        fullWidth
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                borderRadius: '10px',
                                                width: 240,
                                            },
                                        }}
                                        name="template"
                                        variant="outlined"
                                        label={i18next.t('wizard.entityTemplate.filterField')}
                                    />
                                )}
                            />
                        )}

                        <TextField
                            label={i18next.t('wizard.entityTemplate.filterBy')}
                            value={filter.filterBy}
                            onChange={(e) => handleChange(key, 'filterBy', e.target.value)}
                            sx={{ marginRight: '5px' }}
                            fullWidth
                        />
                        <TextField
                            label={i18next.t('wizard.entityTemplate.filterValue')}
                            value={filter.filterValue}
                            onChange={(e) => handleChange(key, 'filterValue', e.target.value)}
                            sx={{ marginRight: '5px' }}
                            fullWidth
                        />
                        <IconButton onClick={() => handleRemoveFilter(key)}>
                            <Clear />
                        </IconButton>
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
    );
};
