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
    const renderField = (configKey: string, configValue: any) => {
        switch (typeof configValue) {
            case 'boolean':
                return (
                    <Grid item key={configKey} xs={12}>
                        <Typography>{configKey}</Typography>
                        <Switch checked={updatedConfigs[configKey]} onChange={(e) => updateConfig(configKey, e.target.checked)} />
                    </Grid>
                );
            case 'string':
                // eslint-disable-next-line no-case-declarations
                const numericValue = configValue.endsWith('px') ? configValue.replace('px', '') : configValue;

                return (
                    <Grid item key={configKey} xs={12}>
                        <TextField
                            label={configKey}
                            value={updatedConfigs[configKey]}
                            defaultValue={numericValue}
                            variant="standard"
                            type="number"
                            InputProps={{
                                startAdornment: configValue.endsWith('px') ? <InputAdornment position="start">px</InputAdornment> : null,
                            }}
                            onChange={(e) => {
                                const inputValue = e.target.value;
                                if (/^\d*$/.test(inputValue)) {
                                    updateConfig(configKey, `${inputValue}px`);
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
            case 'number':
                return (
                    <Grid item key={configKey} xs={12}>
                        <TextField
                            label={configKey}
                            type="number"
                            value={updatedConfigs[configKey]}
                            variant="standard"
                            defaultValue={configValue}
                            onChange={(e) => updateConfig(configKey, parseInt(e.target.value, 10))}
                        />
                    </Grid>
                );
            case 'object':
                return Object.keys(configValue).map((subkey) => renderField(`${configKey}.${subkey}`, configValue[subkey]));
            default:
                break;
        }
    };

    return (
        <Grid container spacing={3}>
            {Object.entries(workspace.metadata).map(([configKey, configValue]) => renderField(configKey, configValue))}
            <Grid item xs={12}>
                <Button variant="contained" color="primary" onClick={handleUpdate}>
                    Update
                </Button>
            </Grid>
        </Grid>
    );
};

export { ConfigurationManagement };
