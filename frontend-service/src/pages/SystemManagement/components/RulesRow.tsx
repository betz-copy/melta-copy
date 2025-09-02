import { WarningAmberRounded, WarningRounded } from '@mui/icons-material';
import { Grid, Typography, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { UseMutateAsyncFunction, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../../common/ErrorToast';
import { InfiniteScroll } from '../../../common/InfiniteScroll';
import SearchInput from '../../../common/inputs/SearchInput';
import { RuleWizard } from '../../../common/wizards/rule';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ActionOnFail, IMongoRule, IRuleMap } from '../../../interfaces/rules';
import { deleteRuleRequest, ruleObjectToRuleForm, updateDisabledRuleRequest } from '../../../services/templates/rulesService';
import { ViewingCard } from './Card';
import { CardMenu } from './CardMenu';
import { CreateButton } from './CreateButton';
import { useWorkspaceStore } from '../../../stores/workspace';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { useUserStore } from '../../../stores/user';
import { PermissionScope } from '../../../interfaces/permissions';
import { getAllAllowedRulesAndWriteEntities } from '../../../utils/permissions/templatePermissions';

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
    return (
        <ViewingCard
            width={250}
            title={
                <Grid container gap="10px" paddingLeft="5px" direction="column">
                    <Grid container alignItems="center" justifyContent="space-between" direction="row" flexWrap="nowrap">
                        <Grid flexBasis="95%" height="30px">
                            <Grid container alignItems="center" direction="row" flexWrap="nowrap" gap="5px">
                                {rule.actionOnFail === ActionOnFail.WARNING ? (
                                    <WarningAmberRounded sx={{ color: '#FFAC2F' }} />
                                ) : (
                                    <WarningRounded sx={{ color: '#DD3500' }} />
                                )}
                                <Typography
                                    display="inline-block"
                                    sx={{
                                        fontSize: headlineSubTitleFontSize,
                                        color: theme.palette.primary.main,
                                    }}
                                >
                                    {rule.name}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Grid flexBasis="5%">
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
                    </Grid>
                </Grid>
            }
            expendedCard={
                <Grid container gap="10px" paddingLeft="5px" direction="column" marginTop="20px">
                    <Grid container justifyContent="space-between">
                        <Grid flexBasis="27%" color={theme.palette.primary.main}>
                            <Typography>{i18next.t('wizard.rule.description')}</Typography>
                        </Grid>
                        <Grid flexBasis="70%">
                            <Typography>{rule.description}</Typography>
                        </Grid>
                    </Grid>
                    <Grid container justifyContent="space-between">
                        <Grid flexBasis="27%" color={theme.palette.primary.main}>
                            <Typography>{i18next.t('wizard.rule.actionOnFail')}</Typography>
                        </Grid>
                        <Grid flexBasis="70%">
                            <Typography>{i18next.t(`wizard.rule.actions.${rule.actionOnFail.toLocaleLowerCase()}`)}</Typography>
                        </Grid>
                    </Grid>
                    <Grid container justifyContent="space-between">
                        <Grid flexBasis="27%" color={theme.palette.primary.main}>
                            <Typography>{i18next.t('wizard.rule.primaryEntityTemplate')}</Typography>
                        </Grid>
                        <Grid flexBasis="70%">
                            <Typography sx={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                {entityTemplate?.displayName}
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>
            }
            onHover={(isHover: boolean) => setIsHoverOnCard(isHover)}
        />
    );
};

const RulesRow: React.FC = () => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const rulesArray = Array.from(rules.values());
    const entityTemplatesArray = Array.from(entityTemplates.values());
    const allowedRulesAndEntities = getAllAllowedRulesAndWriteEntities(rulesArray, entityTemplatesArray, currentUser);

    const workspace = useWorkspaceStore((state) => state.workspace);
    const { bulk } = workspace.metadata.searchLimits;

    const [searchText, setSearchText] = useState('');

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
                    <CreateButton
                        onClick={() => setRuleWizardDialogState({ isWizardOpen: true, rule: null })}
                        text={i18next.t('systemManagement.newRuleTemplate')}
                    />
                </Grid>
            </Grid>
            <InfiniteScroll<IMongoRule>
                queryKey={['searchRulesTemplates', searchText, allowedRulesAndEntities]}
                queryFunction={({ pageParam }) =>
                    allowedRulesAndEntities.allowedRules.filter(({ name }) => searchText === '' || name.includes(searchText)).splice(pageParam, bulk)
                }
                onQueryError={(error) => {
                    console.error('failed to search process templates error:', error);
                    toast.error(i18next.t('failedToLoadResults'));
                }}
                getItemId={(rule) => rule._id}
                getNextPageParam={(lastPage, allPages) => {
                    const nextPage = allPages.length * bulk;
                    return lastPage.length ? nextPage : undefined;
                }}
                endText={i18next.t('noSearchLeft')}
                emptyText={i18next.t('failedToGetTemplates')}
                useContainer={false}
            >
                {(rule) => (
                    <RuleCard
                        key={rule._id}
                        entityTemplates={allowedRulesAndEntities.allowedEntityTemplates}
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

export { RulesRow };
