import React, { useState, Key } from 'react';
import { Box, Collapse, Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography } from '@mui/material';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, Gavel as GavelIcon } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';
import { populateRelationshipTemplate } from '../../utils/templates';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRule } from '../../interfaces/rules';
import { IRuleBreachPopulated } from '../../interfaces/ruleBreaches/ruleBreach';
import { RelationshipInfo } from './ActionInfo';
import { IActionMetadataPopulated, ICreateRelationshipMetadataPopulated } from '../../interfaces/ruleBreaches/actionMetadata';

const BrokenRuleCompact: React.FC<{ brokenRule: IRuleBreachPopulated['brokenRules'][number]; ruleTemplate: IMongoRule }> = ({
    brokenRule,
    ruleTemplate,
}) => {
    return (
        <ListItem key={brokenRule.ruleId}>
            <ListItemIcon>
                <GavelIcon />
            </ListItemIcon>
            <ListItemText>
                <Tooltip
                    title={ruleTemplate.description}
                    PopperProps={{
                        sx: { '& .MuiTooltip-tooltip': { fontSize: '0.8rem' } },
                    }}
                >
                    <Box component="span" sx={{ fontWeight: 'bold' }}>
                        {ruleTemplate.name}
                    </Box>
                </Tooltip>
            </ListItemText>
        </ListItem>
    );
};

const BrokenRuleFull: React.FC<{
    brokenRule: IRuleBreachPopulated['brokenRules'][number];
    ruleTemplate: IMongoRule;
    actionMetadata: IActionMetadataPopulated;
}> = ({ brokenRule, ruleTemplate, actionMetadata }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;

    return (
        <>
            <ListItemButton onClick={() => setOpen((prev) => !prev)}>
                <ListItemIcon>
                    <GavelIcon />
                </ListItemIcon>
                <ListItemText secondary={i18next.t('ruleBreachInfo.relevantEntities')}>
                    <Tooltip title={ruleTemplate.description}>
                        <Box component="span" sx={{ fontWeight: 'bold' }}>
                            {ruleTemplate.name}
                        </Box>
                    </Tooltip>
                </ListItemText>
                {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <List dense component="div" disablePadding>
                    {brokenRule.relationships.map((relationship, i) => {
                        const relationshipTemplate = !relationship
                            ? null
                            : relationshipTemplates.find(({ _id }) => {
                                  if (typeof relationship === 'string') {
                                      return _id === (actionMetadata as ICreateRelationshipMetadataPopulated).relationshipTemplateId;
                                  }
                                  return _id === relationship.templateId;
                              })!;
                        const relationshipTemplatePopulated = relationshipTemplate
                            ? populateRelationshipTemplate(relationshipTemplate, entityTemplates)
                            : null;

                        let key: Key;
                        if (!relationship) {
                            key = i;
                        } else if (typeof relationship === 'string') {
                            key = relationship;
                        } else {
                            key = relationship.properties._id;
                        }

                        return (
                            <ListItemText key={key} sx={{ pl: 4 }}>
                                {relationship && (
                                    <RelationshipInfo
                                        relationshipTemplatePopulated={relationshipTemplatePopulated!}
                                        sourceEntity={
                                            typeof relationship !== 'string'
                                                ? relationship.sourceEntity
                                                : (actionMetadata as ICreateRelationshipMetadataPopulated).sourceEntity
                                        }
                                        destinationEntity={
                                            typeof relationship !== 'string'
                                                ? relationship.destinationEntity
                                                : (actionMetadata as ICreateRelationshipMetadataPopulated).destinationEntity
                                        }
                                    />
                                )}
                                {!relationship && i18next.t('ruleBreachInfo.unknownRelationship')}
                            </ListItemText>
                        );
                    })}
                    {brokenRule.relationships.length === 0 && (
                        <ListItemText sx={{ pl: 4 }}>{i18next.t('ruleBreachInfo.noRelevantEntitiesForBrokenRule')}</ListItemText>
                    )}
                </List>
            </Collapse>
        </>
    );
};

export const BrokenRulesInfo: React.FC<{
    brokenRules: IRuleBreachPopulated['brokenRules'];
    actionMetadata: IActionMetadataPopulated;
    isCompact: boolean;
}> = ({ brokenRules, actionMetadata, isCompact }) => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IMongoRule[]>('getRules')!;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography variant="body1" sx={{ textDecoration: 'underline' }}>{`${
                    brokenRules.length === 1 ? i18next.t('ruleBreachInfo.brokeTheFollowingRule') : i18next.t('ruleBreachInfo.brokeTheFollowingRules')
                }:`}</Typography>
            </Grid>
            <Grid item>
                <List dense={isCompact}>
                    {brokenRules.map((brokenRule) => {
                        const ruleTemplate = rules.find(({ _id }) => _id === brokenRule.ruleId)!;
                        return isCompact ? (
                            <BrokenRuleCompact key={brokenRule.ruleId} brokenRule={brokenRule} ruleTemplate={ruleTemplate} />
                        ) : (
                            <BrokenRuleFull
                                key={brokenRule.ruleId}
                                brokenRule={brokenRule}
                                ruleTemplate={ruleTemplate}
                                actionMetadata={actionMetadata}
                            />
                        );
                    })}
                </List>
            </Grid>
        </Grid>
    );
};
