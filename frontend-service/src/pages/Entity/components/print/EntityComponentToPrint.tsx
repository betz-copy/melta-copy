import ShortcutIcon from '@mui/icons-material/Shortcut';
import { Grid, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import { IEntity } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { IEntityTreeNode } from './ComponentToPrint';

interface IEntityComponentToPrintProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    entity: IEntity;
    options: {
        showEntityDates: boolean;
        showDisabled: boolean;
        addEntityCheckbox?: boolean;
    };
    showPreviewPropertiesOnly?: boolean;
    hierarchicalChildren?: IEntityTreeNode[];
    depth?: number;
}

const EntityComponentToPrint: React.FC<IEntityComponentToPrintProps> = React.memo(
    ({ entityTemplate, entity, options, showPreviewPropertiesOnly, hierarchicalChildren, depth = 0 }) => {
        const queryClient = useQueryClient();

        const { entityTemplates, relationships } = useMemo(
            () => ({
                entityTemplates: queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!,
                relationships: queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!,
            }),
            [queryClient],
        );

        const containerStyle = useMemo(
            () => ({
                backgroundColor: depth === 2 ? '#CCCFE526' : '',
                borderRadius: '8px',
                padding: depth > 1 ? `10px 0px 0px 30px` : '20px 0px',
                flexDirection: 'column' as const,
            }),
            [depth],
        );

        const renderedRelationshipRow = useMemo(() => {
            return (
                <Grid container width="100%" gap="10px" alignItems="center" flexDirection={'row'}>
                    {depth !== 0 ? (
                        <>
                            <Grid display={'flex'} flexDirection={'row'} gap={'10px'}>
                                {depth > 1 && <ShortcutIcon sx={{ fontSize: 16, color: '#9398C2', transform: 'rotate(180deg)' }} />}
                                {options.addEntityCheckbox && <Grid width="20px" height="20px" borderRadius="6px" border="1px solid black" />}
                            </Grid>

                            <Grid
                                container
                                border="1px solid #CCCFE5"
                                borderRadius="8px"
                                paddingX="10px"
                                alignItems="center"
                                gap="10px"
                                sx={{ backgroundColor: 'white' }}
                                width="90%"
                                flexWrap="nowrap"
                            >
                                <Grid>
                                    <Typography fontWeight="600" fontSize="14px">
                                        {entityTemplate.displayName}
                                    </Typography>
                                </Grid>
                                <Grid>
                                    <Typography color="#CCCFE580">|</Typography>
                                </Grid>
                                <Grid>
                                    <EntityPropertiesInternal
                                        properties={entity.properties}
                                        coloredFields={entity.coloredFields}
                                        entityTemplate={entityTemplate}
                                        darkMode={false}
                                        showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                                        mode="normal"
                                        isPrintingMode
                                        showByGroups
                                        textWrap
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'row',
                                            flexWrap: 'nowrap',
                                            alignItems: 'center',
                                            minWidth: 0,
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </>
                    ) : (
                        <Grid
                            sx={{ backgroundColor: '#CCCFE526', border: '1px solid #CCCFE526', borderRadius: '12px', width: '100%', padding: '1rem' }}
                        >
                            <EntityPropertiesInternal
                                properties={entity.properties}
                                coloredFields={entity.coloredFields}
                                entityTemplate={entityTemplate}
                                darkMode={false}
                                showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                                mode="normal"
                                textWrap
                                isPrintingMode
                                showByGroups
                                style={{ width: '100%', display: 'flex', flexDirection: 'row' }}
                            />
                        </Grid>
                    )}
                </Grid>
            );
        }, [depth, entity, entityTemplate, options.addEntityCheckbox, showPreviewPropertiesOnly]);

        const renderedChildren = useMemo(() => {
            if (!hierarchicalChildren || hierarchicalChildren.length === 0) return null;

            return hierarchicalChildren
                .filter((child) => options.showDisabled || !child.properties.disabled)
                .map((child) => {
                    const template = entityTemplates.get(child.templateId);

                    const relationshipId = child.relationshipId;
                    const relationship = relationships.get(relationshipId);

                    if (!template || !relationship) return null;

                    return (
                        <div key={child.properties._id}>
                            <EntityComponentToPrint
                                depth={depth + 1}
                                entityTemplate={template}
                                entity={child}
                                options={options}
                                showPreviewPropertiesOnly
                                hierarchicalChildren={child.children}
                            />
                        </div>
                    );
                })
                .filter(Boolean);
        }, [hierarchicalChildren, options, entityTemplates, relationships, depth]);

        return (
            <Grid container sx={containerStyle}>
                {renderedRelationshipRow}
                {renderedChildren}
            </Grid>
        );
    },
);

export { EntityComponentToPrint };
