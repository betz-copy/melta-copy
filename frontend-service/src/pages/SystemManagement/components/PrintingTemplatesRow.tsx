import React, { useState } from 'react';
import { Grid, Typography, Dialog } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useUserStore } from '../../../stores/user';
import i18next from 'i18next';
import SearchInput from '../../../common/inputs/SearchInput';
import { CreateButton } from './CreateButton';
import { environment } from '../../../globals';
import { IMongoPrintingTemplate } from '../../../interfaces/printingTemplates';
import CreateOrEditPrintTemplate from '../../../common/wizards/printingTemplate/createOrEditPrintingTemplate';
import { searchPrintingTemplatesRequest, deletePrintingTemplateRequest } from '../../../services/templates/printingTemplateService';
import { PrintingTemplateCard } from './PrintingTemplateCard';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { toast } from 'react-toastify';

const fetchPrintingTemplates = async () => {
    return await searchPrintingTemplatesRequest({});
};

const deletePrintingTemplate = async (templateId: string) => {
    return await deletePrintingTemplateRequest(templateId);
};

const PrintingTemplatesRow: React.FC = () => {
    const { infiniteScrollPageCount } = environment.processInstances;
    const currentUser = useUserStore((state) => state.user);
    const [searchText, setSearchText] = useState('');
    const queryClient = useQueryClient();

    const [deletePrintingTemplateDialogState, setDeletePrintingTemplateDialogState] = useState<{
        isDialogOpen: boolean;
        printingTemplateId: string | null;
    }>({
        isDialogOpen: false,
        printingTemplateId: null,
    });

    const [printingTemplateWizardDialogState, setPrintingTemplateWizardDialogState] = useState<{
        isWizardOpen: boolean;
        printingTemplate: IMongoPrintingTemplate | null;
    }>({
        isWizardOpen: false,
        printingTemplate: null,
    });

    const { data: printingTemplates = [] } = useQuery<IMongoPrintingTemplate[]>('getPrintingTemplates', fetchPrintingTemplates);

    const deleteMutation = useMutation(deletePrintingTemplate, {
        onSuccess: () => {
            queryClient.invalidateQueries('getPrintingTemplates');
            toast.success(i18next.t('wizard.printingTemplate.deletedSuccessfully'));
            setDeletePrintingTemplateDialogState({ isDialogOpen: false, printingTemplateId: null });
        },
        onError: () => {
            toast.error(i18next.t('wizard.printingTemplate.failedToDelete'));
        },
    });

    const filteredTemplates = printingTemplates.filter((printingTemplate) => searchText === '' || printingTemplate.name.includes(searchText));

    return (
        <Grid item container marginBottom="30px" gap="30px">
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    <SearchInput onChange={setSearchText} borderRadius="7px" placeholder={i18next.t('globalSearch.searchPrints')} />
                </Grid>
                <Grid item>
                    <CreateButton
                        onClick={() => setPrintingTemplateWizardDialogState({ isWizardOpen: true, printingTemplate: null })}
                        text={i18next.t('systemManagement.newPrintingTemplate')}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                {filteredTemplates.length === 0 ? (
                    <Grid item xs={12}>
                        <Typography>{i18next.t('failedToGetTemplates')}</Typography>
                    </Grid>
                ) : (
                    filteredTemplates.map((printingTemplate) => (
                        <Grid item key={printingTemplate._id}>
                            <PrintingTemplateCard
                                printingTemplate={printingTemplate}
                                setPrintingTemplateWizardDialogState={setPrintingTemplateWizardDialogState}
                                setDeletePrintingTemplateDialogState={setDeletePrintingTemplateDialogState}
                            />
                        </Grid>
                    ))
                )}
            </Grid>
            <Dialog
                open={printingTemplateWizardDialogState.isWizardOpen}
                onClose={() => setPrintingTemplateWizardDialogState({ isWizardOpen: false, printingTemplate: null })}
                maxWidth="lg"
                fullWidth
            >
                {printingTemplateWizardDialogState.isWizardOpen && (
                    <CreateOrEditPrintTemplate
                        printingTemplate={
                            printingTemplateWizardDialogState.printingTemplate || {
                                name: '',
                                sections: [],
                                compactView: true,
                                addEntityCheckbox: false,
                                appendSignatureField: false,
                                _id: '',
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }
                        }
                        onClose={() => setPrintingTemplateWizardDialogState({ isWizardOpen: false, printingTemplate: null })}
                    />
                )}
            </Dialog>
            <AreYouSureDialog
                open={deletePrintingTemplateDialogState.isDialogOpen}
                handleClose={() => setDeletePrintingTemplateDialogState({ isDialogOpen: false, printingTemplateId: null })}
                onYes={() => {
                    if (deletePrintingTemplateDialogState.printingTemplateId) {
                        deleteMutation.mutate(deletePrintingTemplateDialogState.printingTemplateId);
                    }
                }}
                isLoading={deleteMutation.isLoading}
            />
        </Grid>
    );
};

export { PrintingTemplatesRow };
