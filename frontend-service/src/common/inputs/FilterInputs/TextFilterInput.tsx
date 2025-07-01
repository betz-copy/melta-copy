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
    error?: boolean;
    helperText?: string;
}

const TextFilterInput: React.FC<TextFilterProps> = ({
    entityFilter,
    readOnly,
    filterField,
    type,
    handleFilterTypeChange,
    handleFilterFieldChange,
    error,
    helperText,
}) => {
    return (
        <Grid
            container
            justifyContent="center"
            direction={entityFilter ? 'row' : 'column'}
            spacing={1}
            sx={{ height: 'fit-content', display: 'flex', flexWrap: 'nowrap' }}
        >
            <Grid item xs={entityFilter ? 5 : 12}>
                <TypeSelectFilter
                    filterField={filterField as IAGGidNumberFilter | IAGGridTextFilter}
                    handleFilterTypeChange={handleFilterTypeChange}
                    readOnly={readOnly}
                    type={type}
                />
            </Grid>

            <Grid item xs={entityFilter ? 7 : 12}>
                <StyledFilterInput
                    size="small"
                    fullWidth
                    type={type}
                    value={filterField?.filter !== undefined ? String(filterField.filter) : ''}
                    disabled={readOnly}
                    error={error}
                    helperText={helperText}
                    onChange={(e) => {
                        const { value } = e.target;

                        const updatedFilter =
                            type === 'number'
                                ? ({ ...filterField, filter: value ? Number(value) : undefined } as IAGGidNumberFilter)
                                : ({ ...filterField, filter: value || undefined } as IAGGridTextFilter);

                        handleFilterFieldChange(
                            updatedFilter,
                            Boolean(filterField !== undefined && filterField.type && value !== undefined && value !== ''),
                        );
                    }}
                    readOnly={readOnly}
                    forceOutlined
                />
            </Grid>
        </Grid>
    );
};

export { TextFilterInput };
