import { Button, Checkbox, FormControlLabel, Grid } from '@mui/material';
import React from 'react';
import { AddRounded } from '@mui/icons-material';
import AddFieldFilterDialog from './AddFieldFilterDialog';
import { IFieldFilter, ITemplateFieldsFilters } from '.';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter } from '../../../utils/agGrid/interfaces';

interface IFieldsAndFiltersTableProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    templateFieldsFilters: ITemplateFieldsFilters;
    setTemplateFieldsFilters: React.Dispatch<React.SetStateAction<ITemplateFieldsFilters>>;
}

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({ entityTemplate, templateFieldsFilters, setTemplateFieldsFilters }) => {
    const [addFilterToField, setAddFilterToField] = React.useState<string | null>(null);

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

    const handleSelectProperty = (newProperty: string | null) => {
        setAddFilterToField(newProperty);

        if (!newProperty) {
            return;
        }

        if (!entityTemplate) return;

        const { format, type } = entityTemplate.properties.properties[newProperty];

        const initializedFilterField: Record<string, IFieldFilter['filterField']> = {
            'date-time': { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
            date: { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
            number: { filterType: 'number', type: 'equals' },
            string: { filterType: 'text', type: 'contains' },
            boolean: { filterType: 'text', type: 'equals' },
            array: { filterType: 'set', values: [] },
        };

        const selectedFilter = (format && initializedFilterField[format]) || (type && initializedFilterField[type]);

        if (selectedFilter) addFilterToFieldHandler(selectedFilter, newProperty);
    };

    return (
        <>
            <Grid container>
                {Object.entries(templateFieldsFilters).map(([fieldName, fieldFilter]) => (
                    <Grid container justifyContent="space-between" key={fieldName}>
                        <Grid container alignItems="center" item xs={8} spacing={2}>
                            <Grid item xs={3}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={fieldFilter.selected}
                                            onChange={(e) => {
                                                const newFieldFilters = { ...templateFieldsFilters };
                                                newFieldFilters[fieldName].selected = e.target.checked;
                                                setTemplateFieldsFilters(newFieldFilters);
                                            }}
                                        />
                                    }
                                    label={fieldName}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => {
                                        handleSelectProperty(fieldName);
                                    }}
                                    sx={{ width: '100%' }}
                                >
                                    <AddRounded />
                                </Button>
                            </Grid>
                        </Grid>
                        <Grid item xs={3}>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => {
                                    handleSelectProperty(fieldName);
                                }}
                                sx={{ width: '100%' }}
                            >
                                <AddRounded />
                            </Button>
                        </Grid>
                    </Grid>
                ))}
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
                />
            )}
        </>
    );
};
export default FieldsAndFiltersTable;
