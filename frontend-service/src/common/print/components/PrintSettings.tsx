import { Box, Grid, TextField, Typography } from '@mui/material';
import { IMongoPrintingTemplate } from '@packages/printing-template';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { IFile } from '../../../interfaces/preview';
import { IPrintingTemplateMap } from '../../../interfaces/template';
import MultipleSelect, { ISelectOption } from '../../inputs/MultipleSelect';
import { PrintItem } from '../PrintOptionsDialog';
import OptionsSection from './OptionsSection';

interface IPrintSettingsProps {
    isPrintEntities: boolean;
    title: string;
    setTitle: (title: string) => void;
    selectedPrintingTemplate?: { _id: string; name: string };
    setSelectedPrintingTemplate?: React.Dispatch<React.SetStateAction<IMongoPrintingTemplate | undefined>>;
    files: IFile[];
    selectedFiles: (IFile & { isLoading: boolean })[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<(IFile & { isLoading: boolean })[]>>;
    printItem: PrintItem;
}

const PrintSettings: React.FC<IPrintSettingsProps> = ({
    isPrintEntities,
    title,
    setTitle,
    selectedPrintingTemplate,
    setSelectedPrintingTemplate,
    files,
    selectedFiles,
    setSelectedFiles,
    printItem,
}) => {
    const queryClient = useQueryClient();

    const printingTemplatesMap = queryClient.getQueryData<IPrintingTemplateMap>('getPrintingTemplates')!;
    const printingTemplates = Array.from(printingTemplatesMap.values());

    const templateOptions: ISelectOption[] = (printingTemplates || []).map((t) => ({ label: t.name, value: t._id }));

    const getFile = (optionId: string) => files.find(({ id }) => id === optionId)!;

    return (
        <>
            <Grid container spacing={2} flexDirection={'column'} marginTop={0.5} sx={{ width: '90%' }}>
                <TextField
                    value={title}
                    onChange={({ target: { value: newValue } }) => setTitle(newValue)}
                    label={i18next.t('entityPage.print.title')}
                />
                {isPrintEntities && (
                    <Box width={'100%'}>
                        <MultipleSelect
                            id="print"
                            items={templateOptions}
                            selectedValue={
                                selectedPrintingTemplate?._id ? { label: selectedPrintingTemplate.name, value: selectedPrintingTemplate._id } : null
                            }
                            onChange={(_, newVal) => {
                                setSelectedPrintingTemplate?.(printingTemplatesMap.get((newVal as ISelectOption)?.value) || undefined);
                            }}
                            variant="outlined"
                            label={i18next.t('entityPage.print.template')}
                        />
                    </Box>
                )}
            </Grid>
            <Box sx={{ width: '90%', height: '1px', backgroundColor: '#CCCFE580', margin: '20px 0px' }} />
            <Grid>
                <Grid marginTop={2}>
                    {files.length !== 0 && (
                        <MultipleSelect
                            id="print"
                            multiple
                            items={files.map(({ id, name }) => ({ label: name, value: id }))}
                            selectedValue={selectedFiles.map(({ id, name }) => ({ label: name, value: id }))}
                            onChange={(_event, newVal) => {
                                if (newVal === null) return;
                                setSelectedFiles(
                                    Array.isArray(newVal)
                                        ? newVal.map(({ value }) => ({ ...getFile(value), isLoading: true }))
                                        : [{ ...getFile(newVal.value), isLoading: true }],
                                );
                            }}
                            textFieldProps={{ sx: { width: '90%' } }}
                            variant="outlined"
                            label={i18next.t('entityPage.print.chooseFiles')}
                        />
                    )}
                </Grid>
                <Grid container direction="column" gap={1} paddingTop={1} paddingLeft={1.5}>
                    <OptionsSection printItem={printItem} />
                </Grid>
                {selectedPrintingTemplate && (
                    <Box
                        sx={{
                            width: '100%',
                            fontSize: '12px',
                            color: '#787C9E',
                            px: 4,
                        }}
                    >
                        <Typography component="span" sx={{ color: '#FF006B', fontSize: '12px', mr: 1 }}>
                            {i18next.t('entityPage.print.warning.payAttention')}
                        </Typography>
                        {i18next.t('entityPage.print.warning.previewWarning')}
                    </Box>
                )}
            </Grid>
        </>
    );
};

export default PrintSettings;
