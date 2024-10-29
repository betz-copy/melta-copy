/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useMemo, useEffect } from 'react';
import { Grid, TextField, Switch, Button, Typography, InputAdornment } from '@mui/material';
import i18next from 'i18next';
import { useWorkspaceStore, defaultMetadata } from '../../../../stores/workspace';
import { updateMetadata } from '../../../../services/workspacesService';
import { ViewingCard } from '../Card';

const deepClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
};

const getDefaultValue = (path: string, defaultObj: any) => {
    const keys = path.split('.');
    let obj = defaultObj;

    for (const key of keys) {
        if (obj[key] !== undefined) {
            obj = obj[key];
        } else {
            return undefined;
        }
    }
    return obj;
};

const setNestedValue = (obj: Object, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
};

const ConfigurationManagement: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const updateWorkspaceMetadata = useWorkspaceStore((state) => state.updateWorkspaceMetadata);

    const configs = useMemo(() => ({ ...workspace.metadata, ...workspace.metadata }), [workspace]);
    const [updatedConfigs, setUpdatedConfigs] = useState<any>({});

    useEffect(() => {
        setUpdatedConfigs(deepClone(configs));
    }, [configs]);

    const updateConfig = (path: string, newValue: any) => {
        const updated = deepClone(updatedConfigs);
        setNestedValue(updated, path, newValue);
        setUpdatedConfigs(updated);
    };

    const detectChanges = (original: any, updated: any) => {
        const changes: any = {};

        Object.keys(original).forEach((key) => {
            if (typeof original[key] === 'object' && original[key] !== null && !Array.isArray(original[key])) {
                const nestedChanges = detectChanges(original[key], updated?.[key] || defaultMetadata[key]);

                if (Object.keys(nestedChanges).length > 0) {
                    changes[key] = { ...original[key], ...nestedChanges };
                }
            } else if (original[key] !== updated?.[key] && updated?.[key] !== undefined) {
                changes[key] = updated[key];
            }
        });

        return changes;
    };

    const renderField = (key: string, value: any) => {
        const translateConfigProp = i18next.t(`DynamicsConfigs.${key}`);

        const [inputValue, setInputValue] = useState(value);
        const [isModified, setIsModified] = useState(false);

        const defaultValue = getDefaultValue(key, defaultMetadata);

        const isValueDifferentFromDefault = inputValue !== defaultValue;

        const handleUpdate = async () => {
            const changes = detectChanges(configs, updatedConfigs);
            console.log({ changes });
            if (Object.keys(changes).length === 0 || Object.keys(changes).length > 1) return;
            const updatedMetadata = await updateMetadata(workspace._id, changes);
            updateWorkspaceMetadata(changes);
            setUpdatedConfigs(updatedMetadata);
            setIsModified(false);
        };

        const handleReset = async () => {
            if (defaultValue === undefined) return;
            setInputValue(defaultValue);
            const resetConfigs = deepClone(defaultMetadata);
            setUpdatedConfigs(resetConfigs);
            await updateMetadata(workspace._id, resetConfigs);
            updateWorkspaceMetadata(resetConfigs);
            setIsModified(false);
        };

        const handleInputChange = (newValue: any) => {
            setInputValue(newValue);
            updateConfig(key, newValue);
            setIsModified(newValue !== value);
        };

        switch (typeof value) {
            case 'string':
                return (
                    <Grid item key={key} xs={12} sm={6} md={4} lg={3}>
                        <ViewingCard
                            width={400}
                            title={
                                <Grid direction="column" container gap="10px">
                                    <Grid
                                        item
                                        container
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        paddingLeft="20px"
                                        flexWrap="nowrap"
                                    >
                                        <Grid alignItems="center">
                                            <Typography sx={{ fontSize: '14px', fontWeight: '400', color: 'rgb(30, 39, 117)' }}>
                                                {translateConfigProp}
                                            </Typography>
                                            <TextField
                                                value={inputValue.endsWith('px') ? inputValue.replace('px', '') : inputValue}
                                                variant="standard"
                                                type="number"
                                                InputProps={{
                                                    startAdornment: value.endsWith('px') ? (
                                                        <InputAdornment position="start">px</InputAdornment>
                                                    ) : null,
                                                    disableUnderline: true,
                                                }}
                                                onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    if (/^\d*$/.test(newValue)) {
                                                        handleInputChange(`${newValue}px`);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (['e', 'E', '+', '-'].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid item container direction="row" justifyContent="space-between" alignItems="center" flexWrap="nowrap">
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleUpdate}
                                            sx={{ fontSize: '12px' }}
                                            disabled={!isModified}
                                        >
                                            {i18next.t('schedule.schedule.updateButton')}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleReset}
                                            sx={{ fontSize: '12px' }}
                                            disabled={!isValueDifferentFromDefault}
                                        >
                                            {i18next.t('schedule.schedule.resetButton')}
                                        </Button>
                                    </Grid>
                                </Grid>
                            }
                        />
                    </Grid>
                );
            case 'boolean':
                return (
                    <Grid item key={key} xs={12} sm={6} md={4} lg={3}>
                        <Typography>{key}</Typography>
                        <Switch checked={updatedConfigs[key]} onChange={(e) => updateConfig(key, e.target.checked)} />
                    </Grid>
                );
            case 'object':
                return Object.keys(value).map((subkey) => renderField(`${key}.${subkey}`, value[subkey]));
            case 'number':
            default:
                return (
                    <Grid item key={key} xs={12} sm={6} md={4} lg={3}>
                        <ViewingCard
                            width={400}
                            title={
                                <Grid direction="column" container gap="10px">
                                    <Grid
                                        item
                                        container
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        paddingLeft="20px"
                                        flexWrap="nowrap"
                                    >
                                        <Grid alignItems="center">
                                            <Typography sx={{ fontSize: '14px', fontWeight: '400', color: 'rgb(30, 39, 117)' }}>
                                                {translateConfigProp}
                                            </Typography>
                                            <TextField
                                                type="number"
                                                value={inputValue}
                                                variant="standard"
                                                InputProps={{ disableUnderline: true }}
                                                onChange={(e) => {
                                                    const newValue = parseInt(e.target.value, 10);
                                                    handleInputChange(newValue);
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid item container direction="row" justifyContent="space-between" alignItems="center" flexWrap="nowrap">
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleUpdate}
                                            sx={{ fontSize: '12px' }}
                                            disabled={!isModified}
                                        >
                                            {i18next.t('schedule.schedule.updateButton')}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleReset}
                                            sx={{ fontSize: '12px' }}
                                            disabled={!isValueDifferentFromDefault}
                                        >
                                            {i18next.t('schedule.schedule.resetButton')}
                                        </Button>
                                    </Grid>
                                </Grid>
                            }
                        />
                    </Grid>
                );
        }
    };

    return (
        <Grid container spacing={3} sx={{ marginTop: '20px' }}>
            {Object.entries(workspace.metadata).map(([configKey, configValue]) => renderField(configKey, configValue))}
        </Grid>
    );
};

export { ConfigurationManagement };
