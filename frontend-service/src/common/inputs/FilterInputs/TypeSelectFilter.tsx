import { MenuItem } from '@mui/material';
import { FilterTypes, IAgGridDateFilter, IAgGridNumberFilter, IAgGridTextFilter } from '@packages/rule-breach';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { getFilterOptions } from '../../../utils/agGrid/filterOptions';
import { StyledFilterInput } from './StyledFilterInput';

type IAgGridFilter = IAgGridNumberFilter | IAgGridDateFilter | IAgGridTextFilter;

interface TypeSelectFilterProps {
    filterField: IAgGridFilter;
    handleFilterTypeChange: (newTypeFilter: IAgGridFilter['type'], condition?: boolean) => void;
    readOnly?: boolean;
    type: string;
    filterType?: boolean;
}

const TypeSelectFilter: React.FC<TypeSelectFilterProps> = ({ filterField, handleFilterTypeChange, readOnly, type, filterType }) => {
    // TODO: CHECK IF CORRECT
    const options = useMemo(() => getFilterOptions(type, filterType), [type, filterType]);

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
                    e.target.value as IAgGridNumberFilter['type'] | IAgGridTextFilter['type'],
                    Boolean(filterField.filterType === 'date' ? filterField?.dateFrom : filterField?.filter),
                )
            }
            disabled={readOnly}
        >
            {options.map((option: string) => (
                <MenuItem key={option} value={option}>
                    {i18next.t(`filters.${type === FilterTypes.string ? FilterTypes.text : type}.${option}`)}
                </MenuItem>
            ))}
        </StyledFilterInput>
    );
};

export { TypeSelectFilter };
