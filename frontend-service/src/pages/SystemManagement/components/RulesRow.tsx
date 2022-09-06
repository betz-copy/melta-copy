import React, { useState } from 'react';
import { Grid, IconButton } from '@mui/material';
import { AddCircle as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { ViewingCard } from './ViewingCard';
import { Header } from '../../../common/Header';
import { replaceItemById } from '../../../utils/reactQuery';
import SearchInput from '../../../common/inputs/SearchInput';
import { IMongoRule } from '../../../interfaces/rules';
import { RuleWizard } from '../../../common/wizards/rule';
import { ruleObjectToRuleForm, updateDisabledRuleRequest } from '../../../services/templates/rulesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

const RulesRow: React.FC = () => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IMongoRule[]>('getRules')!;
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;

    const [searchText, setSearchText] = useState('');

    const [ruleWizardDialogState, setRuleWizardDialogState] = useState<{
        isWizardOpen: boolean;
        rule: IMongoRule | null;
    }>({
        isWizardOpen: false,
        rule: null,
    });

    const { mutateAsync: updateDisabledMutateAsync } = useMutation((rule: IMongoRule) => updateDisabledRuleRequest(rule._id, !rule.disabled), {
        onSuccess: (data) => {
            queryClient.setQueryData<IMongoRule[]>('getRules', (prevData) => replaceItemById(data, prevData));
            if (data.disabled) toast.success(i18next.t('wizard.rule.disabledSuccessfully'));
            else toast.success(i18next.t('wizard.rule.activatedSuccessfully'));
        },
        onError: (_err, variables) => {
            if (variables.disabled) toast.error(i18next.t('wizard.rule.failedToActivate'));
            else toast.error(i18next.t('wizard.rule.failedToDisable'));
        },
    });

    return (
        <Grid item container marginBottom="30px">
            <Header title={i18next.t('rules')}>
                <Grid container spacing={1} alignItems="center">
                    <Grid item>
                        <SearchInput onChange={setSearchText} endAdornmentChildren={<SearchIcon />} />
                    </Grid>
                    <Grid item>
                        <IconButton onClick={() => setRuleWizardDialogState({ isWizardOpen: true, rule: null })}>
                            <AddIcon color="primary" fontSize="large" />
                        </IconButton>
                    </Grid>
                </Grid>
            </Header>
            <Grid container spacing={4}>
                {rules
                    .filter(({ name }) => searchText === '' || name.includes(searchText))
                    .map((rule) => (
                        <ViewingCard
                            minWidth={350}
                            key={rule._id}
                            title={rule.name}
                            onEditClick={() => {
                                setRuleWizardDialogState({
                                    isWizardOpen: true,
                                    rule,
                                });
                            }}
                            onDisableClick={() => updateDisabledMutateAsync(rule)}
                            disabledProps={{
                                isDisabled: rule.disabled,
                                canEdit: rule.disabled,
                                tooltipTitle: i18next.t('systemManagement.disabledRule'),
                            }}
                        />
                    ))}
            </Grid>
            <RuleWizard
                open={ruleWizardDialogState.isWizardOpen}
                handleClose={() => setRuleWizardDialogState({ isWizardOpen: false, rule: null })}
                initialValues={ruleObjectToRuleForm(ruleWizardDialogState.rule, entityTemplates)}
                isEditMode={Boolean(ruleWizardDialogState.rule)}
            />
        </Grid>
    );
};

export { RulesRow };
