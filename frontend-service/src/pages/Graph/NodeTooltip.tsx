import React from 'react';
import i18next from 'i18next';
import { Divider, Grid } from '@mui/material';
import { NodeObject } from 'react-force-graph-2d';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { LocalStorage } from '../../utils/localStorage';
import { EntityPropertiesInternal } from '../../common/EntityProperties';
import { NodeLabelIconsDescription } from './NodeLabelIconsDescription';
import { environment } from '../../globals';

const { graphSettings } = environment;

interface NodeTooltipProps {
    node: NodeObject;
    entityTemplate: IMongoEntityTemplatePopulated;
    darkMode: boolean;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({ node, entityTemplate, darkMode }) => {
    return (
        <Grid
            container
            direction="column"
            style={{
                padding: '0.4rem',
                backgroundColor: LocalStorage.get<boolean>(graphSettings.is3DViewLocalStorageKey) ? 'rgba(0, 0, 0, 0.5)' : undefined,
            }}
        >
            <Grid item>
                {entityTemplate.propertiesPreview.length ? (
                    <EntityPropertiesInternal properties={node.data} showPreviewPropertiesOnly entityTemplate={entityTemplate} darkMode={darkMode} />
                ) : (
                    i18next.t('graph.noPreviewProperties')
                )}
            </Grid>
            {Boolean(node.labelIcons.length) && (
                <Grid item>
                    <Divider style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', marginTop: '0.6rem', marginBottom: '0.6rem' }} />
                    <NodeLabelIconsDescription node={node} />
                </Grid>
            )}
        </Grid>
    );
};
