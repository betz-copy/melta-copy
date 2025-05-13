import { Button, Divider, FormControlLabel, Grid } from '@mui/material';
import React from 'react';
import { AddRounded } from '@mui/icons-material';
import AddFieldFilterDialog from './AddFieldFilterDialog';
import { IFieldFilter, ITemplateFieldsFilters } from '.';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter } from '../../../utils/agGrid/interfaces';
import { MeltaCheckbox } from '../../MeltaCheckbox';

interface IFieldsAndFiltersTableProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    templateFieldsFilters: ITemplateFieldsFilters;
    setTemplateFieldsFilters: React.Dispatch<React.SetStateAction<ITemplateFieldsFilters>>;
}

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({ entityTemplate, templateFieldsFilters, setTemplateFieldsFilters }) => {
    const [addFilterToField, setAddFilterToField] = React.useState<string | null>(null);
    const [dialogType, setDialogType] = React.useState<'filter' | 'default' | null>(null);

    const addFilterToFieldHandler = (
        filterField: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter,
        currentFieldName: string,
    ) => {
        const newFieldFilter = {
            ...templateFieldsFilters[currentFieldName],
        };
        newFieldFilter.filterField = filterField;
        setTemplateFieldsFilters((prev) => ({
            ...prev,
            [currentFieldName]: newFieldFilter,
        }));
    };

    const handleSelectProperty = (newProperty: string | null, type: 'filter' | 'default') => {
        setAddFilterToField(newProperty);
        setDialogType(type);

        if (!newProperty) return;
        if (!entityTemplate) return;

        const { format, type: fieldType } = entityTemplate.properties.properties[newProperty];

        const initializedFilterField: Record<string, IFieldFilter['filterField']> = {
            'date-time': { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
            date: { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
            number: { filterType: 'number', type: 'equals' },
            string: { filterType: 'text', type: 'contains' },
            boolean: { filterType: 'text', type: 'equals' },
            array: { filterType: 'set', values: [] },
        };

        const selectedFilter = (format && initializedFilterField[format]) || (fieldType && initializedFilterField[fieldType]);

        if (selectedFilter) addFilterToFieldHandler(selectedFilter, newProperty);
    };

    return (
        <>
            <Grid container>
                <Grid item xs={12}>
                    <Divider sx={{ mb: 0.1 }} />
                </Grid>
                <Grid container>
                    {Object.entries(templateFieldsFilters).map(([fieldName, fieldFilter]) => (
                        <React.Fragment key={fieldName}>
                            <Grid container alignItems="center" justifyContent="space-between" sx={{ py: 1.5, ml: 1 }}>
                                <Grid item xs={3}>
                                    <FormControlLabel
                                        control={
                                            <MeltaCheckbox
                                                checked={fieldFilter.selected}
                                                onChange={(e) => {
                                                    const newFieldFilters = { ...templateFieldsFilters };
                                                    newFieldFilters[fieldName].selected = e.target.checked;
                                                    setTemplateFieldsFilters(newFieldFilters);
                                                }}
                                            />
                                        }
                                        label={
                                            <>
                                                {fieldFilter.fieldValue.title || fieldName}
                                                {entityTemplate.properties.required.includes(fieldName) && (
                                                    <span style={{ marginRight: '3px' }}>*</span>
                                                )}
                                            </>
                                        }
                                        componentsProps={{
                                            typography: { sx: { fontWeight: 400, fontSize: '14px' } },
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={3}>
                                    <Button color="primary" onClick={() => handleSelectProperty(fieldName, 'filter')} sx={{ width: '100%' }}>
                                        <AddRounded />
                                    </Button>
                                </Grid>

                                <Grid item xs={3}>
                                    <Button color="primary" onClick={() => handleSelectProperty(fieldName, 'default')} sx={{ width: '100%' }}>
                                        <AddRounded />
                                    </Button>
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 0.1 }} />
                            </Grid>
                        </React.Fragment>
                    ))}
                </Grid>
            </Grid>

            {addFilterToField && (
                <AddFieldFilterDialog
                    open={!!addFilterToField}
                    onClose={() => {
                        setAddFilterToField(null);
                    }}
                    onSubmit={() => {
                        setAddFilterToField(null);
                    }}
                    updateFieldFilter={addFilterToFieldHandler}
                    entityTemplate={entityTemplate}
                    currentFieldName={addFilterToField}
                    fieldFilter={templateFieldsFilters[addFilterToField]}
                    dialogType={dialogType!}
                />
            )}
        </>
    );
};
export default FieldsAndFiltersTable;
