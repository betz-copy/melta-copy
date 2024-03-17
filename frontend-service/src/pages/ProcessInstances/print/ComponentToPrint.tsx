import React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { BlueTitle } from '../../../common/BlueTitle';
import { IFile } from '../../../interfaces/entities';
import { useFilePreview } from '../../../utils/useFilePreview';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../interfaces/processes/processTemplate';
import { getColor } from '../../../common/wizards/processInstance/ProcessSummaryStep/ProcessStatus';
import { FileToPrint } from '../../Entity/components/print/FileToPrint';
import ProcessSummary from '../../../common/wizards/processInstance/ProcessSummaryStep';

const FileData: React.FC<{
    file: IFile;
    isFilesLoading: Set<number> | undefined;
    setIsFilesLoading: React.Dispatch<React.SetStateAction<Set<number> | undefined>>;
    index: number;
    setIsFilesError: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ file, isFilesLoading, setIsFilesLoading, index, setIsFilesError }) => {
    const filePreview = useFilePreview(file.id, file.type);
    const { data, refetch, isLoading, isError } = filePreview;
    if (!data) {
        refetch();
    }

    if (isError) {
        setIsFilesError(true);
    }

    if (isLoading && !isFilesLoading?.has(index)) {
        const newLoadingSet = new Set(isFilesLoading);
        newLoadingSet.add(index);
        setIsFilesLoading(newLoadingSet);
    }
    if (!isLoading && isFilesLoading?.has(index)) {
        const newLoadingSet = new Set(isFilesLoading);
        newLoadingSet.delete(index);
        setIsFilesLoading(newLoadingSet);
    }
    return <FileToPrint file={file} key={`${file.id}${file.name}`} filePreview={filePreview} />;
};

const ComponentToPrint = React.forwardRef<
    HTMLDivElement,
    {
        processTemplate: IMongoProcessTemplatePopulated;
        expandedProcess: IMongoProcessInstancePopulated;
        isFilesLoading: Set<number> | undefined;
        setIsFilesLoading: React.Dispatch<React.SetStateAction<Set<number> | undefined>>;
        setIsFilesError: React.Dispatch<React.SetStateAction<boolean>>;
        filesToPrint: IFile[];
        options: {
            showSummary: boolean;
            showFiles: boolean;
        };
    }
>(({ processTemplate, expandedProcess, options, filesToPrint, isFilesLoading, setIsFilesLoading, setIsFilesError }, ref) => {
    const theme = useTheme();

    return (
        <>
            {options.showSummary && <ProcessSummary ref={ref} isPrinting processInstance={expandedProcess} processTemplate={processTemplate} />}
            <Box ref={ref} margin="20px" style={{ direction: 'rtl' }}>
                <Box paddingBottom="0.4rem" display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center">
                        <Typography component="h4" variant="h4" color={theme.palette.primary.main} fontWeight="800">
                            {expandedProcess.name}
                        </Typography>

                        <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                            /
                        </Typography>

                        <Typography paddingBottom="2px" variant="h4" fontSize="28px" color={theme.palette.primary.main}>
                            {processTemplate.displayName}
                        </Typography>
                    </Box>
                    <Box color={getColor(expandedProcess.status)}> {expandedProcess.status}</Box>
                </Box>
                <BlueTitle title={i18next.t('processInstance.processDetails')} component="h4" variant="h4" style={{ marginTop: '2rem' }} />
                {options.showFiles && (
                    <>
                        <Grid sx={{ width: '100%', height: '100%', paddingY: '55%', paddingX: '37.5%' }}>
                            <BlueTitle title={i18next.t('entityPage.print.appendices')} component="h2" variant="h2" style={{ marginTop: '2rem' }} />
                        </Grid>
                        {filesToPrint.map((file, index) => {
                            return (
                                <FileData
                                    file={file}
                                    key={file.id}
                                    isFilesLoading={isFilesLoading}
                                    setIsFilesLoading={setIsFilesLoading}
                                    index={index}
                                    setIsFilesError={setIsFilesError}
                                />
                            );
                        })}
                    </>
                )}
            </Box>
        </>
    );
});

export { ComponentToPrint };
