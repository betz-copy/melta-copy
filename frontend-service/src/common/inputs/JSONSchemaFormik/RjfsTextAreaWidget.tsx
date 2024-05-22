import React, { useEffect, useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Grid, InputLabel, ThemeProvider } from '@mui/material';
import MUIRichTextEditor, { TMUIRichTextEditorStyles } from 'mui-rte';
import { EditorState, convertToRaw, ContentState, convertFromHTML } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { createTheme } from '@mui/material/styles';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import { containsHTMLTags } from '../../../utils/HtmlTagsStringValue';

const RjfsTextAreaWidget = ({ id, value, label, readonly, onChange, options }: WidgetProps) => {
    const initialValue = () => {
        if (value) {
            // console.log({ value });

            const checkHasHTMLTags = containsHTMLTags(value);
            if (checkHasHTMLTags) {
                const contentBlock = convertFromHTML(value);
                const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
                return EditorState.createWithContent(contentState);
            }
            const contentState = ContentState.createFromText(value);
            return EditorState.createWithContent(contentState);
        }
        return EditorState.createEmpty();
    };

    const [editorValue, setEditorValue] = useState(initialValue());
    const [showLabel, setShowLabel] = useState(false);
    const [rawContentState, setRawContentState] = useState('');

    useEffect(() => {
        setRawContentState(JSON.stringify(convertToRaw(editorValue.getCurrentContent())));
    }, []);
    // const customStyleMap = {
    //     FORMAT_ALIGN_LEFT: { textAlign: 'left' },
    //     FORMAT_ALIGN_CENTER: { textAlign: 'center' },
    //     FORMAT_ALIGN_RIGHT: { textAlign: 'right' },
    //     FORMAT_ALIGN_JUSTIFY: { textAlign: 'justify' },
    // };
    const handleChange = (state: EditorState) => {
        setEditorValue(state);
        const newValue = state.getCurrentContent().getPlainText();
        const x = convertToRaw(state.getCurrentContent());
        const options1 = {
            inlineStyles: {
                // Override default element (`strong`).
                FORMATALIGNLEFT: { style: { dir: 'right' } },
                // formatAlignLeft,
                // ITALIC: {
                //     // Add custom attributes. You can also use React-style `className`.
                //     attributes: { class: 'foo' },
                //     // Use camel-case. Units (`px`) will be added where necessary.
                //     style: { fontSize: 12 },
                // },
                // // Use a custom inline style. Default element is `span`.
                // RED: { style: { color: '#900' } },
            },
        };
        const htmlContent = stateToHTML(state.getCurrentContent(), options1);
        console.log({ htmlContent });

        // const htmlContent = stateToHTML(state.getCurrentContent(), {
        // inlineStyles: customStyleMap,
        // });
        // const htmlContent = stateToHTML(state.getCurrentContent(), {
        //     inlineStyles: (styles) => {
        //         const styleObj = {};
        //         styles.toArray().forEach((style) => {
        //             if (customStyleMap[style]) {
        //                 Object.assign(styleObj, customStyleMap[style]);
        //             }
        //         });
        //         return { style: styleObj };
        //     },
        // });
        console.log({ x });

        onChange(newValue === '' ? options.emptyValue : htmlContent);
    };

    const handleFocus = () => {
        setShowLabel(true);
    };

    const handleBlur = () => {
        setShowLabel(false);
    };

    const theme = createTheme();
    const muiRteTheme: TMUIRichTextEditorStyles = {
        overrides: {
            MUIRichTextEditor: {
                root: {
                    borderRadius: readonly ? 0 : '10px',
                    border: readonly ? 'none' : (showLabel && '1px solid #1E2775') || '1px solid #CCCFE5',
                    borderBottom: readonly ? '1px solid gray' : (showLabel && '1px solid #1E2775') || '1px solid #CCCFE5',
                    transition: 'border-color 0.3s',
                },
                container: {
                    display: 'flex',
                    flexDirection: 'column-reverse',
                },
                editor: {
                    padding: '20px',
                    height: '150px',
                    maxHeight: '200px',
                    overflow: 'auto',
                },
                toolbar: {
                    borderTop: '1px solid gray',
                    borderRadius: '0px 0px 10px 10px',
                },
                placeHolder: {
                    paddingLeft: 20,
                    width: 'inherit',
                    color: '#9398C2',
                    padding: '8.5px 14px',
                    display: 'block',
                    transformOrigin: 'top-right',
                    whiteSpace: 'nowrap',
                    position: 'absolute',
                    right: 0,
                    top: 0,
                },
            },
        },
    };

    Object.assign(theme, muiRteTheme);

    return (
        <ThemeProvider theme={theme}>
            <Grid position="relative">
                {(showLabel || editorValue.getCurrentContent().getPlainText() !== '') && (
                    <InputLabel
                        style={{
                            position: 'absolute',
                            top: '0',
                            right: '0',
                            zIndex: 1,
                            background: '#fff',
                            padding: '0 8px',
                            transition: 'top 0.3s',
                            transform: 'translate(-14px,-9px) scale(0.75)',
                            transformOrigin: 'top-right',
                            color: showLabel ? '#1E2775' : '#9398C2',
                        }}
                        shrink={readonly || undefined}
                    >
                        {label}
                    </InputLabel>
                )}
                <MUIRichTextEditor
                    id={id}
                    readOnly={readonly}
                    label={label}
                    controls={[
                        'title',
                        'bold',
                        'italic',
                        'underline',
                        'strikethrough',
                        'numberList',
                        'bulletList',
                        'highlight',
                        'formatAlignLeft',
                        'formatAlignCenter',
                        'formatAlignRight',
                        'formatAlignJustify',

                    ]}
                    customControls={[
                        {
                            name: 'formatAlignLeft',
                            icon: <FormatAlignLeftIcon />,
                            type: 'inline',
                            inlineStyle: {
                                textAlign: 'left',
                            },
                        },
                        {
                            name: 'formatAlignCenter',
                            icon: <FormatAlignCenterIcon />,
                            type: 'inline',
                            inlineStyle: {
                                textAlign: 'center',
                            },
                        },
                        {
                            name: 'formatAlignRight',
                            icon: <FormatAlignRightIcon />,
                            type: 'inline',
                            inlineStyle: {
                                textAlign: 'right',
                            },
                        },
                        {
                            name: 'formatAlignJustify',
                            icon: <FormatAlignJustifyIcon />,
                            type: 'inline',
                            inlineStyle: {
                                textAlign: 'justify',
                            },
                        },
                    ]}
                    toolbar={!readonly}
                    onChange={handleChange}
                    defaultValue={rawContentState}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                />
            </Grid>
        </ThemeProvider>
    );
};

export default RjfsTextAreaWidget;
