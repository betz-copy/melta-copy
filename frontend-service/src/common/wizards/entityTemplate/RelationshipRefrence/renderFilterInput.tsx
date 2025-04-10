import { DateFilterInput } from '../../../inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from '../../../inputs/FilterInputs/MultipleSelectFilterInput';
import { SelectFilterInput } from '../../../inputs/FilterInputs/SelectFilterInput';

const renderFilterInput = (selectedEntityTemplate: IMongoEntityTemplatePopulated, selectedProperty: string, filter: IFilterRelationReference) => {
    if (!(selectedProperty && selectedEntityTemplate)) return null;
    const { format, enum: propEnum, type, items } = selectedEntityTemplate.properties.properties[selectedProperty];
    // no files in graph filter
    if (items?.format === 'fileId' || format === 'fileId' || format === 'signature') return null;

    if (propEnum)
        return (
            <SelectFilterInput
                filterField={filterField?.filterType === 'text' ? (filterField as IAGGridTextFilter) : undefined}
                enumOptions={propEnum}
                handleFilterFieldChange={handleFilterFieldChange}
                readOnly={readOnly}
            />
        );

    if (format === 'date-time' || format === 'date')
        return (
            <DateFilterInput
                filterField={filterField?.filterType === 'date' ? (filterField as IAGGridDateFilter) : undefined}
                handleFilterTypeChange={handleFilterTypeChange}
                handleDateChange={handleDateChange}
                readOnly={readOnly}
                entityFilter={entityFilter}
            />
        );

    if (type === 'boolean')
        return (
            <SelectFilterInput
                filterField={filterField?.filterType === 'text' ? (filterField as IAGGridTextFilter) : undefined}
                isBooleanSelect
                handleFilterFieldChange={handleFilterFieldChange}
                readOnly={readOnly}
            />
        );

    if (items && selectedEntityTemplate.properties.properties[selectedProperty].items?.enum)
        return (
            <MultipleSelectFilterInput
                filterField={filterField?.filterType === 'set' ? (filterField as IAGGridSetFilter) : undefined}
                handleCheckboxChange={handleCheckboxChange}
                enumOptions={items?.enum}
                readOnly={readOnly}
            />
        );

    if (items?.format === 'user' && type === 'array')
        return (
            <MultipleUserFilterInput
                filterField={filterField?.filterType === 'set' ? (filterField as IAGGridSetFilter) : undefined}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleCheckboxChange={handleCheckboxChange}
                readOnly={readOnly}
            />
        );

    return (
        <TextFilterInput
            entityFilter={entityFilter}
            filterField={
                filterField?.filterType === 'number' || filterField?.filterType === 'text'
                    ? (filterField as IAGGidNumberFilter | IAGGridTextFilter)
                    : undefined
            }
            handleFilterFieldChange={handleFilterFieldChange}
            handleFilterTypeChange={handleFilterTypeChange}
            type={type}
            readOnly={readOnly}
        />
    );
};
