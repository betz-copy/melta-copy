import React, { useState, useMemo } from 'react';
import { Grid, TextField, Switch, Button, Typography, InputAdornment } from '@mui/material';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { updateMetadata } from '../../../../services/workspacesService';

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
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = newValue;

        setUpdatedConfigs(updated);
    };

    const detectChanges = (original: any, updated: any) => {
        const changes: any = {};

        Object.keys(original).forEach((key) => {
            if (typeof original[key] === 'object' && original[key] !== null && !Array.isArray(original[key])) {
                const nestedChanges = detectChanges(original[key], updated?.[key] || {});
                if (Object.keys(nestedChanges).length > 0) {
                    changes[key] = nestedChanges;
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

    // eslint-disable-next-line consistent-return
    const renderField = (key: string, value: any) => {
        switch (typeof value) {
            case 'string':
                return (
                    <Grid item key={key} xs={12}>
                        <TextField
                            label={key}
                            value={updatedConfigs[key]}
                            defaultValue={value.endsWith('px') ? value.replace('px', '') : value}
                            variant="standard"
                            type="number"
                            InputProps={{
                                startAdornment: value.endsWith('px') ? <InputAdornment position="start">px</InputAdornment> : null,
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
                        <TextField
                            label={key}
                            type="number"
                            value={updatedConfigs[key]}
                            variant="standard"
                            defaultValue={value}
                            onChange={(e) => updateConfig(key, parseInt(e.target.value, 10))}
                        />
                    </Grid>
                );
        }
    };

    return (
        <Grid container spacing={3}>
            {Object.keys(configs).map((key) => renderField(key, configs[key]))}
            <Grid item xs={12}>
                <Button variant="contained" color="primary" onClick={handleUpdate}>
                    Update
                </Button>
            </Grid>
        </Grid>
    );
};

export { ConfigurationManagement };
