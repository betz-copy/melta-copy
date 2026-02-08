import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import SearchInput from '../../../common/inputs/SearchInput';
import { IPropertyValue } from '../../../interfaces/entities';
import { IMetadata } from '../../../interfaces/workspaces';
import { BackendConfigState } from '../../../services/backendConfigService';
import { updateMetadata } from '../../../services/workspacesService';
import { defaultMetadata, useWorkspaceStore } from '../../../stores/workspace';
import { deepClone, getDefaultValue, getValueByPath, setNestedValue } from '../../../utils/configs/configsUtils';
import { Field, IValue } from './Field';

const isGatewayConfig = (path: string) => ['excel.entitiesFileLimit', 'excel.filesLimit'].includes(path);

const ConfigurationManagement: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const updateWorkspaceMetadata = useWorkspaceStore((state) => state.updateWorkspaceMetadata);

    const configs = workspace.metadata;
    const [updatedConfigs, setUpdatedConfigs] = useState<Record<string, IPropertyValue>>({});
    const [searchText, setSearchText] = useState<string>('');

    useEffect(() => {
        setUpdatedConfigs(deepClone(configs));
    }, [configs]);

    const queryClient = useQueryClient();

    const updateConfig = useCallback((path: string, newValue: IValue) => {
        setUpdatedConfigs((prevConfigs) => {
            const updated = deepClone(prevConfigs);
            setNestedValue(updated, path, newValue);
            return updated;
        });
    }, []);

    const saveConfig = useCallback(
        async (keyPath: string, val: IValue) => {
            updateConfig(keyPath, val);

            const changes: Partial<IMetadata> = {};
            const keys = keyPath.split('.');

            if (keys.length > 1) {
                const parentKey = keys[0];
                const parentObject = deepClone(workspace.metadata?.[parentKey] || {});
                setNestedValue(parentObject, keys.slice(1).join('.'), val);
                changes[parentKey] = parentObject;
            } else changes[keyPath] = val;

            await updateMetadata(workspace._id, changes);
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
        },
        [workspace.metadata, workspace._id, updateWorkspaceMetadata, updateConfig, queryClient],
    );

    const filteredFields = useMemo(() => {
        const collectFilteredFields = (cfgs: Record<string, IPropertyValue>, parentKey = ''): React.ReactNode[] => {
            let fields: React.ReactNode[] = [];
            Object.entries(cfgs).forEach(([key, value]) => {
                const fullKey = parentKey ? `${parentKey}.${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    fields = fields.concat(collectFilteredFields(value, fullKey));
                } else {
                    const translateConfigProp = i18next.t(`DynamicsConfigs.${fullKey}`);
                    if (!searchText || translateConfigProp.toLowerCase().includes(searchText.toLowerCase())) {
                        fields.push(
                            <Field
                                key={fullKey}
                                keyPath={fullKey}
                                value={getValueByPath(updatedConfigs, fullKey)}
                                defaultValue={getDefaultValue(fullKey, defaultMetadata)}
                                onSave={saveConfig}
                            />,
                        );
                    }
                }
            });
            return fields;
        };

        return collectFilteredFields(configs);
    }, [configs, updatedConfigs, searchText, saveConfig]);

    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <SearchInput onChange={setSearchText} borderRadius="7px" placeholder={i18next.t('globalSearch.searchConfig')} />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <Grid container spacing={3}>
                    {filteredFields.length ? (
                        filteredFields
                    ) : (
                        <Grid>
                            <Typography>{i18next.t('noSearchResults')}</Typography>
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default ConfigurationManagement;
