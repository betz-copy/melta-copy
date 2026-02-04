import { AppRegistration as AppRegistrationIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Collapse, Divider, Grid, Paper, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getEntityTemplateColor } from '../../../utils/colors';
import { getFirstXFilledPropsKeys } from '../../../utils/templates';
import { CustomIcon } from '../../CustomIcon';
import { EntityPropertiesInternal } from '../../EntityProperties';
import { EntityTemplateColor } from '../../EntityTemplateColor';

interface EntityInfoProps {
    entity: IEntity | null;
    entityTemplate: IEntityTemplatePopulated;
    failedProperties: string[];
}

export const EntityInfo: React.FC<EntityInfoProps> = ({ entity, entityTemplate, failedProperties }) => {
    const [open, setOpen] = useState(false);

    const theme = useTheme();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const {
        numOfPreviewFieldsToShow,
        mainFontSizes: { headlineSubTitleFontSize },
    } = workspace.metadata;

    if (!entity) return <Grid />;

    const entityTemplateColor = entityTemplate ? getEntityTemplateColor(entityTemplate) : '';

    const header = (subHeader = false) => (
        <Grid container gap="20px">
            <Grid>{!subHeader && <EntityTemplateColor entityTemplateColor={entityTemplateColor} style={{ height: '20px' }} />}</Grid>
            {subHeader && (
                <Grid>
                    {entityTemplate.iconFileId ? (
                        <CustomIcon iconUrl={entityTemplate.iconFileId} height="24px" width="24px" />
                    ) : (
                        <AppRegistrationIcon style={{ ...workspace.metadata.iconSize }} fontSize="small" />
                    )}
                </Grid>
            )}
            <Grid>
                <Typography
                    style={{
                        fontSize: headlineSubTitleFontSize,
                        color: theme.palette.primary.main,
                        fontWeight: 'bold',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        width: '130px',
                    }}
                >
                    {entityTemplate?.displayName || ''}
                </Typography>
            </Grid>
        </Grid>
    );

    const entityPropertiesTooltip = (() => {
        if (!entityTemplate || !entity) {
            return '';
        }

        const fieldsToShow = getFirstXFilledPropsKeys(numOfPreviewFieldsToShow, entityTemplate, entity);

        return !fieldsToShow.length ? (
            i18next.t('graph.noPreviewProperties')
        ) : (
            <EntityPropertiesInternal
                properties={entity.properties}
                coloredFields={entity.coloredFields}
                entityTemplate={entityTemplate}
                style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    width: '100%',
                }}
                innerStyle={{ width: '30%', color: 'red' }}
                overridePropertiesToShow={fieldsToShow}
                textWrap
                mode="normal"
                propertiesToHighlightColor="red"
                propertiesToHighlight={failedProperties}
            />
        );
    })();

    return (
        <Grid container onClick={() => setOpen((prev) => !prev)}>
            <Grid paddingTop="8px">
                {open ? (
                    <ExpandLessIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                ) : (
                    <ExpandMoreIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                )}
            </Grid>
            <Paper
                sx={{
                    paddingLeft: '20px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderRadius: '10px',
                    width: 'fit-content',
                    maxWidth: '460px',
                }}
            >
                <Grid container alignItems="center" gap="5px">
                    {header()}
                    <Collapse in={open} timeout="auto" unmountOnExit style={{ width: '460px' }}>
                        <Grid container gap="20px" width="100%" flexDirection="column">
                            <Divider orientation="horizontal" style={{ width: '95%', alignSelf: 'center' }} />
                            <Grid container flexDirection="row" flexWrap="nowrap">
                                <Grid width="5px">
                                    <EntityTemplateColor entityTemplateColor={entityTemplateColor} style={{ height: '80px' }} />
                                </Grid>

                                <Grid container flexDirection="column" width="100%">
                                    <Grid>{header(true)}</Grid>
                                    <Grid paddingLeft="15px">{entityPropertiesTooltip}</Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Collapse>
                </Grid>
            </Paper>
        </Grid>
    );
};
