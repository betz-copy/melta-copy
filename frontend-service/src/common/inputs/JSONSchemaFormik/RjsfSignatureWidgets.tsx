/* eslint-disable react-hooks/exhaustive-deps */
// eslint-disable-next-line import/no-extraneous-dependencies

import { Box, Button, ThemeProvider, Typography, useTheme } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';
import i18next from 'i18next';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { environment } from '../../../globals';
import { getFilePreviewRequest } from '../../../services/previewService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { darkTheme, lightTheme } from '../../../theme';

const { signaturePrefix } = environment;

const RjsfSignatureWidgets = ({ id, required, readonly, disabled, label, value, onChange, onBlur }: WidgetProps) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const isDisabled = readonly || disabled;
    const globalTheme = useTheme();
    const signatureCanvas = useRef<SignatureCanvas | null>(null);
    const valueIsSignatureImg = typeof value === 'string' && value.startsWith(signaturePrefix);
    const [isDrawing, setIsDrawing] = useState(valueIsSignatureImg ?? false);

    useEffect(() => {
        const fetchSignature = async () => {
            if (value && signatureCanvas.current && !isDrawing) {
                try {
                    const current = await getFilePreviewRequest(value, 'contentType');
                    signatureCanvas.current?.fromDataURL(current);
                } catch (error) {
                    console.error('Error loading signature preview:', error);
                }
            } else if (value) {
                signatureCanvas.current?.fromDataURL(value);
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
            <Box display="flex" flexDirection="column">
                <Box sx={{ position: 'relative' }}>
                    <Typography
                        sx={{
                            fontSize: '14px',
                            color: '#9398C2',
                            padding: '0 5px',
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
                            height: '100%',
                            style: {
                                // eslint-disable-next-line no-nested-ternary
                                backgroundColor: darkMode ? '#666666' : !isDisabled ? '#fff' : undefined,
                                border:
                                    !signatureCanvas.current || signatureCanvas.current.isEmpty()
                                        ? '1px solid rgb(154, 159, 202)'
                                        : `1.5px solid ${darkMode ? 'white' : `${globalTheme.palette.primary.main}`}`,
                                borderRadius: '8px',
                                boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.1)',
                            },
                        }}
                        onBegin={() => setIsDrawing(true)}
                        onEnd={saveSignature}
                        clearOnResize={false}
                    />
                </Box>
                {!isDisabled && (
                    <Button
                        color="primary"
                        onClick={clearSignature}
                        sx={{
                            display: 'inline-block',
                            fontSize: '12px',
                            padding: 0,
                            minWidth: 0,
                            minHeight: 0,
                            width: '35px',
                        }}
                    >
                        {i18next.t('actions.clean')}
                    </Button>
                )}
            </Box>
        </ThemeProvider>
    );
};

export default RjsfSignatureWidgets;
