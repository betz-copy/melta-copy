/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import MUIRichTextEditor, { TMUIRichTextEditorStyles } from 'mui-rte';
import { ThemeProvider } from '@emotion/react';
import { createTheme, Grid } from '@mui/material';
import { convertToRaw } from 'draft-js';
import { getInitialValue } from './RjfsTextAreaWidget';

const RjsfCommentWidget = ({ id, options }: WidgetProps) => {
    const { comment } = options;
    console.log({ comment });

    const theme = createTheme();
    const muiRteTheme: TMUIRichTextEditorStyles = {
        overrides: {
            MUIRichTextEditor: {
                root: {
                    borderRadius: 0,
                    border: 'none',
                    borderBottom: '1px solid gray',
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
                <MUIRichTextEditor
                    id={id}
                    readOnly
                    defaultValue={JSON.stringify(convertToRaw(getInitialValue(comment).getCurrentContent()))}
                    toolbar={false}
                />
            </Grid>
        </ThemeProvider>
    );
};

export default RjsfCommentWidget;
