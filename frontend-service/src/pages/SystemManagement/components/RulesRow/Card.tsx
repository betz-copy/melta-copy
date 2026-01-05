import { Brush, WarningAmberRounded, WarningRounded } from '@mui/icons-material';
import { Grid, Typography, useTheme } from '@mui/material';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { PermissionScope } from '@packages/permission';
import { ActionOnFail, IMongoRule } from '@packages/rule';
import i18next from 'i18next';
import React, { useState } from 'react';
import { UseMutateAsyncFunction } from 'react-query';
import { EntityTemplateColor } from '../../../../common/EntityTemplateColor';
import { MinimizedColorPicker } from '../../../../common/inputs/MinimizedColorPicker';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { useUserStore } from '../../../../stores/user';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { getEntityTemplateColor } from '../../../../utils/colors';
import { checkUserTemplatePermission } from '../../../../utils/permissions/instancePermissions';
import { ViewingCard } from '../Card';
import { CardMenu } from '../CardMenu';

const getRuleIcon = (rule: IMongoRule) => {
    switch (rule.actionOnFail) {
        case ActionOnFail.WARNING:
            return <WarningAmberRounded sx={{ color: '#FFAC2F' }} />;
        case ActionOnFail.ENFORCEMENT:
            return <WarningRounded sx={{ color: '#DD3500' }} />;
        case ActionOnFail.INDICATOR: {
            if (rule.fieldColor) return <Brush sx={{ color: '#166BD4' }} />;
            return null;
        }
        default:
            return null;
    }
};

const showProperty = (key: string, value: string, darkMode: boolean, isColor?: boolean) => {
    return (
        <Grid container justifyContent="space-between" alignItems="center">
            <Grid flexBasis="27%">
                <Typography color={darkMode ? '#5A5F99' : '#9398C2'} fontSize="12px">
                    {key}
                </Typography>
            </Grid>
            <Grid container flexBasis="70%" justifyContent="start">
                {isColor ? (
                    <MinimizedColorPicker color={value} onColorChange={() => {}} circleSize="20px" />
                ) : (
                    <Typography color={darkMode ? '#A5A8C7' : '#53566E'} fontSize="12px">
                        {value}
                    </Typography>
                )}
            </Grid>
        </Grid>
    );
};

const RuleCard: React.FC<{
    rule: IMongoRule;
    entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[];
    setRuleWizardDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            rule: IMongoRule | null;
        }>
    >;
    setDeleteRuleWizardState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            ruleId: string | null;
        }>
    >;
    updateDisabledMutateAsync: UseMutateAsyncFunction<IMongoRule, unknown, IMongoRule, unknown>;
}> = ({ rule, entityTemplates, setRuleWizardDialogState, setDeleteRuleWizardState, updateDisabledMutateAsync }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);
    const { headlineSubTitleFontSize } = workspace.metadata.mainFontSizes;

    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [isHoverOnCard, setIsHoverOnCard] = useState(false);
    const entityTemplate = entityTemplates.find((entity) => entity._id === rule.entityTemplateId)!;

    const entityHasWritePermission = checkUserTemplatePermission(
        currentUser.currentWorkspacePermissions,
        entityTemplate.category._id,
        entityTemplate._id,
        PermissionScope.write,
    );

    const ruleCardTooltip = () => {
        if (!entityHasWritePermission) return i18next.t('systemManagement.ruleTemplateEditDisabled');
        if (rule.disabled) return i18next.t('systemManagement.disabledRule');
        return '';
    };

    const entityTemplateColor = entityTemplate ? getEntityTemplateColor(entityTemplate) : '';

    return (
        <ViewingCard
            width={320}
            title={
                <Grid container gap="10px" paddingLeft="5px" direction="column">
                    <Grid container alignItems="center" justifyContent="space-between" direction="row" flexWrap="nowrap">
                        <Grid container direction="column" gap={1} flexBasis="100%">
                            <Grid container alignItems="center" direction="row" flexWrap="nowrap" gap="5px" justifyContent="space-between">
                                <Typography
                                    display="inline-block"
                                    sx={{
                                        fontSize: headlineSubTitleFontSize,
                                        color: theme.palette.primary.main,
                                        fontWeight: isHoverOnCard ? 600 : 400,
                                    }}
                                >
                                    {rule.name}
                                </Typography>

                                {isHoverOnCard && (
                                    <CardMenu
                                        onOptionsIconClose={() => setIsHoverOnCard(false)}
                                        onEditClick={() => {
                                            setRuleWizardDialogState({
                                                isWizardOpen: true,
                                                rule,
                                            });
                                        }}
                                        onDeleteClick={() => {
                                            setDeleteRuleWizardState({ isWizardOpen: true, ruleId: rule._id });
                                        }}
                                        onDisableClick={() => updateDisabledMutateAsync(rule)}
                                        disabledProps={{
                                            disableForReadPermissions: !entityHasWritePermission,
                                            isDisabled: rule.disabled || !entityHasWritePermission,
                                            isDeleteDisabled: rule.disabled || !entityHasWritePermission,
                                            isEditDisabled: rule.disabled || !entityHasWritePermission,
                                            tooltipTitle: ruleCardTooltip(),
                                        }}
                                    />
                                )}
                            </Grid>
                            <Grid container alignItems="center" direction="row" flexWrap="nowrap" gap="5px" justifyContent="space-between">
                                <Grid container direction="row" gap={2}>
                                    <EntityTemplateColor entityTemplateColor={entityTemplateColor} style={{ height: '18px' }} />
                                    <Typography color={darkMode ? 'white' : '#101440'} fontSize="12px">
                                        {entityTemplate?.displayName}
                                    </Typography>
                                </Grid>
                                {getRuleIcon(rule)}
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            }
            expendedCard={
                <Grid container gap="2px" paddingLeft="5px" direction="column" marginTop="20px">
                    {showProperty(i18next.t('wizard.rule.description'), rule.description, darkMode)}
                    {showProperty(
                        i18next.t('wizard.rule.actionOnFail'),
                        i18next.t(`wizard.rule.actions.${rule.actionOnFail.toLocaleLowerCase()}`),
                        darkMode,
                    )}
                    {showProperty(i18next.t('wizard.rule.primaryEntityTemplate'), entityTemplate?.displayName, darkMode)}
                    {rule.actionOnFail === ActionOnFail.INDICATOR && rule.fieldColor && (
                        <>
                            {showProperty(
                                i18next.t('wizard.rule.fieldToColor'),
                                entityTemplate.properties.properties[rule.fieldColor.field]?.title,
                                darkMode,
                            )}
                            {showProperty(i18next.t('wizard.rule.color'), rule.fieldColor.color, darkMode, true)}
                        </>
                    )}
                </Grid>
            }
            onHover={(isHover: boolean) => setIsHoverOnCard(isHover)}
            isDisabled={rule.disabled}
        />
    );
};

export default RuleCard;
