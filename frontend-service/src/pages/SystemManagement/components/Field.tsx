/* eslint-disable no-restricted-globals */
import { Autocomplete, InputAdornment, TextField } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import MeltaSwitch from '../../../common/MeltaDesigns/MeltaSwitch';
import { environment } from '../../../globals';
import { IMetadata } from '../../../interfaces/workspaces';
import { BackendConfigState } from '../../../services/backendConfigService';
import { updateMetadata } from '../../../services/workspacesService';
import { deepClone, setNestedValue } from '../../../utils/configs/configsUtils';
import FieldCard from './FieldCard';

interface FieldProps {
    keyPath: string;
    value: string | number | boolean | string[];
    defaultValue: string | number | boolean | string[];
    updateConfig: (path: string, newValue: string | number | boolean | string[]) => void;
    workspaceMetadata: any;
    updateWorkspaceMetadata: (changes: any) => void;
    workspaceId: string;
}

const Field: React.FC<FieldProps> = ({ keyPath, value, defaultValue, updateConfig, workspaceMetadata, updateWorkspaceMetadata, workspaceId }) => {
    const translateConfigProp = i18next.t(`DynamicsConfigs.${keyPath}`);

    const [inputValue, setInputValue] = useState<string | number | boolean | string[]>(value);
    const [isModified, setIsModified] = useState(false);
    const queryClient = useQueryClient();
    const { unit } = environment;
    const isValueDifferentFromDefault = inputValue !== defaultValue;

    useEffect(() => {
        setInputValue(value);
        setIsModified(false);
    }, [value]);

    const isValidInput = (val: string | number | boolean | string[]) => {
        return val !== unit && val !== null && !(typeof val === 'number' && isNaN(val));
    };
    const isGatewayConfig = (path: string) => {
        return path === 'excel.entitiesFileLimit' || path === 'excel.filesLimit';
    };

    const updateConfigValue = async (val: string | number | boolean | string[]) => {
        updateConfig(keyPath, val);

        const changes: Partial<IMetadata> = {};
        const keys = keyPath.split('.');

        if (keys.length > 1) {
            const parentKey = keys[0];
            const parentObject = deepClone(workspaceMetadata[parentKey] || {});
            setNestedValue(parentObject, keys.slice(1).join('.'), val);
            changes[parentKey] = parentObject;
        } else {
            changes[keyPath] = val;
        }

        await updateMetadata(workspaceId, changes);
        updateWorkspaceMetadata(changes);

        if (isGatewayConfig(keyPath)) {
            queryClient.setQueryData<BackendConfigState>('getBackendConfig', (oldData) => {
                if (!oldData) {
                    throw new Error('Backend config data is undefined');
                }
                return {
                    ...oldData,
                    excel: {
                        ...oldData.excel,
                        [keys[1]]: val,
                    },
                };
            });
        }

        setIsModified(false);
    };

    const handleUpdate = async () => {
        if (!isValidInput(inputValue)) return;
        updateConfigValue(inputValue);
    };

    const handleReset = async () => {
        if (defaultValue === undefined) return;
        setInputValue(defaultValue);
        updateConfigValue(defaultValue);
    };

    const handleInputChange = (newValue: string | number | boolean | string[]) => {
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
                    InputProps={{
                        startAdornment:
                            typeof value === 'string' && (value as string).endsWith(unit) ? (
                                <InputAdornment position="start">{unit}</InputAdornment>
                            ) : null,
                        disableUnderline: true,
                    }}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        if (/^\d*$/.test(newValue)) {
                            handleInputChange(`${newValue}${unit}`);
                        } else {
                            handleInputChange(newValue);
                        }
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
                            <TextField {...params} variant="standard" InputProps={{ ...params.InputProps, disableUnderline: true }} />
                        )}
                        style={{ width: '100%' }}
                    />
                );
            }
            break;

        case 'number':
        default:
            inputElement = (
                <TextField
                    type="number"
                    value={inputValue}
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    onChange={(e) => {
                        const newValue = parseInt(e.target.value, 10);
                        if (newValue > 0 || isNaN(newValue)) handleInputChange(newValue);
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
