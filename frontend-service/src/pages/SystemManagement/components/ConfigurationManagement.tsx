/* eslint-disable @typescript-eslint/no-shadow */
import React, { useState, useMemo } from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useWorkspaceStore, defaultMetadata } from '../../../stores/workspace';
import { Field } from './Field';
import { deepClone, setNestedValue, getDefaultValue, getValueByPath } from '../../../utils/configs/configsUtils';
import SearchInput from '../../../common/inputs/SearchInput';

const ConfigurationManagement: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const updateWorkspaceMetadata = useWorkspaceStore((state) => state.updateWorkspaceMetadata);

    const configs = workspace.metadata;
    const [updatedConfigs, setUpdatedConfigs] = useState<Record<string, any>>({});
    const [searchText, setSearchText] = useState('');

    useMemo(() => {
        setUpdatedConfigs(deepClone(configs));
    }, [configs]);

    const updateConfig = (path: string, newValue: any) => {
        setUpdatedConfigs((prevConfigs) => {
            const updated = deepClone(prevConfigs);
            setNestedValue(updated, path, newValue);
            return updated;
        });
    };

    const collectFilteredFields = (configs: Record<string, any>, parentKey = ''): React.ReactNode[] => {
        let fields: React.ReactNode[] = [];
        Object.entries(configs).forEach(([key, value]) => {
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
                            updateConfig={updateConfig}
                            workspaceMetadata={workspace.metadata}
                            updateWorkspaceMetadata={updateWorkspaceMetadata}
                            workspaceId={workspace._id}
                        />,
                    );
                }
            }
        });
        return fields;
    };

    const filteredFields = useMemo(() => {
        return collectFilteredFields(configs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configs, updatedConfigs, searchText]);

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
                <SearchInput onChange={setSearchText} borderRadius="7px" placeholder={i18next.t('globalSearch.searchConfig')} />
            </Grid>
            <Grid item xs={12}>
                <Grid container spacing={3}>
                    {filteredFields.length > 0 ? (
                        filteredFields
                    ) : (
                        <Grid item>
                            <Typography>{i18next.t('noSearchResults')}</Typography>
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};

export { ConfigurationManagement };
