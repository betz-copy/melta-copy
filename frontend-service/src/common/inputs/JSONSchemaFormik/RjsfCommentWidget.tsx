import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { renderHTML } from '../../../utils/HtmlTagsStringValue';

export const commentColors = {
    [i18next.t('validation.colors.blue')]: '#4752B6',
    [i18next.t('validation.colors.red')]: '#ff0f0f',
    [i18next.t('validation.colors.orange')]: '#FF5733 ',
    [i18next.t('validation.colors.yellow')]: '#ffcc00',
    [i18next.t('validation.colors.green')]: '#008000',
    [i18next.t('validation.colors.black')]: '#000000',
};

const RjsfCommentWidget = ({ options }: WidgetProps) => {
    const { comment, color, hide } = options;

    if (hide) return <div />;
    return (
        <Grid>
            <Typography color={commentColors[color as string] ?? '#4752B6'} fontSize="14px">
                {renderHTML(comment as string)}
            </Typography>
        </Grid>
    );
};

export default RjsfCommentWidget;
