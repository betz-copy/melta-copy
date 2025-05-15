import { Grid } from '@mui/material';
import React from 'react';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';
import { TypeSelectFilter } from './TypeSelectFilter';

interface TextFilterProps {
    entityFilter: boolean;
    readOnly: boolean;
    filterField: IAGGidNumberFilter | IAGGridTextFilter | undefined;
    type: string;
    handleFilterTypeChange: (
        newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGidNumberFilter['type'],
        condition?: boolean,
    ) => void;
    handleFilterFieldChange: (value: IGraphFilterBody['filterField'], condition?: boolean) => void;
}

const TextFilterInput: React.FC<TextFilterProps> = ({ readOnly, filterField, type, handleFilterTypeChange, handleFilterFieldChange }) => {
    return (
        <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xs={6}>
                <TypeSelectFilter
                    filterField={filterField as IAGGidNumberFilter | IAGGridTextFilter}
                    handleFilterTypeChange={handleFilterTypeChange}
                    readOnly={readOnly}
                    type={type}
                />
            </Grid>

            <Grid item xs={5.5}>
                <StyledFilterInput
                    inputProps={{
                        readOnly,
                        style: {
                            textOverflow: 'ellipsis',
                        },
                    }}
                    size="small"
                    fullWidth
                    type={type}
                    value={filterField?.filter ?? ''}
                    onChange={(e) => {
                        const { value } = e.target;
                        const updatedFilter =
                            type === 'number'
                                ? ({ ...filterField, filter: value ? Number(value) : undefined } as IAGGidNumberFilter)
                                : ({ ...filterField, filter: value } as IAGGridTextFilter);

                        handleFilterFieldChange(updatedFilter);
                    }}
                />
            </Grid>
        </Grid>
    );
};

export { TextFilterInput };
