import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Box, Collapse, Grid, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { IActionPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IBrokenRulePopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IMongoRule } from '../../../interfaces/rules';
import {
    getActionsByFailureOnEntity,
    getActionsByFailureOnRelationship,
    getEntityForEntityInfo,
    getRelationshipForRelationshipInfo,
} from '../../../utils/ruleBreach/ruleBreachActions';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { EntityInfo } from '../InstanceInfo/EntityInfo';
import { RelationshipInfo } from '../InstanceInfo/RelationshipInfo';
import { BrokenRuleActions } from './BrokenRuleActions';
import { RuleIcon } from './RuleIcon';

export const BrokenRuleFull: React.FC<{
    brokenRule: IBrokenRulePopulated;
    ruleTemplate: IMongoRule;
    actions: IActionPopulated[];
}> = ({ brokenRule, ruleTemplate, actions }) => {
    const [openRule, setOpenRule] = useState(false);
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const entityTemplate = entityTemplates.get(ruleTemplate.entityTemplateId)!;

    return (
        <>
            <ListItemButton onClick={() => setOpenRule((prev) => !prev)}>
                <ListItemIcon>
                    <RuleIcon ruleType={ruleTemplate.actionOnFail} />
                </ListItemIcon>
                <ListItemText secondary={i18next.t('ruleBreachInfo.relevantEntities')}>
                    <MeltaTooltip title={ruleTemplate.description}>
                        <Box component="span" sx={{ fontWeight: 'bold' }}>
                            {ruleTemplate.name}
                        </Box>
                    </MeltaTooltip>
                </ListItemText>
                {openRule ? (
                    <ExpandLessIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                ) : (
                    <ExpandMoreIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                )}
            </ListItemButton>
            <Collapse in={openRule} timeout="auto" unmountOnExit>
                <Grid>
                    <List dense component="div" disablePadding>
                        {brokenRule.failures.map(({ entity, causes }, i) => {
                            const causeOfMainEntityIndex = causes.findIndex(({ instance }) => {
                                const currEntityOfCause = instance.aggregatedRelationship
                                    ? instance.aggregatedRelationship.otherEntity
                                    : instance.entity;
                                return isEqual(currEntityOfCause, entity);
                            });

                            const causesWithoutMainEntity = causes.slice();
                            if (causeOfMainEntityIndex > -1) causesWithoutMainEntity.splice(causeOfMainEntityIndex, 1);

                            return (
                                <Grid key={i}>
                                    <Grid>
                                        {causesWithoutMainEntity.length === 0 && (
                                            <>
                                                <Grid paddingBottom="10px">
                                                    <Grid style={{ width: 'fit-content', cursor: 'pointer' }}>
                                                        <EntityInfo
                                                            entity={getEntityForEntityInfo(entity, actions)}
                                                            entityTemplate={entityTemplate}
                                                            failedProperties={causes.flatMap((cause) => cause.properties)}
                                                        />
                                                    </Grid>
                                                </Grid>
                                                <BrokenRuleActions
                                                    actions={getActionsByFailureOnEntity({ entity, causes }, actions)}
                                                    failedProperties={causes.flatMap((cause) => cause.properties)}
                                                />
                                            </>
                                        )}
                                    </Grid>
                                    <Grid>
                                        {!!causesWithoutMainEntity.length && (
                                            <>
                                                {causesWithoutMainEntity.length > 1 && (
                                                    <Typography paddingLeft="15px">{i18next.t('ruleBreachInfo.relationshipsCombination')}</Typography>
                                                )}
                                                {causesWithoutMainEntity.map(({ instance }, j) => {
                                                    const relationship = instance.aggregatedRelationship
                                                        ? instance.aggregatedRelationship.relationship
                                                        : null;

                                                    return (
                                                        <Grid key={j} paddingBottom="10px">
                                                            <Grid style={{ width: 'fit-content', cursor: 'pointer' }}>
                                                                <RelationshipInfo
                                                                    relationship={getRelationshipForRelationshipInfo(
                                                                        relationship,
                                                                        actions,
                                                                        entityTemplates,
                                                                        relationshipTemplates,
                                                                    )}
                                                                    failedProperties={causes.flatMap((cause) => cause.properties)}
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    );
                                                })}
                                                <BrokenRuleActions
                                                    actions={getActionsByFailureOnRelationship({ entity, causes }, actions)}
                                                    failedProperties={causes.flatMap((cause) => cause.properties)}
                                                />
                                            </>
                                        )}
                                    </Grid>
                                </Grid>
                            );
                        })}
                        {brokenRule.failures.length === 0 && (
                            <ListItemText sx={{ pl: 4 }}>{i18next.t('ruleBreachInfo.noRelevantEntitiesForBrokenRule')}</ListItemText>
                        )}
                    </List>
                </Grid>
            </Collapse>
        </>
    );
};
