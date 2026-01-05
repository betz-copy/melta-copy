import { MenuItem } from '@mui/material';
import {
    basicFilterOperationTypes,
    IAgGridDateFilter,
    IAgGridNumberFilter,
    IAgGridTextFilter,
    numberFilterOperationTypes,
    relativeDateFilters,
    textFilterOperationTypes,
} from '@packages/rule-breach';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { StyledFilterInput } from './StyledFilterInput';

type IAgGridFilter = IAgGridNumberFilter | IAgGridDateFilter | IAgGridTextFilter;

interface TypeSelectFilterProps {
    filterField: IAgGridFilter;
    handleFilterTypeChange: (
        newTypeFilter: IAgGridDateFilter['type'] | IAgGridTextFilter['type'] | IAgGridNumberFilter['type'],
        condition?: boolean,
    ) => void;
    readOnly?: boolean;
    type: string;
    filterType?: boolean;
}

const TypeSelectFilter: React.FC<TypeSelectFilterProps> = ({ filterField, handleFilterTypeChange, readOnly, type, filterType }) => {
    const options = useMemo(() => {
        const basicFilters = Object.values(basicFilterOperationTypes);
        const numberFilters = Object.values(numberFilterOperationTypes);
        const textFilters = Object.values(textFilterOperationTypes);
        const dateRelativeFilters = Object.values(relativeDateFilters);

        let allOptions: string[];
        switch (type) {
            case 'text':
            case 'string':
                allOptions = [...basicFilters, ...textFilters];
                break;
            case 'number':
                allOptions = [...basicFilters, ...numberFilters];
                break;
            case 'date':
                allOptions = [...basicFilters, ...numberFilters, ...dateRelativeFilters];
                break;
            default:
                allOptions = basicFilters;
        }

        // Filter out inRange and relative date filters if filterType is true
        if (filterType && type === 'date') {
            return allOptions.filter(
                (option) => option !== numberFilterOperationTypes.inRange && !dateRelativeFilters.includes(option as relativeDateFilters),
            );
        }

        return allOptions;
    }, [type, filterType]);

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
                    {i18next.t(`filters.${type === 'string' ? 'text' : type}.${option}`)}
                </MenuItem>
            ))}
        </StyledFilterInput>
    );
};

export { TypeSelectFilter };
