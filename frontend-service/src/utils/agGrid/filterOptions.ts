import {
    BasicFilterOperationTypes,
    FilterTypes,
    NumberFilterOperationTypes,
    RelativeDateFilters,
    TextFilterOperationTypes,
} from '@packages/rule-breach';

export const getFilterOptions = (type: string, excludeComplexFilters = false): string[] => {
    const basicFilters = Object.values(BasicFilterOperationTypes);
    const numberFilters = Object.values(NumberFilterOperationTypes);
    const textFilters = Object.values(TextFilterOperationTypes);
    const dateRelativeFilters = Object.values(RelativeDateFilters);

    let allOptions: string[];

    switch (type) {
        case FilterTypes.text:
        case FilterTypes.string:
            allOptions = [...basicFilters, ...textFilters];
            break;
        case FilterTypes.number:
            allOptions = [...basicFilters, ...numberFilters];
            break;
        case FilterTypes.date:
            allOptions = [...basicFilters, ...numberFilters, ...dateRelativeFilters];
            break;
        default:
            allOptions = basicFilters;
    }

    if (excludeComplexFilters && type === FilterTypes.date) {
        return allOptions.filter(
            (option) => option !== NumberFilterOperationTypes.inRange && !dateRelativeFilters.includes(option as RelativeDateFilters),
        );
    }

    return allOptions;
};
