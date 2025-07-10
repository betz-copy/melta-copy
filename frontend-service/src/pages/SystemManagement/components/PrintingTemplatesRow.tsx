import React, { useState } from 'react';
import { Grid, useTheme, Typography, Dialog } from '@mui/material';
import { useQueryClient } from 'react-query';
import { useUserStore } from '../../../stores/user';
import i18next from 'i18next';
import SearchInput from '../../../common/inputs/SearchInput';
import { CreateButton } from './CreateButton';
import { InfiniteScroll } from '../../../common/InfiniteScroll';
import { environment } from '../../../globals';
import { toast } from 'react-toastify';
import { IMongoPrintTemplate } from '../../../interfaces/printingTemplates';
import CreateOrEditPrintTemplate from './PrintingTemplateCard';

const PrintingTemplatesRow: React.FC = () => {
    const { infiniteScrollPageCount } = environment.processInstances;

    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const [searchText, setSearchText] = useState('');
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);
    const theme = useTheme();

    const printingTemplates = queryClient.getQueryData<IMongoPrintTemplate[]>('getPrintingTemplates')!;

    const [deletePrintingTemplateDialogState, setDeletePrintingTemplateDialogState] = useState<{
        isDialogOpen: boolean;
        printingTemplateId: string | null;
    }>({
        isDialogOpen: false,
        printingTemplateId: null,
    });

    const [printingTemplateWizardDialogState, setPrintingTemplateWizardDialogState] = useState<{
        isWizardOpen: boolean;
        printingTemplate: IMongoPrintTemplate | null;
    }>({
        isWizardOpen: false,
        printingTemplate: null,
    });

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
            <InfiniteScroll<IMongoPrintTemplate>
                queryKey={['searchPrintingTemplates', searchText]}
                queryFunction={({ pageParam }) =>
                    Array.from(printingTemplates.values())
                        .filter((printingTemplate) => searchText === '' || printingTemplate.name.includes(searchText))
                        .slice(pageParam, pageParam + infiniteScrollPageCount)
                }
                onQueryError={(error) => {
                    console.error('failed to search printing templates error:', error);
                    toast.error(i18next.t('failedToLoadResults'));
                }}
                getItemId={(printingTemplate) => printingTemplate._id}
                getNextPageParam={(lastPage, allPages) => {
                    const nextPage = allPages.length * infiniteScrollPageCount;
                    return lastPage.length ? nextPage : undefined;
                }}
                endText={i18next.t('noSearchLeft')}
                emptyText={i18next.t('failedToGetTemplates')}
                useContainer={false}
            >
                {(printingTemplate) => (
                    <Grid
                        item
                        key={printingTemplate._id}
                        onClick={() => setPrintingTemplateWizardDialogState({ isWizardOpen: true, printingTemplate })}
                        style={{ cursor: 'pointer' }}
                    >
                        <Typography>{printingTemplate.name}</Typography>
                    </Grid>
                )}
            </InfiniteScroll>
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
                                compactView: false,
                                addEntityCheckbox: false,
                                appendSignatureField: false,
                                _id: '',
                            }
                        }
                        setDeletePrintingTemplateDialogState={setDeletePrintingTemplateDialogState}
                        setPrintingTemplateWizardDialogState={setPrintingTemplateWizardDialogState}
                    />
                )}
            </Dialog>
        </Grid>
    );
};

export { PrintingTemplatesRow };
