import React from 'react';
import i18next from 'i18next';
import { Divider, Grid } from '@mui/material';
import { NodeObject } from 'react-force-graph-2d';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { LocalStorage } from '../../utils/localStorage';
import { EntityPropertiesInternal } from '../../common/EntityProperties';
import { NodeLabelIconsDescription } from './NodeLabelIconsDescription';
import { environment } from '../../globals';

const { graphSettings } = environment;

interface NodeTooltipProps {
    node: NodeObject;
    entityTemplate: IMongoEntityTemplatePopulated;
    darkMode: boolean;
    entityTemplates: IEntityTemplateMap;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({ node, entityTemplate, darkMode, entityTemplates }) => {
    return (
        <Grid
            container
            direction="column"
            style={{
                padding: '5px',
                maxWidth: '700px',
                backgroundColor: LocalStorage.get<boolean>(graphSettings.is3DViewLocalStorageKey) ? 'rgba(0, 0, 0, 0.5)' : undefined,
            }}
        >
            <Grid>
                {entityTemplate.propertiesPreview.length ? (
                    <EntityPropertiesInternal
                        properties={node.data}
                        showPreviewPropertiesOnly
                        entityTemplate={entityTemplate}
                        darkMode={darkMode}
                        mode="white"
                        textWrap
                        viewFirstLineOfLongText
                        pureString
                        entityTemplates={entityTemplates}
                    />
                ) : (
                    i18next.t('graph.noPreviewProperties')
                )}
            </Grid>
            {Boolean(node.labelIcons.length) && (
                <Grid>
                    <Divider style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', marginTop: '0.6rem', marginBottom: '0.6rem' }} />
                    <NodeLabelIconsDescription node={node} />
                </Grid>
            )}
        </Grid>
    );
};
