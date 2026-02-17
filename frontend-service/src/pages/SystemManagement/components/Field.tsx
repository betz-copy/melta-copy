import { Autocomplete, InputAdornment, TextField } from '@mui/material';
import { IMetadata, IWorkspace } from '@packages/workspace';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import MeltaSwitch from '../../../common/MeltaDesigns/MeltaSwitch';
import { environment } from '../../../globals';
import { BackendConfigState } from '../../../services/backendConfigService';
import { updateMetadata } from '../../../services/workspacesService';
import { deepClone, setNestedValue } from '../../../utils/configs/configsUtils';
import FieldCard from './FieldCard';

const { unit } = environment;

export type IValue = string | number | boolean | string[];

interface FieldProps {
    keyPath: string;
    value: IValue;
    defaultValue: IValue;
    updateConfig: (path: string, newValue: IValue) => void;
    workspaceMetadata: IWorkspace['metadata'];
    updateWorkspaceMetadata: (changes: Partial<IMetadata>) => void;
    workspaceId: string;
}

const Field: React.FC<FieldProps> = ({ keyPath, value, defaultValue, updateConfig, workspaceMetadata, updateWorkspaceMetadata, workspaceId }) => {
    const queryClient = useQueryClient();

    const translateConfigProp = i18next.t(`DynamicsConfigs.${keyPath}`);

    const [inputValue, setInputValue] = useState<IValue>(value);
    const [isModified, setIsModified] = useState<boolean>(false);
    const isValueDifferentFromDefault = inputValue !== defaultValue;

    useEffect(() => {
        setInputValue(value);
        setIsModified(false);
    }, [value]);

    const isValidInput = (val: IValue) => val !== unit && val !== null && !(typeof val === 'number' && Number.isNaN(val));

    const isGatewayConfig = (path: string) => ['excel.entitiesFileLimit', 'excel.filesLimit'].includes(path);

    const updateConfigValue = async (val: IValue) => {
        updateConfig(keyPath, val);

        const changes: Partial<IMetadata> = {};
        const keys = keyPath.split('.');

        if (keys.length > 1) {
            const parentKey = keys[0];
            const parentObject = deepClone(workspaceMetadata?.[parentKey] || {});
            setNestedValue(parentObject, keys.slice(1).join('.'), val);
            changes[parentKey] = parentObject;
        } else changes[keyPath] = val;

        await updateMetadata(workspaceId, changes);
        updateWorkspaceMetadata(changes);

        if (isGatewayConfig(keyPath)) {
            queryClient.setQueryData<BackendConfigState>('getBackendConfig', (oldData) => {
                if (!oldData) throw new Error('Backend config data is undefined');

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
