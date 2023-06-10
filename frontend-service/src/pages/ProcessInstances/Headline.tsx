import React, { Dispatch, SetStateAction } from 'react';
import { Button, Grid, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { TopBarGrid } from '../../common/TopBar';
import { BlueTitle } from '../../common/BlueTitle';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
import ProcessTemplatesSelectCheckbox from './ProcessTemplatesCheckbox';
import { AddProcessButton } from './AddProcessButton';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { useQueryClient } from 'react-query';
import { IPermissionsOfUser } from '../../services/permissionsService';
import './ProcessesList.css';
import DateRange from '../../common/inputs/DateRange';
import ProcessExplanationDialogStepper from './processExplanation';

const ProcessInstancesHeadline: React.FC<{
    onSearch: (value: string) => void;
    onSetStartDate: (newStartDateInput: Date | null) => void;
    onSetEndDate: (newEndDateInput: Date | null) => void;
    templatesSelectCheckboxProps: {
        templates: IMongoProcessTemplatePopulated[];
        templatesToShow: IMongoProcessTemplatePopulated[];
        setTemplatesToShow: Dispatch<SetStateAction<IMongoProcessTemplatePopulated[]>>;
    };
    startDateInput: Date | null;
    endDateInput: Date | null;
}> = ({ onSearch, onSetStartDate, onSetEndDate, templatesSelectCheckboxProps, startDateInput, endDateInput }) => {
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    const [openDialog, setOpenDialog] = React.useState(false);
    const handleClose = () => setOpenDialog(false);

    return (
        <TopBarGrid sx={{ height: '5em' }} container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid item>
                <Grid container spacing={5} wrap="nowrap">
                    <Grid item>
                        <BlueTitle title={i18next.t('pages.processInstances')} component="h4" variant="h4" />
                    </Grid>
                    <Grid item>
                        <Grid container wrap="nowrap">
                            <Grid item>
                                <ProcessTemplatesSelectCheckbox
                                    templates={templatesSelectCheckboxProps.templates}
                                    selectedTemplates={templatesSelectCheckboxProps.templatesToShow}
                                    setSelectedTemplates={templatesSelectCheckboxProps.setTemplatesToShow}
                                />
                            </Grid>
                            <Grid item>
                                <GlobalSearchBar onSearch={onSearch} />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <DateRange
                            onStartDateChange={onSetStartDate}
                            onEndDateChange={onSetEndDate}
                            startDateInput={startDateInput}
                            endDateInput={endDateInput}
                        />
                    </Grid>
                </Grid>
            </Grid>
            <Grid item>
                <Grid container spacing={2} wrap="nowrap">
                    <Grid item>
                        <Button style={{ borderRadius: '5px', border: '1px solid #225AA7' }} onClick={() => setOpenDialog(true)}>
                            <Typography fontSize={14} style={{ fontWeight: '500', padding: '2px', color: 'black' }}>
                                {i18next.t('processInstancesPage.whatsNew')}
                            </Typography>
                        </Button>
                    </Grid>
                    <Grid item>
                        {/* {myPermissions.processesManagementId && ( */}
                        <AddProcessButton style={{ background: '#225AA7', borderRadius: '5px' }}>
                            <AddIcon htmlColor="white" />
                            <Typography fontSize={14} style={{ fontWeight: '500', padding: '0 10px', color: 'white' }}>
                                {i18next.t('processInstancesPage.addProcess')}
                            </Typography>
                        </AddProcessButton>
                        {/* )} */}
                    </Grid>
                </Grid>
                <ProcessExplanationDialogStepper open={openDialog} handleClose={handleClose} />
            </Grid>
        </TopBarGrid>
    );
};

export default ProcessInstancesHeadline;

