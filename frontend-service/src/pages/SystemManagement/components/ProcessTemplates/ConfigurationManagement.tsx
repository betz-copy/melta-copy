import React, { useState, useMemo } from 'react';
import { Grid, TextField, Switch, Button, Typography, InputAdornment } from '@mui/material';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { environment } from '../../../../globals';

const deepClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
};

const ConfigurationManagement: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    const configs = useMemo(() => ({ ...environment.dynamicConfigs, ...workspace.metadata }), [workspace]);
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
        console.log({ updated });
    };

    const detectChanges = (original: any, updated: any) => {
        console.log({ original, updated });

        const changes: any = {};
        Object.keys(original).forEach((key) => {
            if (typeof original[key] === 'object' && original[key] !== null && !Array.isArray(original[key])) {
                const nestedChanges = detectChanges(original[key], updated[key]);
                if (Object.keys(nestedChanges).length > 0) {
                    changes[key] = nestedChanges;
                }
            } else if (original[key] !== updated[key]) {
                changes[key] = updated[key];
            }
        });
        return changes;
    };

    const handleUpdate = () => {
        const changes = detectChanges(configs, updatedConfigs);
        console.log('Before Update - Current Metadata (defaults):', configs);
        console.log('Changes:', changes);
    };

    // eslint-disable-next-line consistent-return
    const renderField = (key: string, value: any) => {
        if (typeof value === 'boolean') {
            return (
                <Grid item key={key} xs={12}>
                    <Typography>{key}</Typography>
                    <Switch checked={updatedConfigs[key]} onChange={(e) => updateConfig(key, e.target.checked)} />
                </Grid>
            );
        }
        if (typeof value === 'string') {
            const numericValue = value.endsWith('px') ? value.replace('px', '') : value;

            return (
                <Grid item key={key} xs={12}>
                    <TextField
                        label={key}
                        value={updatedConfigs[key]}
                        defaultValue={numericValue}
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
        }

        if (typeof value === 'number') {
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
        if (typeof value === 'object') {
            return Object.keys(value).map((subkey) => renderField(`${key}.${subkey}`, value[subkey]));
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
