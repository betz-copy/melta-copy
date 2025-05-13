import React, { useCallback, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Box, Button, Grid, IconButton, Typography, debounce, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { SelectFilterInput } from '../../inputs/FilterInputs/SelectFilterInput';
import { DateFilterInput } from '../../inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from '../../inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from '../../inputs/FilterInputs/MultipleUserFilterInput';
import { TextFilterInput } from '../../inputs/FilterInputs/TextFilterInput';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { IFieldFilter } from '.';

interface IAddFieldFilterDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    fieldFilter: IFieldFilter;
    updateFieldFilter: (filterField: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter, currentFieldName: string) => void;
    entityTemplate: IMongoEntityTemplatePopulated;
    currentFieldName: string;
    dialogType: 'filter' | 'default';
}

const AddFieldFilterDialog: React.FC<IAddFieldFilterDialogProps> = ({
    open,
    onClose,
    onSubmit,
    entityTemplate,
    fieldFilter,
    updateFieldFilter,
    currentFieldName,
    dialogType,
}) => {
    const currentFilterField = fieldFilter.filterField || undefined;

    const readOnly = false; // Assuming readOnly is a prop or state that you will manage
    const entityFilter = false; // Assuming entityFilter is a prop or state that you will manage
    const [inputValue, setInputValue] = useState<string>('');

    const handleSetFilterRecord = (newFilterField: IFieldFilter['filterField']) => {
        if (!currentFieldName || !entityTemplate || !newFilterField) return;
        updateFieldFilter(newFilterField, currentFieldName);
    };

    const handleFilterFieldChange = (value: IFieldFilter['filterField']) => {
        handleSetFilterRecord(value);
    };

    const handleDateChange = (newValue: Date | null, isStartDate: boolean) => {
        if (!newValue && currentFilterField?.filterType === 'date') {
            const isRemovingStart = isStartDate && !currentFilterField.dateTo;
            const isRemovingEnd = !isStartDate && !currentFilterField.dateFrom;
            if (isRemovingStart || isRemovingEnd) return;
        }

        handleFilterFieldChange({
            ...currentFilterField,
            ...(isStartDate ? { dateFrom: newValue } : { dateTo: newValue }),
        } as IAGGridDateFilter);
    };

    const handleCheckboxChange = (option: string, checked: boolean) => {
        const { values } = currentFilterField as IAGGridSetFilter;

        const updatedValues = checked ? [...values, option] : values?.filter((item) => item !== option);
        const updatedFilterField = { ...currentFilterField, values: updatedValues } as IAGGridSetFilter;

        if (updatedValues.length === 0) return;
        handleSetFilterRecord(updatedFilterField);
    };

    const handleFilterTypeChange = (newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGidNumberFilter['type']) => {
        handleFilterFieldChange({ ...currentFilterField, type: newTypeFilter } as IAGGridDateFilter | IAGGridTextFilter | IAGGidNumberFilter);
    };

    const renderFilterInput = () => {
        if (!(currentFieldName && entityTemplate)) return null;
        const { format, enum: propEnum, type, items } = entityTemplate.properties.properties[currentFieldName];
        // no files in graph filter
        if (items?.format === 'fileId' || format === 'fileId' || format === 'signature') return null;

        if (propEnum)
            return (
                <SelectFilterInput
                    filterField={currentFilterField?.filterType === 'text' ? (currentFilterField as IAGGridTextFilter) : undefined}
                    enumOptions={propEnum}
                    handleFilterFieldChange={(value) => {
                        if (value) handleFilterFieldChange(value);
                    }}
                    readOnly={readOnly}
                />
            );

        if (format === 'date-time' || format === 'date')
            return (
                <DateFilterInput
                    filterField={currentFilterField?.filterType === 'date' ? (currentFilterField as IAGGridDateFilter) : undefined}
                    handleFilterTypeChange={handleFilterTypeChange}
                    handleDateChange={handleDateChange}
                    readOnly={readOnly}
                    entityFilter={entityFilter}
                />
            );

        if (type === 'boolean')
            return (
                <SelectFilterInput
                    filterField={currentFilterField?.filterType === 'text' ? (currentFilterField as IAGGridTextFilter) : undefined}
                    isBooleanSelect
                    handleFilterFieldChange={(value) => {
                        if (value) handleFilterFieldChange(value);
                    }}
                    readOnly={readOnly}
                />
            );

        if (items && entityTemplate.properties.properties[currentFieldName].items?.enum)
            return (
                <MultipleSelectFilterInput
                    filterField={currentFilterField?.filterType === 'set' ? (currentFilterField as IAGGridSetFilter) : undefined}
                    handleCheckboxChange={handleCheckboxChange}
                    enumOptions={items?.enum}
                    readOnly={readOnly}
                />
            );

        if (items?.format === 'user' && type === 'array')
            return (
                <MultipleUserFilterInput
                    filterField={currentFilterField?.filterType === 'set' ? (currentFilterField as IAGGridSetFilter) : undefined}
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
                    currentFilterField?.filterType === 'number' || currentFilterField?.filterType === 'text'
                        ? (currentFilterField as IAGGidNumberFilter | IAGGridTextFilter)
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
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>
                        {dialogType === 'filter'
                            ? i18next.t('createChildTemplateDialog.fieldFilterDialog.title')
                            : i18next.t('createChildTemplateDialog.fieldDefaultDialog.title')}
                    </Typography>

                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            disabled
                            value={entityTemplate.properties.properties[currentFieldName]?.title || currentFieldName}
                            InputLabelProps={{ shrink: false }}
                            inputProps={{
                                style: { fontSize: '14px', fontWeight: 400, backgroundColor: '#EBEFFA', borderRadius: '10px' },
                            }}
                        />
                    </Grid>

                    <Grid container sx={{ pt: 3, pl: 2 }} alignItems="center" justifyContent="space-between">
                        {renderFilterInput()}

                        {dialogType === 'default' && (
                            <TextField
                                fullWidth
                                value={fieldFilter.fieldValue ?? ''}
                                InputLabelProps={{ shrink: false }}
                                inputProps={{
                                    style: { fontSize: '14px', fontWeight: 400 },
                                }}
                            />
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Grid container spacing={2} alignItems="center">
                    <Grid xs={12} item display="flex" justifyContent="center" alignItems="center">
                        <Button onClick={onSubmit} variant="contained" color="primary">
                            {i18next.t('createChildTemplateDialog.fieldFilterDialog.addFilter')}
                        </Button>
                    </Grid>
                </Grid>
            </DialogActions>
        </Dialog>
    );
};

export default AddFieldFilterDialog;
