import { Grid, Typography } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';
import React from 'react';
import { renderHTML } from '../../../utils/HtmlTagsStringValue';

const RjsfCommentWidget = ({ options, schema }: WidgetProps) => {
    const { comment, color } = schema;
    const { hide } = options;

    return (
        <Grid>
            {!hide && (
                <Typography color={(color as string) ?? '#4752B6'} fontSize="14px">
                    {renderHTML(comment as string)}
                </Typography>
            )}
        </Grid>
    );
};

export default RjsfCommentWidget;
