// eslint-disable-next-line import/no-extraneous-dependencies
import SignatureCanvas from 'react-signature-canvas';
import React, { useEffect, useRef } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Button, createTheme, Grid, ThemeProvider } from '@mui/material';
import i18next from 'i18next';
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
}: // ...textFieldProps
WidgetProps) => {
    const signatureCanvas = useRef<SignatureCanvas | null>(null);
    // const isDisabled = signatureCanvas.current.isEmpty();
    console.log({ registry }, signatureCanvas.current);

    useEffect(() => {
        if (signatureCanvas.current) {
            if (readonly || disabled) {
                signatureCanvas.current.off();
            } else {
                signatureCanvas.current.on();
            }
        }
    }, [readonly, disabled]);

    useEffect(() => {
        const fetchData = async () => {
            if (value && signatureCanvas.current) {
                const currentSignature = await getFilePreviewRequest(value, 'contentType');
                signatureCanvas.current?.fromDataURL(currentSignature);
            }
        };
        fetchData();
    }, [value]);

    const saveSignature = () => {
        if (!signatureCanvas.current) return;
        if (signatureCanvas.current.isEmpty()) onChange(undefined);
        else onChange(signatureCanvas.current.toDataURL());
    };

    const clearSignature = () => {
        if (!signatureCanvas.current) return;
        signatureCanvas.current.clear();
        onChange(undefined);
    };

    // const darkMode = useDarkModeStore((state) => state.darkMode);

    const theme = createTheme();
    return (
        <ThemeProvider theme={theme}>
            <Grid position="relative">
                <Grid>{label}</Grid>
                <Grid sx={{ border: 'black 1px solid', width: 210 }}>
                    <SignatureCanvas ref={signatureCanvas} penColor="black" canvasProps={{ width: 205, height: 100 }} />
                </Grid>
                <Button onClick={saveSignature}>{i18next.t('actions.save')}</Button>
                <Button onClick={clearSignature}>{i18next.t('actions.clean')}</Button>
            </Grid>
        </ThemeProvider>
    );
};

export default RjfsSignatureWidget;
