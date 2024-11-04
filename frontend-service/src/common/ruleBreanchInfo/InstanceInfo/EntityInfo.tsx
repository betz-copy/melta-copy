import React, { useState } from 'react';
import { Collapse, Divider, Grid, Typography } from '@mui/material';
import { AppRegistration as AppRegistrationIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { IEntity } from '../../../interfaces/entities';
import { environment } from '../../../globals';
import { IEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { EntityTemplateColor } from '../../EntityTemplateColor';
import { getEntityTemplateColor } from '../../../utils/colors';
import { EntityPropertiesInternal } from '../../EntityProperties';
import { CustomIcon } from '../../CustomIcon';

interface EntityInfoProps {
    entity: IEntity | null;
    entityTemplate: IEntityTemplatePopulated;
    failedProperties: string[];
}

export const EntityInfo: React.FC<EntityInfoProps> = ({ entity, entityTemplate, failedProperties }) => {
    const [open, setOpen] = useState(false);

    if (!entity) return <Grid />;

    const entityTemplateColor = entityTemplate ? getEntityTemplateColor(entityTemplate) : '';

    const header = (subHeader = false) => (
        <Grid item container gap="20px">
            <Grid item>{!subHeader && <EntityTemplateColor entityTemplateColor={entityTemplateColor} style={{ height: '20px' }} />}</Grid>
            {subHeader && (
                <Grid item>
                    {entityTemplate.iconFileId ? (
                        <CustomIcon iconUrl={entityTemplate.iconFileId} height="24px" width="24px" />
                    ) : (
                        <AppRegistrationIcon style={{ ...environment.iconSize }} fontSize="small" />
                    )}
                </Grid>
            )}
            <Grid item>
                <Typography
                    style={{
                        fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                        color: '#101440',
                        fontWeight: '400',
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

    const entityPropertiesTooltip =
        // eslint-disable-next-line no-nested-ternary
        !entityTemplate || !entity ? (
            ''
        ) : !entityTemplate.propertiesPreview.length ? (
            i18next.t('graph.noPreviewProperties')
        ) : (
            <EntityPropertiesInternal
                properties={entity.properties}
                entityTemplate={entityTemplate}
                style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    width: '100%',
                }}
                innerStyle={{ width: '30%', color: 'red' }}
                showPreviewPropertiesOnly
                textWrap
                mode="normal"
                propertiesToHighlightColor="red"
                propertiesToHighlight={failedProperties}
            />
        );

    return (
        <Grid container onClick={() => setOpen((prev) => !prev)}>
            <Grid item paddingTop="8px">
                {open ? (
                    <ExpandLessIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                ) : (
                    <ExpandMoreIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                )}
            </Grid>
            <Grid
                item
                container
                alignItems="center"
                paddingLeft="20px"
                paddingTop="10px"
                paddingBottom="10px"
                gap="5px"
                style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', width: 'fit-content', maxWidth: '460px' }}
            >
                {header()}
                <Collapse in={open} timeout="auto" unmountOnExit style={{ width: '460px' }}>
                    <Grid container item gap="20px" width="100%" flexDirection="column">
                        <Divider orientation="horizontal" style={{ width: '95%', alignSelf: 'center' }} />
                        <Grid container item flexDirection="row" flexWrap="nowrap">
                            <Grid item width="5px">
                                <EntityTemplateColor entityTemplateColor={entityTemplateColor} style={{ height: '80px' }} />
                            </Grid>

                            <Grid container item flexDirection="column">
                                <Grid item>{header(true)}</Grid>
                                <Grid item paddingLeft="15px">
                                    {entityPropertiesTooltip}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Collapse>
            </Grid>
        </Grid>
    );
};
