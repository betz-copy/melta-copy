import { PrintOutlined } from '@mui/icons-material';
import { Button, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';

interface DialogFooterProps {
    handleClose: () => void;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    selectedEntitiesCount: number;
    maxEntitiesToPrint: number;
    isPrintEntities?: boolean;
}

const DialogFooter: React.FC<DialogFooterProps> = ({ handleClose, selectedEntitiesCount, maxEntitiesToPrint, onClick, isPrintEntities }) => {
    const theme = useTheme();

    return (
        <Grid width={'100%'} container justifyContent={'flex-end'} marginBottom={2} spacing={2}>
            {isPrintEntities && (
                <Typography
                    variant="body2"
                    color={selectedEntitiesCount <= maxEntitiesToPrint ? theme.palette.text.secondary : 'error'}
                    align="left"
                    marginLeft={2}
                    alignContent={'space-around'}
                    sx={{ color: '#9398C2' }}
                >
                    {`${i18next.t('entityPage.print.limits.selected')} ${selectedEntitiesCount} ${i18next.t('entityPage.print.limits.entities')}`}
                </Typography>
            )}

            <Button
                variant="contained"
                onClick={(event) => {
                    handleClose();
                    onClick(event);
                }}
                endIcon={<PrintOutlined />}
                sx={{ borderRadius: '7px', fontWeight: 400, marginRight: 2 }}
            >
                {i18next.t('entityPage.print.continue')}
            </Button>
        </Grid>
    );
};

export default DialogFooter;
