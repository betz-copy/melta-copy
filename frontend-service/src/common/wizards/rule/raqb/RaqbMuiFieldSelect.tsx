import React, { useCallback, useState } from 'react';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import FormControl from '@mui/material/FormControl';
import Tooltip from '@mui/material/Tooltip';
import { FieldProps } from '@react-awesome-query-builder/mui';

// copied file from raqb library. was missing usage of customProps, so copied code and added myself
// https://github.com/ukrbublik/react-awesome-query-builder/blob/6.4.2/packages/mui/modules/widgets/core/MuiFieldSelect.jsx
// meanwhile, added issue to their github to add option for customProps
// added customProps, and fix typescript errors

export default ({
    items,
    setField,
    selectedKey,
    readonly,
    placeholder,
    errorText,
    selectedLabel,
    // selectedOpts,
    selectedAltLabel,
    selectedFullLabel,
    customProps, // meltaTeam - added this, didnt exist in original file!
}: FieldProps) => {
    const [open, setOpen] = useState(false);

    const onOpen = useCallback(() => {
        setOpen(true);
    }, [setOpen]);

    const onClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const renderOptions = (fields, level = 0) =>
        Object.keys(fields).map((fieldKey) => {
            const field = fields[fieldKey];
            // eslint-disable-next-line @typescript-eslint/no-shadow
            const { items, path, label, disabled, matchesType, tooltip } = field;
            const prefix = '\u00A0\u00A0'.repeat(level);
            let finalLabel = (
                <span>
                    {prefix && <span>{prefix}</span>}
                    {matchesType ? <b>{label}</b> : label}
                </span>
            );
            if (tooltip) {
                finalLabel = (
                    <Tooltip title={tooltip} placement="left-start">
                        {finalLabel}
                    </Tooltip>
                );
            }
            if (items) {
                return [
                    // <ListSubheader disabled={disabled} key={path} disableSticky> // disabled prop doesnt exist
                    <ListSubheader key={path} disableSticky>
                        {finalLabel}
                    </ListSubheader>,
                    renderOptions(items, level + 1),
                ];
            }

            // meltaTeam - commented it out. it crashes for me, and not necessary anyways
            // res = (
            //     <MenuItem disabled={disabled} key={path} value={path}>
            //         {finalLabel}
            //     </MenuItem>
            // );
            // return res;
            return (
                <MenuItem disabled={disabled} key={path} value={path}>
                    {finalLabel}
                </MenuItem>
            );
        });

    const onChange = useCallback(
        (e) => {
            if (e.target.value === undefined) return;
            setField(e.target.value);
        },
        [setField],
    );

    const renderValue = useCallback(
        (selectedValue) => {
            if (!readonly && !selectedValue) return placeholder;
            const findLabel = (fields) => {
                return fields.map((field) => {
                    if (!field.items) return field.path === selectedValue ? field.label : null;
                    return findLabel(field.items);
                });
            };
            const label = findLabel(items)
                .filter((v) => {
                    if (Array.isArray(v)) {
                        return v.some((value) => value !== null);
                    }
                    return v !== null;
                })
                .pop();
            return label;
        },
        [readonly, placeholder, items],
    );

    const hasValue = selectedKey != null;
    let tooltipText = selectedAltLabel || selectedFullLabel;
    // eslint-disable-next-line eqeqeq
    if (tooltipText == selectedLabel) tooltipText = null;
    let res = (
        <Select
            error={!!errorText}
            variant="standard"
            autoWidth
            displayEmpty
            onChange={onChange}
            value={hasValue ? selectedKey : ''}
            disabled={readonly}
            renderValue={renderValue}
            size="small"
            open={open}
            onOpen={onOpen}
            onClose={onClose}
            {...customProps} // // added this, didnt exist in original file!
        >
            {renderOptions(items)}
        </Select>
    );
    if (tooltipText) {
        res = <Tooltip title={!open ? tooltipText : null}>{res}</Tooltip>;
    }
    res = <FormControl>{res}</FormControl>;
    return res;
};
