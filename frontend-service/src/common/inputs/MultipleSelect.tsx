import { Close, ExpandMore } from '@mui/icons-material';
import { Autocomplete, Grid, MenuItem, TextField, TextFieldProps } from '@mui/material';
import { IPropertyValue } from '@packages/entity-template';
import { IMongoUnit } from '@packages/unit';
import { RJSFSchema } from '@rjsf/utils';
import React from 'react';
import { useQueryClient } from 'react-query';
import { useUnitStore } from '../../stores/unit';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import OverflowWrapper from '../../utils/agGrid/OverflowWrapper';
import { ColoredEnumChip } from '../ColoredEnumChip';
import MeltaCheckbox from '../MeltaDesigns/MeltaCheckbox';

export interface ISelectOption {
    label: string;
    value: string;
    color?: string;
}

const MultipleSelect: React.FC<{
    id: string;
    items: ISelectOption[];
    schema?: RJSFSchema;
    selectedValue: ISelectOption | ISelectOption[] | null;
    onChange: (event: React.SyntheticEvent, newVal: ISelectOption | ISelectOption[] | null) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    variant: 'standard' | 'outlined';
    rawErrors?: string[];
    textFieldProps?: Partial<TextFieldProps>;
    value?: IPropertyValue;
    multiple?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    autofocus?: boolean;
    label?: string;
    color?: string;
    placeholder?: string;
}> = ({
    id,
    items,
    selectedValue,
    onChange,
    onBlur,
    onFocus,
    variant,
    rawErrors = [],
    textFieldProps,
    value,
    multiple,
    disabled,
    readonly,
    autofocus,
    label,
    color,
    placeholder,
    required,
}) => {
    const currentUser = useUserStore((state) => state.user);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const filteredUnits = useUnitStore((state) => state.filteredUnits);

    const queryClient = useQueryClient();
    const units = queryClient.getQueryData<IMongoUnit[]>('getUnits');

    if (schema?.format === 'unitField') {
        items = (disabled ? units : filteredUnits)?.map((unit) => ({ label: unit.name, value: unit._id })) ?? [];

        if (!currentUser.isRoot) items = items.filter((unit) => currentUser.units?.[workspace._id]?.includes(unit.value));
    }

    return (
        <Autocomplete<ISelectOption, boolean, false, false>
            id={id}
            disabled={disabled}
            readOnly={readonly}
            multiple={multiple}
            disableCloseOnSelect={multiple}
            value={selectedValue}
            options={items}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, val) => option?.value === val?.value}
            onChange={onChange}
            popupIcon={<ExpandMore />}
            renderOption={(props, option) => (
                <MenuItem {...props} key={option.value} value={option.value} style={{ height: '40px' }}>
                    {!!value && multiple && <MeltaCheckbox checked={value?.includes(option.value)} />}
                    <ColoredEnumChip {...props} key={option.value} label={option.label} enumColor={option.color || 'default'} />
                </MenuItem>
            )}
            renderValue={(tagValue, getTagProps) => (
                <Grid width="100%">
                    <OverflowWrapper
                        items={Array.isArray(tagValue) ? tagValue : [tagValue]}
                        propertyToDisplayInTooltip="label"
                        getItemKey={(item) => item.value}
                        renderItem={(item, index) => {
                            const { onDelete, ...restTagProps } = getTagProps({ index });

                            return (
                                <ColoredEnumChip
                                    label={item.label}
                                    enumColor={item.color || 'default'}
                                    onDelete={onDelete}
                                    deleteIcon={<Close />}
                                    {...restTagProps}
                                    key={item.value}
                                    style={{ margin: '2px 4px 2px 0' }}
                                />
                            );
                        }}
                    />
                </Grid>
            )}
            renderInput={(params) => {
                const isMultiple = selectedValue && !Array.isArray(selectedValue);
                return (
                    <TextField
                        {...params}
                        {...textFieldProps}
                        autoFocus={autofocus}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        variant={variant}
                        error={!!rawErrors?.length}
                        label={label}
                        placeholder={placeholder}
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                startAdornment: isMultiple ? (
                                    <ColoredEnumChip
                                        label={selectedValue.label}
                                        enumColor={selectedValue.color || 'default'}
                                        style={{ marginLeft: 1 }}
                                    />
                                ) : (
                                    params.InputProps.startAdornment
                                ),
                                inputProps: {
                                    ...params.inputProps,
                                    style: isMultiple ? { display: 'none' } : {},
                                },
                            },
                            inputLabel: { shrink: readonly || undefined, required },
                        }}
                        color={color as TextFieldProps['color']}
                    />
                );
            }}
        />
    );
};

export default MultipleSelect;
