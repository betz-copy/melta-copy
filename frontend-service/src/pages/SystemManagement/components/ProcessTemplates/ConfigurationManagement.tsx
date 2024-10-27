import React, { useState, useMemo } from 'react';
import { Grid, TextField, Switch, Button, Typography, InputAdornment, Card } from '@mui/material';
import i18next from 'i18next';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { updateMetadata } from '../../../../services/workspacesService';
import { ViewingCard } from '../Card';

const deepClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
};

const ConfigurationManagement: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const updateWorkspaceMetadata = useWorkspaceStore((state) => state.updateWorkspaceMetadata);

    const configs = useMemo(() => ({ ...workspace.metadata, ...workspace.metadata }), [workspace]);
    const [updatedConfigs, setUpdatedConfigs] = useState<any>({});

    const updateConfig = (path: string, newValue: any) => {
        const keys = path.split('.');
        const updated = deepClone(updatedConfigs);

        let obj = updated;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = deepClone(configs[keys[i]]) || {};
            }
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = newValue;

        setUpdatedConfigs(updated);
    };

    const resetToDefault = (path: string) => {
        const keys = path.split('.');
        const updated = deepClone(updatedConfigs);

        let obj = updated;
        let defaultObj = workspace.metadata;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = deepClone(configs[keys[i]]) || {};
            }
            obj = obj[keys[i]];
            defaultObj = defaultObj[keys[i]];
        }

        obj[keys[keys.length - 1]] = defaultObj[keys[keys.length - 1]];
        setUpdatedConfigs(updated);
    };

    const detectChanges = (original: any, updated: any) => {
        const changes: any = {};

        Object.keys(original).forEach((key) => {
            if (typeof original[key] === 'object' && original[key] !== null && !Array.isArray(original[key])) {
                const nestedChanges = detectChanges(original[key], updated?.[key] || {});
                if (Object.keys(nestedChanges).length > 0) {
                    changes[key] = { ...original[key], ...nestedChanges };
                }
            } else if (original[key] !== updated?.[key] && updated?.[key] !== undefined) {
                changes[key] = updated[key];
            }
        });

        return changes;
    };

    const handleUpdate = async () => {
        const changes = detectChanges(configs, updatedConfigs);

        if (Object.keys(changes).length === 0) {
            return;
        }
        const updatedMetadata = await updateMetadata(workspace._id, changes);
        updateWorkspaceMetadata(changes);
        setUpdatedConfigs(updatedMetadata);
    };

    const renderField = (key: string, value: any) => {
        const translateConfigProp = i18next.t(`DynamicsConfigs.${key}`);

        switch (typeof value) {
            case 'string':
                return (
                    <Grid item key={key} xs={12}>
                        <ViewingCard
                            width={300}
                            title={
                                <TextField
                                    label={translateConfigProp}
                                    value={updatedConfigs[key]}
                                    defaultValue={value.endsWith('px') ? value.replace('px', '') : value}
                                    variant="standard"
                                    type="number"
                                    sx={{ width: '290px' }}
                                    InputProps={{
                                        startAdornment: value.endsWith('px') ? <InputAdornment position="start">px</InputAdornment> : null,
                                        disableUnderline: true,
                                    }}
                                    onChange={(e) => {
                                        const inputValue = e.target.value;
                                        if (/^\d*$/.test(inputValue)) {
                                            updateConfig(key, `${inputValue}px`);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (['e', 'E', '+', '-'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            }
                        />
                        <Button variant="contained" color="primary" onClick={handleUpdate}>
                            Update
                        </Button>
                        <Button variant="contained" color="primary" onClick={() => resetToDefault(key)}>
                            Reset
                        </Button>
                    </Grid>
                );
            case 'boolean':
                return (
                    <Grid item key={key} xs={12}>
                        <Typography>{key}</Typography>
                        <Switch checked={updatedConfigs[key]} onChange={(e) => updateConfig(key, e.target.checked)} />
                    </Grid>
                );
            case 'object':
                return Object.keys(value).map((subkey) => renderField(`${key}.${subkey}`, value[subkey]));
            case 'number':
            default:
                return (
                    <Grid item key={key} xs={12}>
                        <ViewingCard
                            width={300}
                            title={
                                <TextField
                                    label={translateConfigProp}
                                    type="number"
                                    value={updatedConfigs[key]}
                                    variant="standard"
                                    defaultValue={value}
                                    InputProps={{ disableUnderline: true }}
                                    onChange={(e) => updateConfig(key, parseInt(e.target.value, 10))}
                                    sx={{ width: '290px' }}
                                />
                            }
                        />
                        <Button variant="contained" color="primary" onClick={handleUpdate}>
                            Update
                        </Button>
                    </Grid>
                );
        }
    };

    return (
        <Grid container spacing={3}>
            {Object.entries(workspace.metadata).map(([configKey, configValue]) => renderField(configKey, configValue))}
            <Grid item xs={12}>
                {/* <Button variant="contained" color="primary" onClick={handleUpdate}>
                    Update
                </Button> */}
            </Grid>
        </Grid>
    );
};

export { ConfigurationManagement };
