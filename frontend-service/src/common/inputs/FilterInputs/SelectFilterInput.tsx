import { Grid, MenuItem } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';
import { IAGGridFilter, IFilterRelationReference } from '../../wizards/entityTemplate/commonInterfaces';

interface SelectFilterInputProps {
    filterField: IAGGridTextFilter | undefined;
    handleFilterFieldChange?: (value: IGraphFilterBody['filterField'], condition?: boolean) => void;
    readOnly: boolean;
    isBooleanSelect?: boolean;
    enumOptions?: string[];
    index?: number;
    field?: keyof IFilterRelationReference;
    handleFilterFieldChangeByIndex?: (index: number, field: keyof IFilterRelationReference, value: IAGGridFilter) => void;
}

const SelectFilterInput: React.FC<SelectFilterInputProps> = ({
    filterField,
    handleFilterFieldChange,
    enumOptions,
    readOnly,
    isBooleanSelect,
    index,
    field,
    handleFilterFieldChangeByIndex,
}) => {
    const options = isBooleanSelect
        ? [
              { option: true, label: i18next.t('booleanOptions.yes') },
              { option: false, label: i18next.t('booleanOptions.no') },
          ]
        : enumOptions?.map((option) => ({ option, label: option }));

    const handleFilterFieldChangeByValues = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (index && field && handleFilterFieldChangeByIndex)
            handleFilterFieldChangeByIndex(index, field, { filterType: 'text', type: 'equals', filter: e.target.value } as IAGGridTextFilter);
        else if (handleFilterFieldChange)
            handleFilterFieldChange({ filterType: 'text', type: 'equals', filter: e.target.value } as IAGGridTextFilter);
    };

    return (
        <Grid container justifyContent="center">
            <StyledFilterInput
                select
                size="small"
                fullWidth
                value={filterField?.filter ?? ''}
                onChange={(e) => handleFilterFieldChangeByValues(e)}
                inputProps={{
                    readOnly,
                    style: {
                        textOverflow: 'ellipsis',
                    },
                }}
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
