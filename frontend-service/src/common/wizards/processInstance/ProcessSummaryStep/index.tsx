import { Box, Divider, Grid } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import { FormikProps } from 'formik';
import ProcessStatus from './ProcessStatus';
import StepsStatuses from './StepsStatuses';
import { IMongoProcessInstancePopulated, Status } from '../../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { BlueTitle } from '../../../BlueTitle';
import SummaryProperties from './SummaryProperties';

export interface SummaryDetailsValues {
    summaryDetails: object;
    summaryAttachments: object;
    entityReferences: object;
    status: Status;
}

export interface ProcessSummaryProp {
    summaryFormikData: FormikProps<SummaryDetailsValues>;
    isEditMode?: boolean;
    processInstance: IMongoProcessInstancePopulated;
    processTemplate: IMongoProcessTemplatePopulated;
}

const ProcessSummary: React.FC<ProcessSummaryProp> = ({ processInstance, processTemplate, summaryFormikData, isEditMode }) => {
    return (
        <Box
            sx={{
                width: '100%',
                paddingRight: '60px',
                paddingLeft: '30px',
            }}
        >
            <BlueTitle
                title={i18next.t('wizard.processInstance.summary.title')}
                component={'h5'}
                variant={'h5'}
                style={{ fontWeight: 800, opacity: 0.9, padding: '10px' }}
            />
            <Divider variant="fullWidth" style={{ marginBottom: '25px' }} />
            <Grid container justifyContent="space-around">
                <Grid item xs={3.5} >
                    <StepsStatuses processInstance={processInstance} processTemplate={processTemplate} />
                </Grid>
                <Grid item container xs={0.01}>
                    <Divider orientation="vertical" flexItem />
                </Grid>
                <Grid item xs={4.5} >
                    <SummaryProperties isEditMode={isEditMode} formik={summaryFormikData} template={processTemplate} />
                </Grid>
                <Grid item container xs={0.01}>
                    <Divider style={{ width: '100%' }} orientation="vertical" flexItem />
                </Grid>
                <Grid item xs={2}>
                    <ProcessStatus
                        title={i18next.t('wizard.processInstance.summary.processStatus')}
                        isEditMode={isEditMode}
                        instance={processInstance}
                        setFieldValue={summaryFormikData.setFieldValue}
                        values={summaryFormikData.values}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProcessSummary;
