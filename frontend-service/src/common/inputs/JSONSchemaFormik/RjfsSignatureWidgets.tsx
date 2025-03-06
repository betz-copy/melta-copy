// eslint-disable-next-line import/no-extraneous-dependencies
import SignatureCanvas from 'react-signature-canvas';
import React, { useCallback, useEffect, useRef } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Box, Button, ThemeProvider, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getFilePreviewRequest } from '../../../services/previewService';
import { darkTheme, lightTheme } from '../../../theme';

const RjfsSignatureWidget = ({ id, required, readonly, disabled, label, value, onChange, onBlur }: WidgetProps) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const isDisabled = readonly || disabled;
    const globalTheme = useTheme();
    const signatureCanvas = useRef<SignatureCanvas | null>(null);

    useEffect(() => {
        const fetchSignature = async () => {
            if (value && signatureCanvas.current) {
                try {
                    const current = await getFilePreviewRequest(value, 'contentType');
                    signatureCanvas.current?.fromDataURL(current);
                } catch (error) {
                    console.error('Error loading signature preview:', error);
                }
            }
        };
        fetchSignature();
    }, [value]);

    useEffect(() => {
        if (signatureCanvas.current) {
            if (readonly || disabled) {
                signatureCanvas.current.off();
            } else {
                signatureCanvas.current.on();
            }
        }
    }, [readonly, disabled]);

    const saveSignature = useCallback(() => {
        if (!signatureCanvas.current) return;
        if (signatureCanvas.current.isEmpty()) onChange(undefined);
        else onChange(signatureCanvas.current.toDataURL());
    }, []);

    const clearSignature = () => {
        if (!signatureCanvas.current) return;
        signatureCanvas.current.clear();
        onChange(undefined);
    };

    if (required && (!signatureCanvas.current || signatureCanvas.current.isEmpty())) onBlur(id, value);

    return (
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <Box display="flex" flexDirection="column" className="signature">
                <Box sx={{ position: 'relative', width: 210 }}>
                    <Typography
                        sx={{
                            fontSize: '15px',
                            color: darkMode ? 'white' : 'black',
                            padding: '0 3px',
                            userSelect: 'none',
                        }}
                    >
                        {label}
                    </Typography>
                    <SignatureCanvas
                        ref={signatureCanvas}
                        velocityFilterWeight={0.7}
                        penColor="black"
                        canvasProps={{
                            className: 'signature',
                            width: 205,
                            height: '100%',
                            style: {
                                // eslint-disable-next-line no-nested-ternary
                                backgroundColor: darkMode ? '#44505D' : !isDisabled ? '#fff' : undefined,
                                border:
                                    !signatureCanvas.current || signatureCanvas.current.isEmpty()
                                        ? '1px solid rgb(154, 159, 202)'
                                        : `1.5px solid ${darkMode ? 'white' : `${globalTheme.palette.primary.main}`}`,
                                borderRadius: '8px',
                                boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.1)',
                            },
                        }}
                        onEnd={saveSignature}
                        clearOnResize={false}
                    />
                </Box>
                {!isDisabled && (
                    <Box>
                        <Button
                            color="primary"
                            onClick={clearSignature}
                            sx={{ fontSize: '12px', padding: '0 3px', display: 'flex', justifyContent: 'flex-start' }}
                        >
                            {i18next.t('actions.clean')}
                        </Button>
                    </Box>
                )}
            </Box>
        </ThemeProvider>
    );
};

export default RjfsSignatureWidget;
