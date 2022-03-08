import React from 'react';
import { Grid, Typography, Button } from '@mui/material';
import { EntityCheckBox } from './CheckBox';
import { SearchBox } from './SearchBox';
import { DateFiltering } from './DateFiltering';

const SideBar: React.FC<{
    categoryId: string;
    templatesNames: string[];
    setTemplatesToDisplay: React.Dispatch<React.SetStateAction<string[]>>;
    templateToDisplay: string[];
}> = ({ templateToDisplay, templatesNames, setTemplatesToDisplay }) => {
    return (
        <Grid item container style={{ height: '8vh', borderBottom: '1px solid #00000027' }}>
            <Grid item xs={2}>
                <Typography
                    style={{
                        marginRight: '20%',
                        color: '#1976d2',
                        width: '100%',
                        fontWeight: '800',
                    }}
                    variant="h2"
                    component="h2"
                />
            </Grid>
            <Grid item xs={2.3}>
                <EntityCheckBox templateToDisplay={templateToDisplay} templatesNames={templatesNames} setTemplatesToDisplay={setTemplatesToDisplay} />
            </Grid>
            <Grid item xs={2.3}>
                <DateFiltering />
            </Grid>
            <Grid item xs={1}>
                <Button variant="contained" style={{ borderRadius: '20px', marginRight: '10px', marginTop: '22px', width: '80%', fontWeight: '500' }}>
                    חיפוש
                </Button>
            </Grid>
            <Grid item xs={1.4} />
            <Grid item xs={3}>
                <SearchBox />
            </Grid>
        </Grid>
    );
};

export { SideBar };
