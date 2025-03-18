import { Grid, MenuItem } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';

interface BooleanFilterInputProps {
    filterField: IAGGridTextFilter | undefined;
    handleFilterFieldChange: (value: IGraphFilterBody['filterField'], condition?: boolean) => void;
    readOnly: boolean;
}

const BooleanFilterInput: React.FC<BooleanFilterInputProps> = ({ filterField, handleFilterFieldChange, readOnly }) => {
    return (
        <Grid container justifyContent="center">
            <StyledFilterInput
                select
                size="small"
                fullWidth
                value={filterField?.filter ?? ''}
                onChange={(e) => {
                    handleFilterFieldChange({ ...filterField, type: 'equals', filter: e.target.value } as IAGGridTextFilter);
                }}
                inputProps={{
                    readOnly,
                    style: {
                        textOverflow: 'ellipsis',
                    },
                }}
            >
                <MenuItem value="true">{i18next.t('booleanOptions.yes')}</MenuItem>
                <MenuItem value="false">{i18next.t('booleanOptions.no')}</MenuItem>
            </StyledFilterInput>
        </Grid>
    );
};

export { BooleanFilterInput };
