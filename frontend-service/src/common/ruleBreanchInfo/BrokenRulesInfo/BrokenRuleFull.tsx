import React, { Key, useState } from 'react';
import { Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { IActionMetadataPopulated, ICreateRelationshipMetadataPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IMongoRule } from '../../../interfaces/rules';
import { RelationshipInfo } from '../ActionInfo';
import { populateRelationshipTemplate } from '../../../utils/templates';
import { RuleIcon } from './RuleIcon';

export const BrokenRuleFull: React.FC<{
    brokenRule: IRuleBreachPopulated['brokenRules'][number];
    ruleTemplate: IMongoRule;
    actionMetadata: IActionMetadataPopulated;
}> = ({ brokenRule, ruleTemplate, actionMetadata }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    return (
        <>
            <ListItemButton onClick={() => setOpen((prev) => !prev)}>
                <ListItemIcon>
                    <RuleIcon ruleType={ruleTemplate.actionOnFail} />
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
                            : Array.from(relationshipTemplates.values()).find(({ _id }) => {
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
