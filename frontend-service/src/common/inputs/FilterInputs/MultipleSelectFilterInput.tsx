import { Checkbox, Chip, Grid, ListItemText, MenuItem } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IAGGridSetFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';

interface MultipleSelectFilterInputProps {
    filterField: IAGGridSetFilter | undefined;
    readOnly: boolean;
    handleCheckboxChange: (option: (string | null)[], checked: boolean) => void;
    enumOptions: string[];
    isError?: boolean;
    helperText?: string;
    allowEmpty?: boolean;
}

const MultipleSelectFilterInput: React.FC<MultipleSelectFilterInputProps> = ({
    filterField,
    readOnly,
    handleCheckboxChange,
    enumOptions,
    isError,
    helperText,
    allowEmpty = true,
}) => {
    const expectedValues = [...enumOptions, ...(allowEmpty ? [null] : [])];
    const allSelected = !!expectedValues.length && expectedValues.every((val) => filterField?.values?.includes(val));
    const someSelected = !!filterField?.values?.length && !allSelected;

    return (
        <Grid container justifyContent="center">
            <StyledFilterInput
                select
                rows={2}
                size="small"
                fullWidth
                value={filterField?.values ? filterField.values : []}
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
                        renderValue: (selected: any) => (
                            <div>
                                {selected.map((value: string) => (
                                    <Chip key={value} label={value === null ? i18next.t('filters.empty') : value} style={{ marginRight: 5 }} />
                                ))}
                            </div>
                        ),
                    },
                }}
            >
                <MenuItem>
                    <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={(e) => handleCheckboxChange(expectedValues, e.target.checked)}
                    />
                    <ListItemText primary="בחר הכל" />
                </MenuItem>

                {allowEmpty && (
                    <MenuItem>
                        <Checkbox checked={filterField?.values?.includes(null)} onChange={(e) => handleCheckboxChange([null], e.target.checked)} />
                        <ListItemText primary={i18next.t('filters.empty')} />
                    </MenuItem>
                )}

                {enumOptions?.map((option, index) => (
                    <MenuItem
                        key={index}
                        value={option}
                        sx={{
                            backgroundColor: 'white',
                            '&:hover': { backgroundColor: 'transparent' },
                            '&.Mui-selected': { backgroundColor: 'white' },
                            '&.Mui-selected:hover': { backgroundColor: '#f0f0f0' },
                        }}
                    >
                        <Checkbox checked={filterField?.values.includes(option)} onChange={(e) => handleCheckboxChange([option], e.target.checked)} />
                        <ListItemText primary={option} />
                    </MenuItem>
                ))}
            </StyledFilterInput>
        </Grid>
    );
};

export { MultipleSelectFilterInput };
