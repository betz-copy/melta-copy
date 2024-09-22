import React, { useState } from 'react';
import { Box, Collapse, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import isEqual from 'lodash.isequal';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IActionPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IBrokenRulePopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IMongoRule } from '../../../interfaces/rules';
import { EntityForBrokenRules } from '../ActionInfo';
import { RuleIcon } from './RuleIcon';
import { MeltaTooltip } from '../../MeltaTooltip';
import { IEntity } from '../../../interfaces/entities';

export const BrokenRuleFull: React.FC<{
    brokenRule: IBrokenRulePopulated;
    ruleTemplate: IMongoRule;
    actions: IActionPopulated[];
}> = ({ brokenRule, ruleTemplate, actions }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const entityTemplate = entityTemplates.get(ruleTemplate.entityTemplateId)!;

    return (
        <>
            <ListItemButton onClick={() => setOpen((prev) => !prev)}>
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
                {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <List dense component="div" disablePadding>
                    {brokenRule.failures.map(({ entity, causes }, i) => {
                        const causeOfMainEntityIndex = causes.findIndex(({ instance }) => {
                            const currEntityOfCause = instance.aggregatedRelationship ? instance.aggregatedRelationship.otherEntity : instance.entity;
                            return isEqual(currEntityOfCause, entity);
                        });
                        const causeOfMainEntity = causes[causeOfMainEntityIndex];

                        const causesWithoutMainEntity = causes.slice();
                        if (causeOfMainEntityIndex > -1) causesWithoutMainEntity.splice(causeOfMainEntityIndex, 1);

                        const mainEntityPropertiesToShowTooltipOverride = [
                            ...(causeOfMainEntity?.properties || []),
                            ...(entityTemplate?.propertiesPreview || []),
                        ];

                        return (
                            // eslint-disable-next-line react/no-array-index-key
                            <ListItem key={i}>
                                {'- '}
                                <ListItemText sx={{ pl: 4 }}>
                                    <EntityForBrokenRules
                                        ruleTemplate={ruleTemplate}
                                        entity={entity}
                                        entityTemplate={entityTemplate}
                                        actions={actions}
                                        entityPropertiesToShowTooltipOverride={[...new Set(mainEntityPropertiesToShowTooltipOverride)]}
                                        entityPropertiesToHighlightTooltip={causeOfMainEntity?.properties}
                                    />
                                    {causesWithoutMainEntity.length > 0 && ': '}
                                    {causesWithoutMainEntity.map(({ instance, properties }, j) => {
                                        const entityToShow = (
                                            instance.aggregatedRelationship ? instance.aggregatedRelationship.otherEntity : instance.entity
                                        ) as IEntity; // because we excluded causeOfMainEntity from causes

                                        const entityTemplateOfEntityToShow =
                                            // eslint-disable-next-line no-nested-ternary
                                            !entityToShow ? null : entityTemplates.get(entityToShow.templateId)!;

                                        const entityPropertiesToShowTooltipOverride = [
                                            ...properties,
                                            ...(entityTemplateOfEntityToShow?.propertiesPreview || []),
                                        ];

                                        return (
                                            <>
                                                {j > 0 && ', '}
                                                <EntityForBrokenRules
                                                    // eslint-disable-next-line react/no-array-index-key
                                                    key={j}
                                                    ruleTemplate={ruleTemplate}
                                                    entity={entityToShow}
                                                    entityTemplate={entityTemplateOfEntityToShow}
                                                    actions={actions}
                                                    entityPropertiesToShowTooltipOverride={[...new Set(entityPropertiesToShowTooltipOverride)]}
                                                    entityPropertiesToHighlightTooltip={properties}
                                                />
                                            </>
                                        );
                                    })}
                                </ListItemText>
                            </ListItem>
                        );
                    })}
                    {brokenRule.failures.length === 0 && (
                        <ListItemText sx={{ pl: 4 }}>{i18next.t('ruleBreachInfo.noRelevantEntitiesForBrokenRule')}</ListItemText>
                    )}
                </List>
            </Collapse>
        </>
    );
};
