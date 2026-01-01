import { Dialog, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import SearchInput from '../../../common/inputs/SearchInput';
import CreateOrEditPrintTemplate from '../../../common/wizards/printingTemplate/createOrEditPrintingTemplate';
import { IMongoPrintingTemplate, IPrintingTemplateMap } from '../../../interfaces/printingTemplates';
import { deletePrintingTemplateRequest } from '../../../services/templates/printingTemplateService';
import { CreateButton } from './CreateButton';
import { PrintingTemplateCard } from './PrintingTemplateCard';

export interface IDeleteDialogState {
    isOpen: boolean;
    printingTemplateId: string | null;
}

export interface IWizardDialogState {
    isOpen: boolean;
    printingTemplate: IMongoPrintingTemplate | null;
}

const PrintingTemplatesRow: React.FC = () => {
    const [searchText, setSearchText] = useState<string>('');
    const queryClient = useQueryClient();

    const closeWizard = { isOpen: false, printingTemplate: null };
    const closeDeleteDialog = { isOpen: false, printingTemplateId: null };

    const [deleteDialog, setDeleteDialog] = useState<IDeleteDialogState>(closeDeleteDialog);

    const [wizardDialog, setWizardDialog] = useState<IWizardDialogState>(closeWizard);

    const processTemplatesMap = queryClient.getQueryData<IPrintingTemplateMap>('getPrintingTemplates')!;
    const printingTemplates = Array.from(processTemplatesMap.values());

    const deleteMutation = useMutation(deletePrintingTemplateRequest, {
        onSuccess: (_data, id) => {
            queryClient.setQueryData<IPrintingTemplateMap>('getPrintingTemplates', (data) => {
                data!.delete(id);
                return data!;
            });
            toast.success(i18next.t('wizard.printingTemplate.deletedSuccessfully'));
            setDeleteDialog(closeDeleteDialog);
        },
        onError: () => {
            toast.error(i18next.t('wizard.printingTemplate.failedToDelete'));
        },
    });

    const filteredTemplates = printingTemplates.filter((printingTemplate) => searchText === '' || printingTemplate.name.includes(searchText));

    const emptyPrintTemplate = {
        name: '',
        sections: [],
        compactView: true,
        addEntityCheckbox: false,
        appendSignatureField: false,
        _id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    return (
        <Grid container direction="column" marginBottom="30px" gap="30px">
            <Grid container spacing={1} alignItems="center">
                <Grid>
                    <SearchInput onChange={setSearchText} borderRadius="7px" placeholder={i18next.t('globalSearch.searchPrints')} />
                </Grid>
                <Grid>
                    <CreateButton
                        onClick={() => setWizardDialog({ ...closeWizard, isOpen: true })}
                        text={i18next.t('systemManagement.newPrintingTemplate')}
                    />
                </Grid>
            </Grid>
            <Grid direction="column" width="100%">
                {filteredTemplates.map((printingTemplate) => (
                    <Grid key={printingTemplate._id}>
                        <PrintingTemplateCard
                            printingTemplate={printingTemplate}
                            setWizardDialog={setWizardDialog}
                            setDeleteDialog={setDeleteDialog}
                        />
                    </Grid>
                ))}
                {!filteredTemplates.length && <Typography>{i18next.t('noOptions')}</Typography>}
            </Grid>
            <Dialog open={wizardDialog.isOpen} onClose={() => setWizardDialog(closeWizard)} maxWidth="lg" fullWidth>
                {wizardDialog.isOpen && (
                    <CreateOrEditPrintTemplate
                        printingTemplate={wizardDialog.printingTemplate || emptyPrintTemplate}
                        isEditMode={!!wizardDialog.printingTemplate}
                        onClose={() => setWizardDialog(closeWizard)}
                    />
                )}
            </Dialog>
            <AreYouSureDialog
                open={deleteDialog.isOpen}
                handleClose={() => setDeleteDialog(closeDeleteDialog)}
                onYes={() => {
                    if (deleteDialog.printingTemplateId) deleteMutation.mutate(deleteDialog.printingTemplateId);
                }}
                isLoading={deleteMutation.isLoading}
            />
        </Grid>
    );
};

export default PrintingTemplatesRow;
