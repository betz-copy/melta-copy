import { Grid, MenuItem } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';

interface SelectFilterInputProps {
    filterField: IAGGridTextFilter | undefined;
    handleFilterFieldChange: (value: IGraphFilterBody['filterField'], condition?: boolean) => void;
    readOnly?: boolean;
    isBooleanSelect?: boolean;
    enumOptions?: string[];
    error?: boolean;
    helperText?: string;
}

const SelectFilterInput: React.FC<SelectFilterInputProps> = ({
    filterField,
    handleFilterFieldChange,
    enumOptions,
    readOnly,
    isBooleanSelect,
    error,
    helperText,
}) => {
    const options = isBooleanSelect
        ? [
              { option: true, label: i18next.t('booleanOptions.yes') },
              { option: false, label: i18next.t('booleanOptions.no') },
          ]
        : enumOptions?.map((option) => ({ option, label: option }));

    return (
        <Grid container justifyContent="center">
            <StyledFilterInput
                select
                size="small"
                fullWidth
                value={filterField?.filter ?? ''}
                onChange={(e) => handleFilterFieldChange({ filterType: 'text', type: 'equals', filter: e.target.value } as IAGGridTextFilter)}
                disabled={readOnly}
                error={error}
                helperText={helperText}
                inputProps={{
                    readOnly,
                    style: {
                        textOverflow: 'ellipsis',
                    },
                }}
                forceOutlined
            >
                {options?.map(({ option, label }) => (
                    <MenuItem key={option} value={option}>
                        {label}
                    </MenuItem>
                ))}
            </StyledFilterInput>
        </Grid>
    );
};

export { SelectFilterInput };
