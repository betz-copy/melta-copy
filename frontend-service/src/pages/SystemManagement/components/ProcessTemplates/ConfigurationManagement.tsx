import React, { useState, useMemo } from 'react';
import { Grid } from '@mui/material';
import { useWorkspaceStore, defaultMetadata } from '../../../../stores/workspace';
import { Field } from './Field';
import { deepClone, setNestedValue, getDefaultValue, getValueByPath } from '../../../../utils/configs/configsUtils';

const ConfigurationManagement: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const updateWorkspaceMetadata = useWorkspaceStore((state) => state.updateWorkspaceMetadata);

    const configs = workspace.metadata;
    const [updatedConfigs, setUpdatedConfigs] = useState<any>({});

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

    // eslint-disable-next-line @typescript-eslint/no-shadow
    const renderFields = (configs: any, parentKey = '') => {
        return Object.entries(configs).map(([key, value]) => {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return renderFields(value, fullKey);
            }
            return (
                <Field
                    key={fullKey}
                    keyPath={fullKey}
                    value={getValueByPath(updatedConfigs, fullKey)}
                    defaultValue={getDefaultValue(fullKey, defaultMetadata)}
                    updateConfig={updateConfig}
                    workspaceMetadata={workspace.metadata}
                    updateWorkspaceMetadata={updateWorkspaceMetadata}
                    workspaceId={workspace._id}
                />
            );
        });
    };

    return (
        <Grid container spacing={3} sx={{ marginTop: '20px' }}>
            {renderFields(configs)}
        </Grid>
    );
};

export { ConfigurationManagement };
