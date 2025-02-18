// eslint-disable-next-line import/no-extraneous-dependencies
import SignatureCanvas from 'react-signature-canvas';
import React, { useEffect, useRef } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Button, createTheme, Grid, ThemeProvider } from '@mui/material';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getFilePreviewRequest } from '../../../services/previewService';

const RjfsSignatureWidget = ({
    id,
    required,
    readonly,
    disabled,
    label,
    value,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    uiSchema,
    rawErrors = [],
    formContext,
    registry,
    color,
}: // ...textFieldProps
WidgetProps) => {
    const sigCanvas = useRef<SignatureCanvas | null>(null);

    // useEffect(() => {
    //     if (value && sigCanvas.current) {
    //         console.log('############', value);

    //         sigCanvas.current.fromDataURL(value);
    //     }
    // }, [value]);

    useEffect(() => {
        if (sigCanvas.current) {
            if (readonly || disabled) {
                sigCanvas.current.off();
            } else {
                sigCanvas.current.on();
            }
        }
    }, [readonly, disabled]);

    useEffect(() => {
        const fetchData = async () => {
            if (value && sigCanvas.current) {
                const currentSignature = await getFilePreviewRequest(value, 'contentType');
                sigCanvas.current?.fromDataURL(currentSignature);
            }
        };
        fetchData();
    }, [value]);

    const saveSignature = () => {
        if (!sigCanvas.current) return;
        const newSignature = sigCanvas.current.toDataURL();
        console.log({ newSignature });
        onChange(newSignature);
    };

    const clearSignature = () => {
        if (!sigCanvas.current) return;
        sigCanvas.current.clear();
    };

    // const darkMode = useDarkModeStore((state) => state.darkMode);

    const theme = createTheme();
    return (
        <ThemeProvider theme={theme}>
            <Grid position="relative">
                <Grid>{label}</Grid>
                <Grid sx={{ border: 'black 1px solid', width: 210 }}>
                    <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ width: 205, height: 100 }} />
                </Grid>
                <Button onClick={saveSignature}>שמור</Button>
                <Button onClick={clearSignature}>נקה</Button>
            </Grid>
        </ThemeProvider>
    );
};

export default RjfsSignatureWidget;
