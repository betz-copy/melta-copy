import { Brush, Email, WarningAmberRounded, WarningRounded } from '@mui/icons-material';
import { FormControlLabel, Grid, Typography, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { UseMutateAsyncFunction, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import { ErrorToast } from '../../../common/ErrorToast';
import { InfiniteScroll } from '../../../common/InfiniteScroll';
import { MinimizedColorPicker } from '../../../common/inputs/MinimizedColorPicker';
import SearchInput from '../../../common/inputs/SearchInput';
import MeltaCheckbox from '../../../common/MeltaDesigns/MeltaCheckbox';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import TemplatesSelectCheckbox from '../../../common/templatesSelectCheckbox';
import { RuleWizard } from '../../../common/wizards/rule';
import { environment } from '../../../globals';
import { ICategoryMap } from '../../../interfaces/categories';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { ActionOnFail, IMongoRule, IRuleMap } from '../../../interfaces/rules';
import { deleteRuleRequest, ruleObjectToRuleForm, updateDisabledRuleRequest } from '../../../services/templates/rulesService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getEntityTemplateColor } from '../../../utils/colors';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { getAllAllowedRulesAndWriteEntities } from '../../../utils/permissions/templatePermissions';
import { ViewingCard } from './Card';
import { CardMenu } from './CardMenu';
import { CreateButton } from './CreateButton';

const { warning } = environment.color;

const getRuleIcon = (rule: IMongoRule) => {
    switch (rule.actionOnFail) {
        case ActionOnFail.WARNING:
            return <WarningAmberRounded sx={{ color: warning }} />;
        case ActionOnFail.ENFORCEMENT:
            return <WarningRounded sx={{ color: 'error' }} />;
        case ActionOnFail.INDICATOR: {
            const icons = [
                rule.mail?.display && <Email key="email" sx={{ color: '#166BD4' }} />,
                rule.fieldColor?.display && <Brush key="brush" sx={{ color: '#166BD4' }} />,
            ].filter(Boolean);

            return icons.length > 0 ? (
                <Grid container direction="row" gap={0.5}>
                    {icons}
                </Grid>
            ) : null;
        }
        default:
            return null;
    }
};

const htmlToString = (html: string): string => {
    if (!html) return '';
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');

    return text.replace(/\n+/g, '\n').trim();
};

const mailRecipientsToString = (sendAssociatedUsers: boolean, sendPermissionUsers: boolean): string => {
    const valuesToDisplay: string[] = [];
    if (sendPermissionUsers) valuesToDisplay.push(i18next.t('wizard.rule.sendToUsersWithPerms'));
    if (sendAssociatedUsers) valuesToDisplay.push(i18next.t('wizard.rule.sendToAssociatedUsers'));

    return valuesToDisplay.join(', ');
};

export const showProperty = (key: string, value: string, darkMode: boolean, isColor?: boolean, isMail?: boolean) => {
    const typography = (
        <Typography
            color={darkMode ? '#A5A8C7' : '#53566E'}
            fontSize="12px"
            style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                maxWidth: '200px',
            }}
        >
            {value}
        </Typography>
    );
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
                ) : isMail ? (
                    <MeltaTooltip title={value}>{typography}</MeltaTooltip>
                ) : (
                    typography
                )}
            </Grid>
        </Grid>
    );
};

const typeRuleCheckbox = (
    ruleType: ActionOnFail,
    actionOnFailFilter: ActionOnFail[],
    setActionOnFailFilter: React.Dispatch<React.SetStateAction<ActionOnFail[]>>,
) => (
    <FormControlLabel
        sx={{ margin: '0' }}
        label={i18next.t(`wizard.rule.actions.${ruleType.toLowerCase()}`) as string}
        control={
            <MeltaCheckbox
                checked={actionOnFailFilter.includes(ruleType)}
                onChange={(e) => setActionOnFailFilter((prev) => (e.target.checked ? [...prev, ruleType] : prev.filter((a) => a !== ruleType)))}
            />
        }
        slotProps={{
            typography: { sx: { fontSize: '14px' } },
        }}
    />
);

