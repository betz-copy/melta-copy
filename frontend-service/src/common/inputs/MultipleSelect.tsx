import { Close, ExpandMore } from '@mui/icons-material';
import { Autocomplete, Grid, MenuItem, TextField, TextFieldProps } from '@mui/material';
import React from 'react';
import OverflowWrapper from '../../utils/agGrid/OverflowWrapper';
import { ColoredEnumChip } from '../ColoredEnumChip';
import MeltaCheckbox from '../MeltaDesigns/MeltaCheckbox';
import { RJSFSchema } from '@rjsf/utils';
import { useUserStore } from '../../stores/user';
import { IUser } from '../../interfaces/users';
import { useWorkspaceStore } from '../../stores/workspace';

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
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
    variant: 'standard' | 'outlined';
    rawErrors: string[];
    textFieldProps: any;
    value?: any;
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
    schema,
    selectedValue,
    onChange,
    onBlur,
    onFocus,
    variant,
    rawErrors,
    textFieldProps,
    value,
    multiple,
    disabled,
    readonly,
    autofocus,
    label,
    color,
    placeholder,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore<IUser>((state) => state.user);

    if (schema?.format === 'unitField') {
        items = workspace.metadata.unitsArray.map((unit) => ({ label: unit, value: unit }));

        if (!currentUser.isRoot) items = items.filter((unit) => currentUser.units?.[workspace._id]?.includes(unit.label));
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
                    <ColoredEnumChip {...props} key={option.value} label={option.label} color={option.color || 'default'} />
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
                                    color={item.color || 'default'}
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
                        error={rawErrors.length > 0}
                        label={label}
                        placeholder={placeholder}
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                startAdornment: isMultiple ? (
                                    <ColoredEnumChip label={selectedValue.label} color={selectedValue.color || 'default'} style={{ marginLeft: 1 }} />
                                ) : (
                                    params.InputProps.startAdornment
                                ),
                                inputProps: {
                                    ...params.inputProps,
                                    style: isMultiple ? { display: 'none' } : {},
                                },
                            },
                            inputLabel: { shrink: readonly || undefined },
                        }}
                        color={color as TextFieldProps['color']}
                    />
                );
            }}
        />
    );
};

export default MultipleSelect;
