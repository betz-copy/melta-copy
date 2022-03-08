import React, { useEffect, SetStateAction, Dispatch } from 'react';
import { Grid, Typography } from '@mui/material';
import { EntityCheckBox } from './CheckBox';

const Header: React.FC<{
    category: string;
    templatesNames: string[];
    setTemplatesToDisplay: Dispatch<SetStateAction<string[]>>;
    templateToDisplay: string[];
}> = ({ templateToDisplay, category, templatesNames, setTemplatesToDisplay }) => {
    useEffect(() => {
        setTemplatesToDisplay(templatesNames);
    }, [setTemplatesToDisplay]);

    return (
        <Grid item container justifyContent="space-evenly" style={{ height: '8vh', borderBottom: '1px solid #00000027' }}>
            <Grid item>
                <Typography
                    style={{
                        color: '#1976d2',
                        fontWeight: '800',
                    }}
                    variant="h2"
                    component="h2"
                >
                    {category}
                </Typography>
            </Grid>
            <Grid item>
                <EntityCheckBox templateToDisplay={templateToDisplay} templatesNames={templatesNames} setTemplatesToDisplay={setTemplatesToDisplay} />
            </Grid>
        </Grid>
    );
};

export { Header };
