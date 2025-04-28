/* eslint-disable react/destructuring-assignment */
import { Grid } from '@mui/material';
import React from 'react';
import { IPureFieldsDisplayProps, PureFieldsDisplay } from './PureFieldsDisplay';
import { NavButton } from '../../../../common/NavButton';

export const FieldsDisplay: React.FC<IPureFieldsDisplayProps> = (props) => {
    if (props.expanded)
        return (
            <NavButton to={`/entity/${props.entity.properties._id}`}>
                <Grid container alignItems="center" direction="column">
                    <PureFieldsDisplay {...props} />
                </Grid>
            </NavButton>
        );

    return <PureFieldsDisplay {...props} />;
};
