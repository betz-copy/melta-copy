import { MenuItem } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { environment } from '../../../globals';
import { IAGGridDateFilter, IAGGridNumberFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';

const { filterOptions } = environment;

type IAGGridFilter = IAGGridNumberFilter | IAGGridDateFilter | IAGGridTextFilter;

interface TypeSelectFilterProps {
    filterField: IAGGridFilter;
    handleFilterTypeChange: (newTypeFilter: IAGGridFilter['filterType'], condition?: boolean) => void;
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
            slotProps={{
                htmlInput: {
                    readOnly,
                    style: {
                        textOverflow: 'ellipsis',
                    },
                },
                select: { IconComponent: IoIosArrowDown },
            }}
            onChange={(e) =>
                handleFilterTypeChange(
                    e.target.value as IAGGridNumberFilter['type'] | IAGGridTextFilter['type'],
                    Boolean(filterField.filterType === 'date' ? filterField?.dateFrom : filterField?.filter),
                )
            }
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
