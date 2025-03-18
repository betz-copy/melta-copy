import { Grid, MenuItem } from '@mui/material';
import React from 'react';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';

interface SelectFilterInputProps {
    filterField: IAGGridTextFilter | undefined;
    handleFilterFieldChange: (value: IGraphFilterBody['filterField'], condition?: boolean) => void;
    enumOptions: string[];
    readOnly: boolean;
}

const SelectFilterInput: React.FC<SelectFilterInputProps> = ({ filterField, handleFilterFieldChange, enumOptions, readOnly }) => {
    return (
        <Grid container justifyContent="center">
            <StyledFilterInput
                select
                size="small"
                fullWidth
                value={filterField?.filter ?? ''}
                onChange={(e) => handleFilterFieldChange({ type: 'equals', filter: e.target.value } as IAGGridTextFilter)}
                inputProps={{
                    readOnly,
                    style: {
                        textOverflow: 'ellipsis',
                    },
                }}
            >
                {enumOptions.map((option, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <MenuItem key={index} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </StyledFilterInput>
        </Grid>
    );
};

export { SelectFilterInput };
