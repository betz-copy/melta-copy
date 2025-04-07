import React, { useCallback, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Box, Button, Grid, IconButton, Typography, debounce } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import i18next from 'i18next';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { SelectFilterInput } from '../../inputs/FilterInputs/SelectFilterInput';
import { DateFilterInput } from '../../inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from '../../inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from '../../inputs/FilterInputs/MultipleUserFilterInput';
import { TextFilterInput } from '../../inputs/FilterInputs/TextFilterInput';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { IFilterBodyBatch } from '.';

interface IFieldFilter {
    fieldValue: IEntitySingleProperty;
    selected: boolean;
    filterField?: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
}

interface IAddFieldFilterDialogProps {
    open: boolean;
    onClose: () => void;
    fieldFilter: IFieldFilter;
    setFieldFilters: React.Dispatch<React.SetStateAction<IFilterBodyBatch>>;
    entityTemplate: IMongoEntityTemplatePopulated;
    currentFieldName: string;
}

const AddFieldFilterDialog: React.FC<IAddFieldFilterDialogProps> = ({
    open,
    onClose,
    entityTemplate,
    fieldFilter,
    setFieldFilters,
    currentFieldName,
}) => {
    const readOnly = false; // Assuming readOnly is a prop or state that you will manage
    const entityFilter = false; // Assuming entityFilter is a prop or state that you will manage
    const [inputValue, setInputValue] = useState<string>('');
    const [filterField, setFilterField] = useState<IFieldFilter['filterField']>(fieldFilter.filterField || undefined);

    const removeFilterFromFilterList = (filterKey: string) => {
        setFieldFilters((prev) => {
            const { [filterKey]: deletedFilter, ...restFilters } = prev;
            return restFilters;
        });
    };

    const debouncedOnFilter = useCallback(
        debounce((newFilterField) => {
            if (!currentFieldName || !entityTemplate) return;
            setFieldFilters((prev: IFilterBodyBatch) => ({
                ...prev,
                [currentFieldName]: {
                    ...fieldFilter,
                    filterField: newFilterField as IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter,
                },
            }));
        }, 500),
        [entityTemplate, currentFieldName],
    );

    const handleSetFilterRecord = (newFilterField: IFieldFilter['filterField'], condition: boolean = true) => {
        if (condition) debouncedOnFilter(newFilterField);
    };

    const handleFilterFieldChange = (value: IFieldFilter['filterField'], condition: boolean = true) => {
        setFilterField(value);

        if ((value?.filterType === 'number' || value?.filterType === 'text') && (value.filter === undefined || value.filter === '')) {
            removeFilterFromFilterList(currentFieldName);
            return;
        }

        handleSetFilterRecord(value, condition);
    };

    const handleDateChange = (newValue: Date | null, isStartDate: boolean) => {
        if (!newValue && fieldFilter.filterField?.filterType === 'date') {
            const isRemovingStart = isStartDate && !fieldFilter.filterField.dateTo;
            const isRemovingEnd = !isStartDate && !fieldFilter.filterField.dateFrom;
            if (isRemovingStart || isRemovingEnd) {
                removeFilterFromFilterList(currentFieldName);
                return;
            }
        }

        handleFilterFieldChange(
            {
                ...fieldFilter.filterField,
                ...(isStartDate ? { dateFrom: newValue } : { dateTo: newValue }),
            } as IAGGridDateFilter,
            Boolean(
                isStartDate
                    ? fieldFilter.filterField?.filterType === 'date' &&
                          newValue &&
                          (fieldFilter.filterField.type !== 'inRange' || fieldFilter.filterField.dateTo)
                    : newValue &&
                          fieldFilter.filterField?.filterType === 'date' &&
                          fieldFilter.filterField.type === 'inRange' &&
                          fieldFilter.filterField.dateFrom,
            ),
        );
    };

    const handleCheckboxChange = (option: string, checked: boolean) => {
        const { values } = fieldFilter.filterField as IAGGridSetFilter;

        const updatedValues = checked ? [...values, option] : values?.filter((item) => item !== option);
        const updatedFilterField = { ...fieldFilter.filterField, values: updatedValues } as IAGGridSetFilter;

        setFilterField(updatedFilterField);
        if (updatedValues.length === 0) removeFilterFromFilterList(currentFieldName);
        else handleSetFilterRecord(updatedFilterField);
    };

    const handleFilterTypeChange = (
        newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGidNumberFilter['type'],
        condition: boolean = true,
    ) =>
        handleFilterFieldChange(
            { ...fieldFilter.filterField, type: newTypeFilter } as IAGGridDateFilter | IAGGridTextFilter | IAGGidNumberFilter,
            condition,
        );

    const renderFilterInput = () => {
        if (!(currentFieldName && entityTemplate)) return null;
        const { format, enum: propEnum, type, items } = entityTemplate.properties.properties[currentFieldName];
        // no files in graph filter
        if (items?.format === 'fileId' || format === 'fileId' || format === 'signature') return null;

        if (propEnum)
            return (
                <SelectFilterInput
                    filterField={fieldFilter.filterField?.filterType === 'text' ? (fieldFilter.filterField as IAGGridTextFilter) : undefined}
                    enumOptions={propEnum}
                    handleFilterFieldChange={handleFilterFieldChange}
                    readOnly={readOnly}
                />
            );

        if (format === 'date-time' || format === 'date')
            return (
                <DateFilterInput
                    filterField={fieldFilter.filterField?.filterType === 'date' ? (fieldFilter.filterField as IAGGridDateFilter) : undefined}
                    handleFilterTypeChange={handleFilterTypeChange}
                    handleDateChange={handleDateChange}
                    readOnly={readOnly}
                    entityFilter={entityFilter}
                />
            );

        if (type === 'boolean')
            return (
                <SelectFilterInput
                    filterField={fieldFilter.filterField?.filterType === 'text' ? (fieldFilter.filterField as IAGGridTextFilter) : undefined}
                    isBooleanSelect
                    handleFilterFieldChange={handleFilterFieldChange}
                    readOnly={readOnly}
                />
            );

        if (items && entityTemplate.properties.properties[currentFieldName].items?.enum)
            return (
                <MultipleSelectFilterInput
                    filterField={fieldFilter.filterField?.filterType === 'set' ? (fieldFilter.filterField as IAGGridSetFilter) : undefined}
                    handleCheckboxChange={handleCheckboxChange}
                    enumOptions={items?.enum}
                    readOnly={readOnly}
                />
            );

        if (items?.format === 'user' && type === 'array')
            return (
                <MultipleUserFilterInput
                    filterField={fieldFilter.filterField?.filterType === 'set' ? (fieldFilter.filterField as IAGGridSetFilter) : undefined}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleCheckboxChange={handleCheckboxChange}
                    readOnly={readOnly}
                />
            );

        return (
            <TextFilterInput
                entityFilter={entityFilter}
                filterField={
                    fieldFilter.filterField?.filterType === 'number' || fieldFilter.filterField?.filterType === 'text'
                        ? (fieldFilter.filterField as IAGGidNumberFilter | IAGGridTextFilter)
                        : undefined
                }
                handleFilterFieldChange={handleFilterFieldChange}
                handleFilterTypeChange={handleFilterTypeChange}
                type={type}
                readOnly={readOnly}
            />
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>{i18next.t('createChildTemplateDialog.fieldFilterDialog.title')}</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid item container justifyContent="center">
                    <Grid item style={{ width: '90%', paddingBottom: '10px' }}>
                        {renderFilterInput()}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Grid container spacing={2} alignItems="center">
                    <Grid xs={12} item display="flex" justifyContent="center" alignItems="center">
                        <Button onClick={onClose} variant="contained" color="primary">
                            {i18next.t('createChildTemplateDialog.fieldFilterDialog.addFilter')}
                        </Button>
                    </Grid>
                </Grid>
            </DialogActions>
        </Dialog>
    );
};

export default AddFieldFilterDialog;
