import { Grid, MenuItem } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';
import { environment } from '../../../globals';

const { filterOptions } = environment;

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

const TextFilterInput: React.FC<TextFilterProps> = ({
    entityFilter,
    readOnly,
    filterField,
    type,
    handleFilterTypeChange,
    handleFilterFieldChange,
}) => {
    return (
        <Grid container justifyContent="center" direction={entityFilter ? 'row' : 'column'} spacing={2}>
            <Grid item xs={entityFilter ? 5 : 12}>
                {/* TODO : same height after defining fontsize */}
                <StyledFilterInput
                    fullWidth
                    select
                    size="small"
                    value={filterField?.type || ''}
                    inputProps={{
                        readOnly,
                        style: {
                            textOverflow: 'ellipsis',
                        },
                    }}
                    onChange={(e) =>
                        handleFilterTypeChange(e.target.value as IAGGidNumberFilter['type'] | IAGGridTextFilter['type'], Boolean(filterField?.filter))
                    }
                    SelectProps={{
                        IconComponent: IoIosArrowDown,
                    }}
                >
                    {filterOptions[type].map((option, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <MenuItem key={index} value={option}>
                            {i18next.t(`filters.${option}`)}
                        </MenuItem>
                    ))}
                </StyledFilterInput>
            </Grid>

            <Grid item xs={entityFilter ? 7 : 12}>
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

                        handleFilterFieldChange(updatedFilter, Boolean(filterField && filterField.type && value));
                    }}
                />
            </Grid>
        </Grid>
    );
};

export { TextFilterInput };
