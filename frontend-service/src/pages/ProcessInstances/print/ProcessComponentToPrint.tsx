import React from 'react';
import { Box, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { IFile } from '../../../interfaces/entities';
import { RootState } from '../../../store';
import { IMongoProcessInstance, IMongoProcessInstancePopulated, IProcessInstance } from '../../../interfaces/processes/processInstance';
import GeneralDetails from '../../../common/wizards/processInstance/ProcessDetails/GeneralDetails';
import { EntityDates } from '../../Entity/components/EntityDates';

const ProcessComponentToPrint: React.FC<{
    processTemplate: IMongoProcessInstancePopulated;
    process: IMongoProcessInstance;
    options?: { showFiles?: boolean };
    files?: IFile[];
}> = ({ processTemplate, process, options = { showFiles: true }, files }) => {
    const theme = useTheme();

    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Box border={`2px solid ${theme.palette.primary.main}`} borderRadius="20px" padding="1rem" style={{ pageBreakInside: 'avoid' }}>
            <Box padding="0.2rem">
                <GeneralDetails detailsFormikData={process} processInstance={processTemplate} />
            </Box>

            <EntityDates createdAt={process.createdAt} updatedAt={process.updatedAt} />
        </Box>
    );
};

export { ProcessComponentToPrint };
