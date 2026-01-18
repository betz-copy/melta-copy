import { ContentCopy } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Tooltip, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface AISummaryDialogProps {
    open: boolean;
    handleClose: () => void;
    initialSummary: string;
}

export const AISummaryDialog: React.FC<AISummaryDialogProps> = ({ open, handleClose, initialSummary }) => {
    const theme = useTheme();
    const [summary, setSummary] = useState(initialSummary);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            toast.success(i18next.t('actions.copiedToClipboard'));
        } catch {
            toast.error('Failed to copy');
        }
    };

    // Reset summary when dialog opens with new content
    React.useEffect(() => {
        setSummary(initialSummary);
    }, [initialSummary]);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableEnforceFocus>
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600,
                    fontSize: 20,
                    color: theme.palette.primary.main,
                }}
            >
                {i18next.t('actions.aiSummary')}
                <Tooltip title={i18next.t('actions.copyToClipboard')}>
                    <IconButton onClick={handleCopy} size="small">
                        <ContentCopy />
                    </IconButton>
                </Tooltip>
            </DialogTitle>
            <DialogContent>
                <TextField
                    multiline
                    rows={12}
                    fullWidth
                    variant="outlined"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px' }}>
                <Button variant="contained" onClick={handleClose} sx={{ borderRadius: '7px', color: 'white' }}>
                    {i18next.t('actions.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