export const RuleCard: React.FC<{
    rule: IMongoRule;
    entityTemplates: IMongoEntityTemplatePopulated[];
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

    const isIndicator = rule.actionOnFail === ActionOnFail.INDICATOR;
    const haveColor = isIndicator && rule.fieldColor?.display;
    const haveMail = isIndicator && rule.mail?.display;
    const getKey = (key: string) => i18next.t(`wizard.rule.${key}`);

    const ruleDetails: { key: string; value: string; isColor?: boolean; isMail?: boolean; condition?: boolean }[] = [
        { key: getKey('description'), value: rule.description },
        { key: getKey('actionOnFail'), value: getKey(`actions.${rule.actionOnFail.toLocaleLowerCase()}`) },
        { key: getKey('primaryEntityTemplate'), value: entityTemplate?.displayName },
        {
            key: getKey('fieldToColor'),
            value: entityTemplate.properties.properties[rule.fieldColor?.field ?? '']?.title,
            condition: haveColor,
        },
        { key: getKey('color'), value: rule.fieldColor?.color ?? '', isColor: true, condition: haveColor },
        { key: getKey('mailTitle'), value: rule.mail?.title ?? '', condition: haveMail },
        { key: getKey('mailBody'), value: htmlToString(rule.mail?.body ?? ''), isMail: true, condition: haveMail },
        {
            key: getKey('recipients'),
            value: mailRecipientsToString(rule.mail?.sendAssociatedUsers ?? false, rule.mail?.sendPermissionUsers ?? false),
            condition: haveMail,
        },
    ];

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
                    {ruleDetails
                        .filter(({ condition }) => condition !== false)
                        .map(({ key, value, isColor, isMail }) => showProperty(key, value, darkMode, isColor, isMail))}{' '}
                </Grid>
            }
            onHover={(isHover: boolean) => setIsHoverOnCard(isHover)}
            isDisabled={rule.disabled}
        />
    );
};

