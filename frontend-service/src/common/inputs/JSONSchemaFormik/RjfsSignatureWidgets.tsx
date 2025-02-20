// eslint-disable-next-line import/no-extraneous-dependencies
import SignatureCanvas from 'react-signature-canvas';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Box, Button, createTheme, Grid, ThemeProvider, Typography } from '@mui/material';
import i18next from 'i18next';
// import ReactSignatureCanvas from 'react-signature-canvas';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getFilePreviewRequest } from '../../../services/previewService';
import { darkTheme, lightTheme } from '../../../theme';

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
    setFieldError,
    options
}: WidgetProps) => {
    const {touched} = options;
    
    const signatureCanvas = useRef<SignatureCanvas | null>(null);
    const [updatedSignature, setUpdatedSignature] = useState('');
    const [isDraw, setIsDraw] = useState(false);
    const[ signatureUpdated, setSignatureUpdated] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (value && signatureCanvas.current) {
                try {
                    const current = await getFilePreviewRequest(value, 'contentType');
                    signatureCanvas.current?.fromDataURL(current);
                } catch (error) {
                    console.error('Error loading signature preview:', error);
                }
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (signatureCanvas.current) {
            if (readonly || disabled) {
                signatureCanvas.current.off();
            } else {
                signatureCanvas.current.on();
            }
        }
    }, [readonly, disabled]);

    // document.addEventListener('click', (event) => {
    //     if (signatureCanvas.current?.getCanvas() && signatureCanvas.current?.getCanvas() !== event.target && isDraw) {
    //         console.log('inside!');
    //         onChange(updatedSignature);
    //     }
    // });

    const saveSignature = useCallback(() => {
        if (!signatureCanvas.current) return;
        if (signatureCanvas.current.isEmpty()) onChange(undefined);
        else {
            // setUpdatedSignature(signatureCanvas.current.toDataURL());
        onChange(signatureCanvas.current.toDataURL());
        // signatureCanvas.current.clear();
    }
    setSignatureUpdated(false)
      }, []);
    
    // () => {
    //     if (!signatureCanvas.current) return;
    //     if (signatureCanvas.current.isEmpty()) onChange(undefined);
    //     else {
    //         // setUpdatedSignature(signatureCanvas.current.toDataURL());
    //     onChange(signatureCanvas.current.toDataURL());
    //     // signatureCanvas.current.clear();
    // }
    // setSignatureUpdated(false)
    // };

    const clearSignature = () => {
        if (!signatureCanvas.current) return;
        signatureCanvas.current.clear();
        onChange(undefined);
    };

    if (required && (!signatureCanvas.current || signatureCanvas.current.isEmpty())) onBlur(id, value);
    // const theme = createTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const isDisabled = readonly || disabled;
    
    return (
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <Box display="flex" flexDirection="column" className="signature">
                <Box sx={{ position: 'relative', width: 210 }}>
                    <Typography
                        sx={{
                            // position: 'absolute',
                            // top: '-10px',
                            // left: '12px',
                            marginBottom: '8px',
                            fontSize: '13px',
                            color: darkMode ? 'white' : 'black',
                            // backgroundColor: darkMode ? '#333' : '#fff',
                            padding: '0 5px',
                            userSelect: 'none',
                        }}
                    >
                        {label}
                    </Typography>
                    <SignatureCanvas
                        ref={signatureCanvas}
                        penColor="black"
                        canvasProps={{
                            width: 205,
                            height: '100%',
                            style: {
                                border: `1px solid ${darkMode ? 'white' : 'black'}`,
                                borderRadius: '8px',
                                // eslint-disable-next-line no-nested-ternary
                                backgroundColor: darkMode ? '#3353' : !isDisabled ? '#fff' : undefined,
                                boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
                            },
                        }}
                        onEnd={saveSignature}
                        // onBegin={() => {
                        //     setSignatureUpdated(true)
                        //     // setIsDraw(true);
                        //     // onBlur(id, value);
                        // }}
                        clearOnResize={false}
                        
                    />
                </Box>
                {!isDisabled && (
                    <Box display="flex" >
                        {signatureUpdated &&
                        <Button color="primary" onClick={saveSignature}>
                            {i18next.t('actions.save')}
                        </Button>
}
                        <Button color="primary" onClick={clearSignature}>
                            {i18next.t('actions.clean')}
                        </Button>
                    </Box>
                )}
            </Box>
        </ThemeProvider>
    );


};

export default RjfsSignatureWidget;
