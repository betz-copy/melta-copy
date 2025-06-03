import { useCallback, useState } from 'react';
import debounce from 'lodash/debounce';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter } from '../../../utils/agGrid/interfaces';
import { IFieldFilter } from '../../../interfaces/entityChildTemplates';

export const useFilterInputLogic = ({
    entityTemplate,
    currentFieldName,
    updateFieldFilter,
}: {
    entityTemplate: IMongoEntityTemplatePopulated;
    currentFieldName: string;
    updateFieldFilter: (filterField: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter, currentFieldName: string) => void;
}) => {
    const [inputValue, setInputValue] = useState<string>('');

    const debouncedOnFilter = useCallback(
        debounce((newFilterField) => {
            updateFieldFilter(newFilterField, currentFieldName);
        }, 500),
        [entityTemplate, currentFieldName],
    );

    const handleSetFilterRecord = (newFilterField: IFieldFilter['filterField'], condition: boolean = true) => {
        if (condition) debouncedOnFilter(newFilterField);
    };

    const handleFilterFieldChange = (value: IFieldFilter['filterField'], condition: boolean = true) => {
        if ((value?.filterType === 'number' || value?.filterType === 'text') && (value.filter === undefined || value.filter === '')) {
            return;
        }

        handleSetFilterRecord(value, condition);
    };

    const handleDateChange = (newValue: Date | null, isStartDate: boolean, currentFilterField: IFieldFilter['filterField']) => {
        if (!newValue && currentFilterField?.filterType === 'date') {
            const isRemovingStart = isStartDate && !currentFilterField.dateTo;
            const isRemovingEnd = !isStartDate && !currentFilterField.dateFrom;
            if (isRemovingStart || isRemovingEnd) return;
        }

        handleFilterFieldChange(
            {
                ...currentFilterField,
                ...(isStartDate ? { dateFrom: newValue } : { dateTo: newValue }),
            } as IAGGridDateFilter,
            Boolean(
                isStartDate
                    ? currentFilterField?.filterType === 'date' && newValue && (currentFilterField.type !== 'inRange' || currentFilterField.dateTo)
                    : newValue && currentFilterField?.filterType === 'date' && currentFilterField.type === 'inRange' && currentFilterField.dateFrom,
            ),
        );
    };

    const handleCheckboxChange = (option: string, checked: boolean, currentFilterField: IFieldFilter['filterField']) => {
        const { values } = currentFilterField as IAGGridSetFilter;

        const updatedValues = checked ? [...values, option] : values?.filter((item) => item !== option);
        const updatedFilterField = { ...currentFilterField, values: updatedValues } as IAGGridSetFilter;

        if (updatedValues.length === 0) return;
        handleSetFilterRecord(updatedFilterField);
    };

    const handleFilterTypeChange = (
        newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGidNumberFilter['type'],
        currentFilterField: IFieldFilter['filterField'],
        condition: boolean = true,
    ) =>
        handleFilterFieldChange(
            { ...currentFilterField, type: newTypeFilter } as IAGGridDateFilter | IAGGridTextFilter | IAGGidNumberFilter,
            condition,
        );

    return {
        inputValue,
        setInputValue,
        handleFilterFieldChange,
        handleDateChange,
        handleCheckboxChange,
        handleFilterTypeChange,
    };
};
