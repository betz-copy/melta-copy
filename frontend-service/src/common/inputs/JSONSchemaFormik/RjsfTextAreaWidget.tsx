import { Grid, InputLabel, ThemeProvider, useTheme } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { WidgetProps } from '@rjsf/utils';
import { ContentState, convertFromHTML, convertToRaw, EditorState } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import MUIRichTextEditor, { TMUIRichTextEditorStyles } from 'mui-rte';
import React, { useEffect, useState } from 'react';
import { useDarkModeStore } from '../../../stores/darkMode';
import { containsHTMLTags } from '../../../utils/HtmlTagsStringValue';

const RjsfTextAreaWidget = ({ id, value, label, readonly, onChange, options }: WidgetProps) => {
    const { toPrint } = options;

    const initialValue = () => {
        if (value) {
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

    const handleChange = (state: EditorState) => {
        setEditorValue(state);
        const newValue = state.getCurrentContent().getPlainText();
        const htmlContent = stateToHTML(state.getCurrentContent());
        onChange(newValue === '' ? options.emptyValue : htmlContent);
    };

    const handleFocus = () => {
        setShowLabel(true);
    };

    const handleBlur = () => {
        setShowLabel(false);
    };

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const globalTheme = useTheme();

    const theme = createTheme();
    const muiRteTheme: TMUIRichTextEditorStyles = {
        overrides: {
            MUIRichTextEditor: {
                root: {
                    borderRadius: readonly ? 0 : '10px',
                    border: readonly ? 'none' : (showLabel && `1px solid ${globalTheme.palette.primary.main}`) || '1px solid #CCCFE5',
                    borderBottom: readonly ? '1px solid gray' : (showLabel && `1px solid ${globalTheme.palette.primary.main}`) || '1px solid #CCCFE5',
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

    if (toPrint) return null;

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
                            background: darkMode ? '#383838' : '#fff',
                            padding: '0 8px',
                            transition: 'top 0.3s',
                            transform: 'translate(-14px,-9px) scale(0.75)',
                            transformOrigin: 'top-right',
                            color: showLabel ? globalTheme.palette.primary.main : '#9398C2',
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
                    controls={['title', 'bold', 'italic', 'underline', 'strikethrough', 'numberList', 'bulletList']}
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

export default RjsfTextAreaWidget;