const RulesRow: React.FC = () => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const rulesArray = Array.from(rules.values());
    const categoriesArray = Array.from(categories.values());
    const entityTemplatesArray = Array.from(entityTemplates.values());
    const { allowedRules, allowedEntityTemplates } = getAllAllowedRulesAndWriteEntities(rulesArray, entityTemplatesArray, currentUser);

    const workspace = useWorkspaceStore((state) => state.workspace);
    const { bulk } = workspace.metadata.searchLimits;

    const [searchText, setSearchText] = useState<string>('');
    const [actionOnFailFilter, setActionOnFailFilter] = useState<ActionOnFail[]>(Object.values(ActionOnFail));
    const [entityTemplateFilter, setEntityTemplateFilter] = useState<IMongoEntityTemplatePopulated[]>(allowedEntityTemplates);

    const [ruleWizardDialogState, setRuleWizardDialogState] = useState<{
        isWizardOpen: boolean;
        rule: IMongoRule | null;
    }>({
        isWizardOpen: false,
        rule: null,
    });

    const [deleteRuleWizardState, setDeleteRuleWizardState] = useState<{
        isWizardOpen: boolean;
        ruleId: string | null;
    }>({
        isWizardOpen: false,
        ruleId: null,
    });

    const { mutateAsync: updateDisabledMutateAsync } = useMutation((rule: IMongoRule) => updateDisabledRuleRequest(rule._id, !rule.disabled), {
        onSuccess: (data) => {
            queryClient.setQueryData<IRuleMap>('getRules', (ruleMap) => ruleMap!.set(data._id, data));
            if (data.disabled) toast.success(i18next.t('wizard.rule.disabledSuccessfully'));
            else toast.success(i18next.t('wizard.rule.activatedSuccessfully'));
        },
        onError: (_err, variables) => {
            if (variables.disabled) toast.error(i18next.t('wizard.rule.failedToActivate'));
            else toast.error(i18next.t('wizard.rule.failedToDisable'));
        },
    });
    const { isLoading, mutateAsync: deleteMutateAsync } = useMutation((id: string) => deleteRuleRequest(id), {
        onSuccess: (_data, id) => {
            queryClient.setQueryData<IRuleMap>('getRules', (ruleMap) => {
                ruleMap!.delete(id);
                return ruleMap!;
            });
            setDeleteRuleWizardState({ isWizardOpen: false, ruleId: null });
            toast.success(i18next.t('wizard.rule.deletedSuccessfully'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.rule.failedToDelete')} />);
        },
    });

    return (
        <Grid container>
            <Grid container spacing={1} alignItems="center" marginBottom={3}>
                <Grid>
                    <SearchInput borderRadius="7px" onChange={setSearchText} placeholder={i18next.t('globalSearch.searchRules')} />
                </Grid>
                <Grid>
                    <TemplatesSelectCheckbox
                        title={i18next.t('wizard.rule.primaryEntityTemplate')}
                        templates={entityTemplatesArray}
                        selectedTemplates={entityTemplateFilter}
                        setSelectedTemplates={setEntityTemplateFilter}
                        categories={categoriesArray}
                        size="small"
                        isDraggableDisabled
                    />
                </Grid>
                <Grid>
                    {typeRuleCheckbox(ActionOnFail.WARNING, actionOnFailFilter, setActionOnFailFilter)}
                    {typeRuleCheckbox(ActionOnFail.ENFORCEMENT, actionOnFailFilter, setActionOnFailFilter)}
                    {typeRuleCheckbox(ActionOnFail.INDICATOR, actionOnFailFilter, setActionOnFailFilter)}
                </Grid>
                <Grid>
                    <CreateButton
                        onClick={() => setRuleWizardDialogState({ isWizardOpen: true, rule: null })}
                        text={i18next.t('systemManagement.newRuleTemplate')}
                    />
                </Grid>
            </Grid>
            <InfiniteScroll<IMongoRule>
                queryKey={['searchRulesTemplates', searchText, allowedRules, actionOnFailFilter, entityTemplateFilter]}
                queryFunction={({ pageParam }) =>
                    allowedRules
                        .filter((rule) => {
                            const matchesSearch = searchText === '' || rule.name.toLowerCase().includes(searchText.toLowerCase());
                            const matchesActionOnFail = actionOnFailFilter.includes(rule.actionOnFail);
                            const matchesEntityTemplate = entityTemplateFilter.some((et) => et._id === rule.entityTemplateId);

                            return matchesSearch && matchesActionOnFail && matchesEntityTemplate;
                        })
                        .splice(pageParam, bulk)
                }
                onQueryError={(error) => {
                    console.error('failed to search process templates error:', error);
                    toast.error(i18next.t('failedToLoadResults'));
                }}
                getItemId={(rule) => rule._id}
                getNextPageParam={(lastPage, allPages) => (lastPage.length ? allPages.length * bulk : undefined)}
                endText={i18next.t('noSearchLeft')}
                emptyText={i18next.t('noSearchLeft')}
                useContainer={false}
            >
                {(rule) => (
                    <RuleCard
                        key={rule._id}
                        entityTemplates={allowedEntityTemplates}
                        rule={rule}
                        setDeleteRuleWizardState={setDeleteRuleWizardState}
                        setRuleWizardDialogState={setRuleWizardDialogState}
                        updateDisabledMutateAsync={updateDisabledMutateAsync}
                    />
                )}
            </InfiniteScroll>
            <RuleWizard
                open={ruleWizardDialogState.isWizardOpen}
                handleClose={() => setRuleWizardDialogState({ isWizardOpen: false, rule: null })}
                initialValues={ruleObjectToRuleForm(ruleWizardDialogState.rule, entityTemplates)}
                isEditMode={Boolean(ruleWizardDialogState.rule)}
            />
            <AreYouSureDialog
                open={deleteRuleWizardState.isWizardOpen}
                handleClose={() => setDeleteRuleWizardState({ isWizardOpen: false, ruleId: null })}
                onYes={() => deleteMutateAsync(deleteRuleWizardState.ruleId!)}
                isLoading={isLoading}
            />
        </Grid>
    );
};

export default RulesRow;
