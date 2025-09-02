import React, { useState } from 'react';
import { Box, Grid, TextField, Typography } from '@mui/material';
import { EntityTemplateWizardValues } from '.';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { StepComponentProps } from '../index';
import i18next from 'i18next';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { InfoOutlined } from '@mui/icons-material';

export const WalletTransferSettings: React.FC<
    StepComponentProps<EntityTemplateWizardValues> & {
        showAccountDisplay: boolean;
    }
> = ({ values, errors, showAccountDisplay, ...props }) => {
    const [walletTransfer, setWalletTransfer] = useState(false); // useState(values.walletTransfer ?? false);
    console.log({ props, values });

    return (
        <Grid>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MeltaCheckbox
                    checked={walletTransfer}
                    onChange={(e) => {
                        setWalletTransfer(e.target.checked);
                    }}
                    disabled={showAccountDisplay}
                />
                <Typography>{i18next.t('wizard.entityTemplate.walletTransfer.transfer')}</Typography>
                <MeltaTooltip title={showAccountDisplay ? 'לא ניתן כי נבחר כתצוגת ארנק' : 'תבנית יישות העברה '}>
                    <InfoOutlined
                        sx={{
                            fontSize: 16,
                            opacity: 0.7,
                            cursor: 'help',
                            ml: 1,
                        }}
                    />
                </MeltaTooltip>
            </Box>
            <Grid container width="100%">
                <Grid container spacing={3} direction="row">
                    <Grid size={{xs:6}}>
                        <TextField
                            select
                            type="text"
                            label={i18next.t('wizard.entityTemplate.walletTransfer.destination')}
                            onChange={(e) => {}}
                            // error={touchedType && Boolean(errorType)}
                            // helperText={touchedType && errorType}
                            sx={{ marginRight: '5px' }}
                            fullWidth
                            disabled={!walletTransfer}
                        ></TextField>
                    </Grid>
                    <Grid size={{xs:6}}>
                        <TextField
                            select
                            type="text"
                            label={i18next.t('wizard.entityTemplate.walletTransfer.source')}
                            onChange={(e) => {}}
                            // error={touchedType && Boolean(errorType)}
                            // helperText={touchedType && errorType}
                            sx={{ marginRight: '5px' }}
                            fullWidth
                            disabled={!walletTransfer}
                        ></TextField>
                    </Grid>
                </Grid>
                <Grid container  spacing={3} direction="row">
                    <Grid size={{xs:6}}>
                        <TextField
                            select
                            type="text"
                            label={i18next.t('wizard.entityTemplate.walletTransfer.amount')}
                            onChange={(e) => {}}
                            // error={touchedType && Boolean(errorType)}
                            // helperText={touchedType && errorType}
                            sx={{ marginRight: '5px' }}
                            fullWidth
                            disabled={!walletTransfer}
                        ></TextField>
                    </Grid>
                    <Grid size={{xs:6}}>
                        <TextField
                            select
                            type="text"
                            label={i18next.t('wizard.entityTemplate.walletTransfer.description')}
                            onChange={(e) => {}}
                            // error={touchedType && Boolean(errorType)}
                            // helperText={touchedType && errorType}
                            sx={{ marginRight: '5px' }}
                            fullWidth
                            disabled={!walletTransfer}
                        ></TextField>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};
