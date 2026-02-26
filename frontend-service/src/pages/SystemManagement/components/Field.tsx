import { Autocomplete, InputAdornment, TextField } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import MeltaSwitch from '../../../common/MeltaDesigns/MeltaSwitch';
import { environment } from '../../../globals';
import FieldCard from './FieldCard';

const { unit } = environment;

export type IValue = string | number | boolean | string[];

interface FieldProps {
    keyPath: string;
    value: IValue;
    defaultValue: IValue;
    onSave: (keyPath: string, newValue: IValue) => Promise<void>;
}

const Field: React.FC<FieldProps> = ({ keyPath, value, defaultValue, onSave }) => {
    const translateConfigProp = i18next.t(`DynamicsConfigs.${keyPath}`);

    const [inputValue, setInputValue] = useState<IValue>(value);
    const [isModified, setIsModified] = useState<boolean>(false);
    const isValueDifferentFromDefault = inputValue !== defaultValue;

    useEffect(() => {
        setInputValue(value);
        setIsModified(false);
    }, [value]);

    const isValidInput = (val: IValue) => val !== unit && val !== null && !(typeof val === 'number' && Number.isNaN(val));

    const handleUpdate = async () => {
        if (!isValidInput(inputValue)) return;
        await onSave(keyPath, inputValue);
        setIsModified(false);
    };

    const handleReset = async () => {
        if (defaultValue === undefined) return;
        setInputValue(defaultValue);
        await onSave(keyPath, defaultValue);
        setIsModified(false);
    };

    const handleInputChange = (newValue: IValue) => {
        setInputValue(newValue);
        setIsModified(isValidInput(newValue) && newValue !== value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
            handleUpdate();
        }
    };

    let inputElement: React.ReactNode;

    switch (typeof value) {
        case 'string':
            inputElement = (
                <TextField
                    value={typeof inputValue === 'string' && inputValue.endsWith(unit) ? inputValue.replace(unit, '') : inputValue}
                    variant="standard"
                    type={typeof inputValue === 'string' && inputValue.endsWith(unit) ? 'number' : 'text'}
                    slotProps={{
                        input: {
                            startAdornment:
                                typeof value === 'string' && (value as string).endsWith(unit) ? (
                                    <InputAdornment position="start">{unit}</InputAdornment>
                                ) : null,
                            disableUnderline: true,
                        },
                    }}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        if (/^\d*$/.test(newValue)) handleInputChange(`${newValue}${unit}`);
                        else handleInputChange(newValue);
                    }}
                    onKeyDown={handleKeyDown}
                />
            );
            break;
        case 'boolean':
            inputElement = (
                <MeltaSwitch
                    id={keyPath}
                    name={keyPath}
                    checked={Boolean(inputValue)}
                    onChange={(event) => {
                        const newValue = event.target.checked;
                        handleInputChange(newValue);
                    }}
                    onKeyDown={handleKeyDown}
                />
            );
            break;

        case 'object':
            if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
                inputElement = (
                    <Autocomplete
                        multiple
                        freeSolo
                        options={[]}
                        value={(inputValue as string[]) || []}
                        onChange={(_e, newValue) => {
                            const trimmed = newValue.map((v) => v.trim()).filter((v) => v.length > 0);
                            handleInputChange(trimmed);
                        }}
                        isOptionEqualToValue={(option, val) => option.trim() === val.trim()}
                        filterSelectedOptions
                        renderInput={(params) => (
                            <TextField {...params} variant="standard" slotProps={{ input: { ...params.InputProps, disableUnderline: true } }} />
                        )}
                        style={{ width: '100%' }}
                    />
                );
            }
            break;

        default:
            inputElement = (
                <TextField
                    type="number"
                    value={inputValue}
                    variant="standard"
                    slotProps={{ input: { disableUnderline: true } }}
                    onChange={(e) => {
                        const newValue = parseInt(e.target.value, 10);
                        if (newValue > 0 || Number.isNaN(newValue)) handleInputChange(newValue);
                    }}
                    onKeyDown={handleKeyDown}
                />
            );
            break;
    }

    return (
        <FieldCard
            keyPath={keyPath}
            title={translateConfigProp}
            input={inputElement}
            handleUpdate={handleUpdate}
            isModified={isModified}
            handleReset={handleReset}
            isValueDifferentFromDefault={isValueDifferentFromDefault}
        />
    );
};

export { Field };
