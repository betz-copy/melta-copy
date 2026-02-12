import { Box, Chip, Grid, ListItemText, MenuItem } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IAGGridSetFilter } from '../../../utils/agGrid/interfaces';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { FieldOption } from '../../wizards/entityTemplate/RelationshipReference/filterEntitiesByCriteria';
import { StyledFilterInput } from './StyledFilterInput';

interface MultipleSelectFilterInputProps {
    filterField: IAGGridSetFilter | undefined;
    readOnly: boolean;
    handleCheckboxChange: (option: (string | null)[], checked: boolean) => void;
    enumOptions: FieldOption[];
    isError?: boolean;
    helperText?: string;
    allowEmpty?: boolean;
}

const chipStyles = {
    size: 'small' as const,
    variant: 'filled' as const,
    sx: {
        backgroundColor: '#EBEFFA',
        padding: '10px',
        fontSize: '0.85rem',
    },
};

const MultipleSelectFilterInput: React.FC<MultipleSelectFilterInputProps> = ({
    filterField,
    readOnly,
    handleCheckboxChange,
    enumOptions,
    isError,
    helperText,
    allowEmpty = true,
}) => {
    const currentValues: string[] =
        filterField?.values.filter((v): v is string | null => v === null || typeof v === 'string').map((v) => (v === null ? 'EMPTY_VAL' : v)) ?? [];

    const expectedValues = [...enumOptions, ...(allowEmpty ? [null] : [])];
    const allSelected = !!expectedValues.length && expectedValues.every((val) => filterField?.values?.includes(val?.option ?? null));
    const someSelected = !!filterField?.values?.length && !allSelected;

    return (
        <Grid container justifyContent="center">
            <StyledFilterInput
                select
                rows={2}
                size="small"
                fullWidth
                value={currentValues}
                error={isError}
                helperText={helperText}
                slotProps={{
                    htmlInput: {
                        readOnly,
                        style: {
                            textOverflow: 'ellipsis',
                        },
                    },
                    select: {
                        multiple: true,
                        renderValue: (selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(selected as string[]).map((value) => (
                                    <Chip key={value} label={value === 'EMPTY_VAL' ? i18next.t('filters.empty') : value} {...chipStyles} />
                                ))}
                            </Box>
                        ),
                    },
                }}
            >
                <MenuItem
                    value="SELECT_ALL"
                    onClick={() =>
                        handleCheckboxChange(
                            expectedValues.map((ev) => ev?.option ?? null),
                            !allSelected,
                        )
                    }
                >
                    <MeltaCheckbox checked={allSelected} indeterminate={someSelected} />
                    <ListItemText primary={i18next.t('selectChooseAll')} />
                </MenuItem>

                {allowEmpty && (
                    <MenuItem value="EMPTY_VAL" onClick={() => handleCheckboxChange([null], !filterField?.values?.includes(null))}>
                        <MeltaCheckbox checked={filterField?.values?.includes(null)} />
                        <ListItemText primary={i18next.t('filters.empty')} />
                    </MenuItem>
                )}

                {enumOptions.map((option, index) => {
                    const checked = filterField?.values.includes(option.option);

                    return (
                        <MenuItem
                            key={`${option.option}-${index}`}
                            value={option.option}
                            onClick={() => handleCheckboxChange([option.option], !checked)}
                        >
                            <MeltaCheckbox checked={checked} />
                            <ListItemText primary={option.label} />
                        </MenuItem>
                    );
                })}
            </StyledFilterInput>
        </Grid>
    );
};

export { MultipleSelectFilterInput };
