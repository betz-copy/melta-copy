import { Button, Grid } from '@mui/material';
import React from 'react';
import { IPureFieldsDisplayProps, PureFieldsDisplay } from './PureFieldsDisplay';
import { NavLink } from 'react-router-dom';

export const FieldsDisplay: React.FC<IPureFieldsDisplayProps> = (props) => {
    if (props.expanded) return (
        <NavLink to={`/entity/${props.entity.properties._id}`}>
            <Button sx={{ ':hover': { backdropFilter: 'brightness(1.1)' } }}>
                <Grid container alignItems="center" direction="column">
                    <PureFieldsDisplay {...props} />
                </Grid>
            </Button >
        </NavLink>
    )

    return <PureFieldsDisplay {...props} />;
};
