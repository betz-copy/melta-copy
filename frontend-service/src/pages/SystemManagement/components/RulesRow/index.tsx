import {
    ActionOnFail,
    ICategoryMap,
    IEntityTemplateMap,
    IMongoEntityTemplateWithConstraintsPopulated,
    IMongoRule,
    IRuleMap,
} from '@microservices/shared';
import { FormControlLabel, Grid } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AreYouSureDialog } from '../../../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../../../common/ErrorToast';
import { InfiniteScroll } from '../../../../common/InfiniteScroll';
import SearchInput from '../../../../common/inputs/SearchInput';
import MeltaCheckbox from '../../../../common/MeltaDesigns/MeltaCheckbox';
import TemplatesSelectCheckbox from '../../../../common/templatesSelectCheckbox';
import { RuleWizard } from '../../../../common/wizards/rule';
import { deleteRuleRequest, ruleObjectToRuleForm, updateDisabledRuleRequest } from '../../../../services/templates/rulesService';
import { useUserStore } from '../../../../stores/user';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { getAllAllowedRulesAndWriteEntities } from '../../../../utils/permissions/templatePermissions';
import { CreateButton } from '../CreateButton';
import RuleCard from './Card';

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
    const [actionOnFailFilter, setActionOnFailFilter] = useState<ActionOnFail[]>(Object.values(ActionOnFail)); // Rule type filter
    const [entityTemplateFilter, setEntityTemplateFilter] = useState<IMongoEntityTemplateWithConstraintsPopulated[]>(allowedEntityTemplates);

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
            <Grid container spacing={2} alignItems="center" marginBottom={3}>
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
                <Grid gap={1} container>
                    {[ActionOnFail.ENFORCEMENT, ActionOnFail.INDICATOR, ActionOnFail.WARNING].map((actionOnFail) => (
                        <FormControlLabel
                            sx={{ margin: '0' }}
                            key={actionOnFail}
                            label={i18next.t(`wizard.rule.actions.${actionOnFail.toLowerCase()}`) as string}
                            control={
                                <MeltaCheckbox
                                    checked={actionOnFailFilter.includes(actionOnFail)}
                                    onChange={(e) =>
                                        setActionOnFailFilter((prev) =>
                                            e.target.checked ? [...prev, actionOnFail] : prev.filter((a) => a !== actionOnFail),
                                        )
                                    }
                                />
                            }
                            slotProps={{
                                typography: { sx: { fontSize: '14px' } },
                            }}
                        />
                    ))}
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
                        .filter(({ name, actionOnFail, entityTemplateId }) => {
                            const matchesSearch = searchText === '' || name.toLowerCase().includes(searchText.toLowerCase());
                            const matchesActionOnFail = actionOnFailFilter.includes(actionOnFail);
                            const matchesEntityTemplate = entityTemplateFilter.some((et) => et._id === entityTemplateId);

                            return matchesSearch && matchesActionOnFail && matchesEntityTemplate;
                        })
                        .splice(pageParam, bulk)
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
