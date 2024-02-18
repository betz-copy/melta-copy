import { Box, Grid } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import ProcessStatus from './ProcessStatus';
import StepsStatuses from './StepsStatuses';
import { IMongoProcessInstancePopulated } from '../../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import './ProcessSummary.css';

export interface ProcessSummaryProp {
    processInstance: IMongoProcessInstancePopulated;
    processTemplate: IMongoProcessTemplatePopulated;
    print: boolean;
}

const ProcessSummary = React.forwardRef<HTMLDivElement, ProcessSummaryProp>(({ processInstance, processTemplate, print }, ref) => {
    return (
        <Box
            ref={ref}
            sx={{
                width: '100%',
                paddingRight: '60px',
                paddingLeft: '30px',
                ...(!print ? { overflowY: 'auto' } : {}),
                ...(print ? { overflow: 'none' } : {}),
            }}
        >
            <Grid container justifyContent="space-around" direction="column">
                <Grid item xs={3}>
                    <ProcessStatus title={i18next.t('wizard.processInstance.summary.processStatus')} instance={processInstance} print={print} />
                </Grid>

                <Grid item xs={3}>
                    <StepsStatuses processInstance={processInstance} processTemplate={processTemplate} print={print} />
                </Grid>
            </Grid>
        </Box>
    );
});

export default ProcessSummary;
