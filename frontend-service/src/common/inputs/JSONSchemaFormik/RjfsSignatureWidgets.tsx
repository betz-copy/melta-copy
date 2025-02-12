// eslint-disable-next-line import/no-extraneous-dependencies
import SignatureCanvas from 'react-signature-canvas';
import React, { useEffect, useRef } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Button, createTheme, Grid, ThemeProvider } from '@mui/material';
import { useDarkModeStore } from '../../../stores/darkMode';

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
    console.log('hello', { value });

    const sigCanvas = useRef<SignatureCanvas | null>(null);
    // const [signature, setSignature] = useState<string | null>(
    //     // 'data:image/png;base64,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');
    //     value || '',
    // );

    useEffect(() => {
        // if (signature && sigCanvas.current) {
        //     console.log({ value });

        //     const r = sigCanvas.current.fromDataURL(signature);
        //     console.log({ r, signature, c: sigCanvas.current });
        // }
        if (value && sigCanvas.current) sigCanvas.current.fromDataURL(value);
    }, [value]);

    useEffect(() => {
        if (sigCanvas.current) {
            if (readonly || disabled) {
                sigCanvas.current.off();
            } else {
                sigCanvas.current.on();
            }
        }
    }, [readonly, disabled]);

    const saveSignature = () => {
        if (!sigCanvas.current) return;
        const newSignature = sigCanvas.current.toDataURL();
        console.log({ newSignature });
        onChange(newSignature);
        // setSignature(newSignature);
    };

    const clearSignature = () => {
        if (!sigCanvas.current) return;
        sigCanvas.current.clear();
        // setSignature('');
        // Update Neo4j with an empty string
    };

    const darkMode = useDarkModeStore((state) => state.darkMode);
    // const globalTheme = useTheme();
    console.log('mayannnnnnnnnnnnnnnnnn');

    const theme = createTheme();
    return (
        <ThemeProvider theme={theme}>
            <Grid position="relative">
                <Grid>{label}</Grid>
                <Grid sx={{ border: 'black 1px solid', width: 370 }}>
                    <SignatureCanvas ref={sigCanvas} canvasProps={{ width: 365, height: 150 }} />
                </Grid>
                <Button onClick={saveSignature}>שמור</Button>
                <Button onClick={clearSignature}>נקה</Button>
            </Grid>
        </ThemeProvider>
    );
};

export default RjfsSignatureWidget;
