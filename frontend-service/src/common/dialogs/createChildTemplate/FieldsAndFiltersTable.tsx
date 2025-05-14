/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
import { Button, Chip, Divider, FormControlLabel, Grid } from '@mui/material';
import React from 'react';
import { AddRounded } from '@mui/icons-material';
import i18next from 'i18next';
import AddFieldFilterDialog from './AddFieldFilterDialog';
import { IFieldFilter, ITemplateFieldsFilters } from '.';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter } from '../../../utils/agGrid/interfaces';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import { ColoredEnumChip } from '../../ColoredEnumChip';

interface IFieldsAndFiltersTableProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    templateFieldsFilters: ITemplateFieldsFilters;
    setTemplateFieldsFilters: React.Dispatch<React.SetStateAction<ITemplateFieldsFilters>>;
}

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({ entityTemplate, templateFieldsFilters, setTemplateFieldsFilters }) => {
    const [addFilterToField, setAddFilterToField] = React.useState<string | null>(null);
    const [dialogType, setDialogType] = React.useState<'filter' | 'default' | 'editByUser' | null>(null);
    const [fieldChips, setFieldChips] = React.useState<
        {
            fieldName: string;
            filterType: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
            value: string | number | boolean | Date | string[];
        }[]
    >([]);

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

    const handleSelectProperty = (newProperty: string | null, type: 'filter' | 'default' | 'editByUser') => {
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
    console.log({ fieldChips });

    return (
        <>
            <Grid container>
                <Grid item xs={12}>
                    <Divider />
                </Grid>
                <Grid container>
                    {Object.entries(templateFieldsFilters).map(([fieldName, fieldFilter]) => {
                        const isRequired = entityTemplate.properties.required.includes(fieldName);

                        return (
                            <React.Fragment key={fieldName}>
                                <Grid container alignItems="center" justifyContent="space-between" sx={{ py: 1.5, ml: 1 }}>
                                    <Grid item xs={3}>
                                        <FormControlLabel
                                            control={
                                                <MeltaCheckbox
                                                    checked={isRequired ? true : fieldFilter.selected}
                                                    disabled={isRequired}
                                                    onChange={(e) => {
                                                        if (isRequired) return;
                                                        const newFieldFilters = { ...templateFieldsFilters };
                                                        newFieldFilters[fieldName].selected = e.target.checked;
                                                        setTemplateFieldsFilters(newFieldFilters);
                                                    }}
                                                />
                                            }
                                            label={
                                                <>
                                                    {fieldFilter.fieldValue.title || fieldName}
                                                    {isRequired && <span style={{ marginRight: '3px' }}>*</span>}
                                                </>
                                            }
                                            componentsProps={{
                                                typography: { sx: { fontWeight: 400, fontSize: '14px' } },
                                            }}
                                        />
                                    </Grid>

                                    {fieldChips
                                        .filter((chip) => chip.fieldName === fieldName)
                                        .map((chip, index) => {
                                            const filterTypeLabel = 'type' in chip.filterType ? chip.filterType.type : '';
                                            const filterValue =
                                                'filter' in chip.filterType
                                                    ? chip.filterType.filter
                                                    : 'values' in chip.filterType
                                                    ? chip.filterType.values.join(', ')
                                                    : 'dateFrom' in chip.filterType
                                                    ? chip.filterType.dateFrom?.toString()
                                                    : '';

                                            return (
                                                <ColoredEnumChip
                                                    key={index}
                                                    label={`${i18next.t(`filters.${filterTypeLabel}`)} : ${filterValue}`}
                                                    onDelete={() => {
                                                        setFieldChips((prev) => prev.filter((_, i) => i !== index));
                                                    }}
                                                    color="default"
                                                    style={{ backgroundColor: '#EBEFFA', borderRadius: '10px' }}
                                                />
                                            );
                                        })}

                                    <Grid item xs={3}>
                                        <Button color="primary" onClick={() => handleSelectProperty(fieldName, 'filter')}>
                                            <AddRounded />
                                        </Button>
                                    </Grid>

                                    <Grid item xs={3}>
                                        <Button color="primary" onClick={() => handleSelectProperty(fieldName, 'default')}>
                                            <AddRounded />
                                        </Button>
                                    </Grid>
                                    <Grid item xs={3} sx={{ textAlign: 'center' }}>
                                        <MeltaCheckbox />
                                    </Grid>
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider />
                                </Grid>
                            </React.Fragment>
                        );
                    })}
                </Grid>
            </Grid>

            {addFilterToField && (
                <AddFieldFilterDialog
                    open={!!addFilterToField}
                    onClose={() => {
                        setAddFilterToField(null);
                    }}
                    onSubmit={(fieldName, fieldValue) => {
                        if (!fieldValue || typeof fieldValue !== 'object') return;

                        setFieldChips((prev) => [
                            ...prev,
                            {
                                fieldName,
                                filterType: fieldValue,
                                value:
                                    'filter' in fieldValue
                                        ? fieldValue.filter
                                        : 'values' in fieldValue
                                        ? fieldValue.values
                                        : 'dateFrom' in fieldValue
                                        ? fieldValue.dateFrom
                                        : '',
                            },
                        ]);

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
