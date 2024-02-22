import { Box, Grid } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import ProcessStatus from './ProcessStatus';
import StepsStatuses from './StepsStatuses';
import { IMongoProcessInstancePopulated } from '../../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';

export interface ProcessSummaryProp {
    processInstance: IMongoProcessInstancePopulated;
    processTemplate: IMongoProcessTemplatePopulated;
    isPrinting: boolean;
}

const ProcessSummary = React.forwardRef<HTMLDivElement, ProcessSummaryProp>(({ processInstance, processTemplate, isPrinting }, ref) => {
    return (
        <Box
            ref={ref}
            sx={{
                width: '100%',
                paddingRight: '60px',
                paddingLeft: '30px',
                paddingTop: isPrinting ? '60px' : undefined,
                overflowY: isPrinting ? 'visible' : 'auto',
            }}
            style={{ direction: 'rtl' }}
        >
            <Grid container justifyContent="space-around" direction="column">
                <Grid item xs={3}>
                    <ProcessStatus
                        title={i18next.t('wizard.processInstance.summary.processStatus')}
                        instance={processInstance}
                        isPrinting={isPrinting}
                    />
                </Grid>

                <Grid item xs={3}>
                    <StepsStatuses processInstance={processInstance} processTemplate={processTemplate} isPrinting={isPrinting} />
                </Grid>
            </Grid>
        </Box>
    );
});

export default ProcessSummary;
