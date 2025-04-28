import { Box, Grid } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import { IMongoProcessInstanceReviewerPopulated, IMongoProcessTemplateReviewerPopulated } from '@microservices/shared-interfaces';
import ProcessStatus from './ProcessStatus';
import StepsStatuses from './StepsStatuses';

export interface ProcessSummaryProp {
    processInstance: IMongoProcessInstanceReviewerPopulated;
    processTemplate: IMongoProcessTemplateReviewerPopulated;
    isPrinting: boolean;
}

const ProcessSummary = React.forwardRef<HTMLDivElement, ProcessSummaryProp>(({ processInstance, processTemplate, isPrinting }) => {
    return (
        <Box
            sx={{
                width: '100%',
                paddingX: '30px',
                paddingTop: isPrinting ? '30px' : undefined,
                overflowY: isPrinting ? 'visible' : 'auto',
            }}
            style={{ direction: 'rtl' }}
        >
            <Grid container alignItems="space-around" direction="column">
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
