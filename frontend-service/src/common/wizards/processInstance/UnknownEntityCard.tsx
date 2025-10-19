import { AppRegistration as AppRegistrationIcon } from '@mui/icons-material';
import { Card, CardHeader, Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import IconButtonWithPopover from '../../IconButtonWithPopover';
import BlueTitle from '../../MeltaDesigns/BlueTitle';

interface EntityCardProps {
    customActionButton?: {
        icon: React.ReactNode;
        onClick: (event) => void;
        popoverText?: string;
    };
    customCardStyle?: React.CSSProperties;
    variant?: 'outlined' | 'elevation';
}
const UnknownEntityCard: React.FC<EntityCardProps> = ({ customActionButton, customCardStyle, variant = 'outlined' }) => {
    return (
        <Card raised variant={variant} sx={{ overflowX: 'auto', borderRadius: '15px', ...customCardStyle }}>
            <CardHeader
                avatar={
                    <Grid>
                        <AppRegistrationIcon sx={{ fontSize: '40px' }} />
                    </Grid>
                }
                action={
                    <Grid container>
                        {customActionButton &&
                            (customActionButton.popoverText ? (
                                <IconButtonWithPopover
                                    popoverText={customActionButton.popoverText!}
                                    iconButtonProps={{
                                        size: 'large',
                                        onClick: (event) => {
                                            event.stopPropagation();
                                            customActionButton.onClick(event);
                                        },
                                    }}
                                >
                                    {customActionButton.icon}
                                </IconButtonWithPopover>
                            ) : (
                                <IconButton
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        customActionButton.onClick(event);
                                    }}
                                    size="large"
                                >
                                    {customActionButton.icon}
                                </IconButton>
                            ))}
                    </Grid>
                }
                title={<BlueTitle title={i18next.t('wizard.processInstance.unknownEntity')} component="h5" variant="h5" />}
                subheader={i18next.t('wizard.processInstance.entityWasDeleted')}
                sx={{ '& .MuiCardHeader-action': { marginRight: '0px' } }} // default is -8px
            />
        </Card>
    );
};

export default UnknownEntityCard;
