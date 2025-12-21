import { Dialog, Grid, Typography } from '@mui/material';
import { IMongoPrintingTemplate, IPrintingTemplateMap } from '@packages/printing-template';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import SearchInput from '../../../common/inputs/SearchInput';
import CreateOrEditPrintTemplate from '../../../common/wizards/printingTemplate/createOrEditPrintingTemplate';
import { deletePrintingTemplateRequest } from '../../../services/templates/printingTemplateService';
import { CreateButton } from './CreateButton';
import { PrintingTemplateCard } from './PrintingTemplateCard';

const PrintingTemplatesRow: React.FC = () => {
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

    const processTemplatesMap = queryClient.getQueryData<IPrintingTemplateMap>('getPrintingTemplates')!;
    const printingTemplates = Array.from(processTemplatesMap.values());

    const deleteMutation = useMutation(deletePrintingTemplateRequest, {
        onSuccess: (_data, id) => {
            queryClient.setQueryData<IPrintingTemplateMap>('getPrintingTemplates', (data) => {
                data!.delete(id);
                return data!;
            });
            toast.success(i18next.t('wizard.printingTemplate.deletedSuccessfully'));
            setDeletePrintingTemplateDialogState({ isDialogOpen: false, printingTemplateId: null });
        },
        onError: () => {
            toast.error(i18next.t('wizard.printingTemplate.failedToDelete'));
        },
    });

    const filteredTemplates = printingTemplates.filter((printingTemplate) => searchText === '' || printingTemplate.name.includes(searchText));

    return (
        <Grid container direction="column" marginBottom="30px" gap="30px">
            <Grid container spacing={1} alignItems="center">
                <Grid>
                    <SearchInput onChange={setSearchText} borderRadius="7px" placeholder={i18next.t('globalSearch.searchPrints')} />
                </Grid>
                <Grid>
                    <CreateButton
                        onClick={() => setPrintingTemplateWizardDialogState({ isWizardOpen: true, printingTemplate: null })}
                        text={i18next.t('systemManagement.newPrintingTemplate')}
                    />
                </Grid>
            </Grid>
            <Grid direction="column" width="100%">
                {filteredTemplates.map((printingTemplate) => (
                    <Grid key={printingTemplate._id}>
                        <PrintingTemplateCard
                            printingTemplate={printingTemplate}
                            setPrintingTemplateWizardDialogState={setPrintingTemplateWizardDialogState}
                            setDeletePrintingTemplateDialogState={setDeletePrintingTemplateDialogState}
                        />
                    </Grid>
                ))}
                {!filteredTemplates.length && <Typography>{i18next.t('noOptions')}</Typography>}
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

export default PrintingTemplatesRow;
