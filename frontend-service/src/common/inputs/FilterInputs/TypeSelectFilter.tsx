import { MenuItem } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { environment } from '../../../globals';
import { IAGGridDateFilter, IAGGridNumberFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';

const { filterOptions } = environment;

interface TypeSelectFilterProps {
    filterField: IAGGridNumberFilter | IAGGridDateFilter | IAGGridTextFilter;
    handleFilterTypeChange: (
        newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGridNumberFilter['type'],
        condition?: boolean,
    ) => void;
    readOnly?: boolean;
    type: string;
}

const TypeSelectFilter: React.FC<TypeSelectFilterProps> = ({ filterField, handleFilterTypeChange, readOnly, type }) => {
    return (
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
                handleFilterTypeChange(
                    e.target.value as IAGGridNumberFilter['type'] | IAGGridTextFilter['type'],
                    Boolean(filterField.filterType === 'date' ? filterField?.dateFrom : filterField?.filter),
                )
            }
            SelectProps={{
                IconComponent: IoIosArrowDown,
            }}
            disabled={readOnly}
        >
            {filterOptions[type].map((option: string) => (
                <MenuItem key={option} value={option}>
                    {i18next.t(`filters.${type === 'string' ? 'text' : type}.${option}`)}
                </MenuItem>
            ))}
        </StyledFilterInput>
    );
};

export { TypeSelectFilter };
