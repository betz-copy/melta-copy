import React, { useState } from 'react';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import { UseMutateAsyncFunction, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { AxiosError } from 'axios';
import { ViewingCard } from './Card';
import SearchInput from '../../../common/inputs/SearchInput';
import { IMongoRule, IRuleMap } from '../../../interfaces/rules';
import { RuleWizard } from '../../../common/wizards/rule';
import { deleteRuleRequest, ruleObjectToRuleForm, searchRulesRequest, updateDisabledRuleRequest } from '../../../services/templates/rulesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../../common/ErrorToast';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { CardMenu } from './CardMenu';
import { environment } from '../../../globals';
import { InfiniteScroll } from '../../../common/InfiniteScroll';

const { infiniteScrollPageCount } = environment.entitiesCardsView;

export const RuleCard: React.FC<{
    rule: IMongoRule;
    entityTemplates: IEntityTemplateMap;
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
    refetchQuery: () => Promise<void>;
}> = ({ rule, entityTemplates, setRuleWizardDialogState, setDeleteRuleWizardState, updateDisabledMutateAsync, refetchQuery }) => {
    const theme = useTheme();
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);

    return (
        <ViewingCard
            width={250}
            title={
                <Grid container gap="10px" paddingLeft="5px" direction="column">
                    <Grid item container alignItems="center" justifyContent="space-between" direction="row" flexWrap="nowrap">
                        <Grid item flexBasis="95%" height="30px">
                            <Grid item container alignItems="center" direction="row" flexWrap="nowrap" gap="5px">
                                {rule.actionOnFail === 'WARNING' ? <img src="/icons/warning-rule.svg" /> : <img src="/icons/force-rule.svg" />}
                                <Typography
                                    display="inline-block"
                                    style={{
                                        fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                                        color: theme.palette.primary.main,
                                        fontWeight: '400',
                                    }}
                                >
                                    {rule.name}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Grid item flexBasis="5%">
                            {isHoverOnCard && (
                                <CardMenu
                                    onEditClick={() => {
                                        setRuleWizardDialogState({
                                            isWizardOpen: true,
                                            rule,
                                        });
                                        refetchQuery();
                                    }}
                                    onDeleteClick={() => {
                                        setDeleteRuleWizardState({ isWizardOpen: true, ruleId: rule._id });
                                        refetchQuery();
                                    }}
                                    onDisableClick={() => updateDisabledMutateAsync(rule)}
                                    disabledProps={{
                                        isDisabled: rule.disabled,
                                        canEdit: rule.disabled,
                                        tooltipTitle: i18next.t('systemManagement.disabledRule'),
                                    }}
                                />
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            }
            expendedCard={
                <Grid item container gap="10px" paddingLeft="5px" direction="column" marginTop="20px">
                    <Grid item container justifyContent="space-between">
                        <Grid item flexBasis="27%" color="#9398C2">
                            <Typography>{i18next.t('wizard.rule.description')}</Typography>
                        </Grid>
                        <Grid item flexBasis="70%" color="#53566E" fontWeight="400">
                            <Typography>{rule.description}</Typography>
                        </Grid>
                    </Grid>
                    <Grid item container justifyContent="space-between">
                        <Grid item flexBasis="27%" color="#9398C2">
                            <Typography>{i18next.t('wizard.rule.actionOnFail')}</Typography>
                        </Grid>
                        <Grid item flexBasis="70%" color="#53566E" fontWeight="400">
                            <Typography>{i18next.t(`wizard.rule.actions.${rule.actionOnFail.toLocaleLowerCase()}`)}</Typography>
                        </Grid>
                    </Grid>
                    <Grid item container justifyContent="space-between">
                        <Grid item flexBasis="27%" color="#9398C2">
                            <Typography>{i18next.t('wizard.rule.primaryEntityTemplate')}</Typography>
                        </Grid>
                        <Grid item flexBasis="70%" color="#53566E" fontWeight="400">
                            <Typography style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                {entityTemplates.get(rule.entityTemplateId)?.displayName}
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

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

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

    const refetch = () => queryClient.invalidateQueries({ queryKey: ['searchRulesTemplates', searchText], exact: true });

    return (
        <Grid item container>
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    <SearchInput borderRadius="7px" onChange={setSearchText} placeholder={i18next.t('globalSearch.searchRules')} />
                </Grid>
                <Grid item>
                    <IconButton style={{ borderRadius: '5px' }} onClick={() => setRuleWizardDialogState({ isWizardOpen: true, rule: null })}>
                        <img src="/icons/Add-New-Rule.svg" />
                    </IconButton>
                </Grid>
            </Grid>
            <Grid item container direction="row" gap="30px" marginTop="30px">
                <InfiniteScroll<IMongoRule>
                    queryKey={['searchRulesTemplates', searchText]}
                    queryFunction={async ({ pageParam }) => {
                        const searchRulesResult = await searchRulesRequest({
                            skip: pageParam,
                            limit: infiniteScrollPageCount,
                            search: searchText.length > 0 ? searchText : undefined,
                        });
                        console.log(
                            'rules',
                            { skip: pageParam, limit: infiniteScrollPageCount, search: searchText.length > 0 ? searchText : undefined },
                            { searchRulesResult },
                        );

                        return searchRulesResult;
                    }}
                    onQueryError={(error) => {
                        // eslint-disable-next-line no-console
                        console.log('failed to search process templates error:', error);
                        toast.error(i18next.t('entitiesCardView.failedToLoadResults'));
                    }}
                    getItemId={(rule) => rule._id}
                    getNextPageParam={(lastPage, allPages) => {
                        if (lastPage.length < infiniteScrollPageCount) return undefined;
                        return allPages.length * infiniteScrollPageCount;
                    }}
                    endText={i18next.t('entitiesCardView.noSearchLeft')}
                    emptyText={i18next.t('failedToGetTemplates')}
                    useContainer={false}
                >
                    {(rule) => (
                        <RuleCard
                            key={rule._id}
                            entityTemplates={entityTemplates}
                            rule={rule}
                            setDeleteRuleWizardState={setDeleteRuleWizardState}
                            setRuleWizardDialogState={setRuleWizardDialogState}
                            updateDisabledMutateAsync={updateDisabledMutateAsync}
                            refetchQuery={refetch}
                        />
                    )}
                </InfiniteScroll>
            </Grid>
            <RuleWizard
                open={ruleWizardDialogState.isWizardOpen}
                handleClose={() => setRuleWizardDialogState({ isWizardOpen: false, rule: null })}
                initialValues={ruleObjectToRuleForm(ruleWizardDialogState.rule, entityTemplates)}
                isEditMode={Boolean(ruleWizardDialogState.rule)}
                refetchQuery={refetch}
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
