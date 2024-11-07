import React, { useState, useEffect } from 'react';
import { Grid, TextField, Switch, Button, Typography, InputAdornment } from '@mui/material';
import i18next from 'i18next';
import { updateMetadata } from '../../../../services/workspacesService';
import { ViewingCard } from '../Card';
import { deepClone, setNestedValue } from '../../../../utils/configs/configsUtils';

interface FieldProps {
    keyPath: string;
    value: string | number | boolean;
    defaultValue: string | number | boolean;
    updateConfig: (path: string, newValue: string | number | boolean) => void;
    workspaceMetadata: any;
    updateWorkspaceMetadata: (changes: any) => void;
    workspaceId: string;
}

const Field: React.FC<FieldProps> = ({ keyPath, value, defaultValue, updateConfig, workspaceMetadata, updateWorkspaceMetadata, workspaceId }) => {
    const translateConfigProp = i18next.t(`DynamicsConfigs.${keyPath}`);

    const [inputValue, setInputValue] = useState<string | number | boolean>(value);
    const [isModified, setIsModified] = useState(false);

    const isValueDifferentFromDefault = inputValue !== defaultValue;

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleUpdate = async () => {
        updateConfig(keyPath, inputValue);

        const changes = {};
        const keys = keyPath.split('.');

        if (keys.length > 1) {
            const parentKey = keys[0];
            const parentObject = deepClone(workspaceMetadata[parentKey] || {});
            setNestedValue(parentObject, keys.slice(1).join('.'), inputValue);
            changes[parentKey] = parentObject;
        } else {
            changes[keyPath] = inputValue;
        }

        await updateMetadata(workspaceId, changes);
        updateWorkspaceMetadata(changes);
        setIsModified(false);
    };

    const handleReset = async () => {
        if (defaultValue === undefined) return;

        setInputValue(defaultValue);
        updateConfig(keyPath, defaultValue);

        const changes = {};
        const keys = keyPath.split('.');

        if (keys.length > 1) {
            const parentKey = keys[0];
            const parentObject = deepClone(workspaceMetadata[parentKey] || {});
            setNestedValue(parentObject, keys.slice(1).join('.'), defaultValue);
            changes[parentKey] = parentObject;
        } else {
            changes[keyPath] = defaultValue;
        }

        await updateMetadata(workspaceId, changes);
        updateWorkspaceMetadata(changes);
        setIsModified(false);
    };

    const handleInputChange = (newValue: string | number) => {
        setInputValue(newValue);
        setIsModified(newValue !== value);
    };

    switch (typeof value) {
        case 'string':
            return (
                <Grid item key={keyPath}>
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
                                    <Grid item>
                                        <Typography sx={{ fontSize: '14px', fontWeight: '400', color: 'rgb(30, 39, 117)' }}>
                                            {translateConfigProp}
                                        </Typography>
                                        <TextField
                                            value={
                                                typeof inputValue === 'string' && inputValue.endsWith('px')
                                                    ? inputValue.replace('px', '')
                                                    : inputValue
                                            }
                                            variant="standard"
                                            type="number"
                                            InputProps={{
                                                startAdornment: value.endsWith('px') ? <InputAdornment position="start">px</InputAdornment> : null,
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
            console.log({ inputValue });

            return (
                <Grid item key={keyPath}>
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
                                    <Grid item>
                                        <Typography sx={{ fontSize: '14px', fontWeight: '400', color: 'rgb(30, 39, 117)' }}>
                                            {translateConfigProp}
                                        </Typography>
                                        <Switch
                                            id={keyPath}
                                            name={keyPath}
                                            value={Boolean(inputValue)}
                                            onClick={() => {
                                                setInputValue((prev) => !prev);
                                                setIsModified((prev) => !prev);
                                            }}
                                            checked={Boolean(inputValue)}
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
        case 'number':
        default:
            return (
                <Grid item key={keyPath}>
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
                                    <Grid item>
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

export { Field };
