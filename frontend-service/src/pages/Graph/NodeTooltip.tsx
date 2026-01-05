import { Divider, Grid } from '@mui/material';
import { IEntityTemplateMap, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import React from 'react';
import { NodeObject } from 'react-force-graph-2d';
import { EntityPropertiesInternal } from '../../common/EntityProperties';
import { environment } from '../../globals';
import { LocalStorage } from '../../utils/localStorage';
import { NodeLabelIconsDescription } from './NodeLabelIconsDescription';

const { graphSettings } = environment;

interface NodeTooltipProps {
    node: NodeObject;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    darkMode: boolean;
    entityTemplates: IEntityTemplateMap;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({ node, entityTemplate, darkMode, entityTemplates }) => {
    const { coloredFields, ...properties } = node.data;

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
                        properties={properties}
                        coloredFields={coloredFields}
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
