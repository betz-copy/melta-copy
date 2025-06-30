import { Checkbox, Chip, Grid, ListItemText, MenuItem } from '@mui/material';
import React from 'react';
import { IAGGridSetFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';

interface MultipleSelectFilterInputProps {
    filterField: IAGGridSetFilter | undefined;
    readOnly: boolean;
    handleCheckboxChange: (option: string, checked: boolean) => void;
    enumOptions: string[] | undefined;
    isError?: boolean;
    helperText?: string;
}

const MultipleSelectFilterInput: React.FC<MultipleSelectFilterInputProps> = ({
    filterField,
    readOnly,
    handleCheckboxChange,
    enumOptions,
    isError,
    helperText,
}) => {
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
                inputProps={{
                    readOnly,
                    style: {
                        textOverflow: 'ellipsis',
                    },
                }}
                SelectProps={{
                    multiple: true,
                    renderValue: (selected: any) => (
                        <div>
                            {selected.map((value: string) => (
                                <Chip key={value} label={value} style={{ marginRight: 5 }} />
                            ))}
                        </div>
                    ),
                }}
            >
                {enumOptions?.map((option, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <MenuItem key={index} value={option}>
                        <Checkbox checked={filterField?.values.includes(option)} onChange={(e) => handleCheckboxChange(option, e.target.checked)} />
                        <ListItemText primary={option} />
                    </MenuItem>
                ))}
            </StyledFilterInput>
        </Grid>
    );
};

export { MultipleSelectFilterInput };
