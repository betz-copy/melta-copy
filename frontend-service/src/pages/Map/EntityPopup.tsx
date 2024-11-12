import React from 'react';
import { Popup } from 'react-leaflet';
import { Grid, Typography } from '@mui/material';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

interface MapPopupProps {
    properties: Record<string, any>;
    header: string;
    entityTemplate: IMongoEntityTemplatePopulated;
    darkMode?: boolean;
}

const EntityPopup = ({ header, properties, entityTemplate }: MapPopupProps) => {
    const fieldsToShow = entityTemplate.propertiesPreview;

    const filteredObject = Object.keys(properties)
        .filter((key) => fieldsToShow.includes(key))
        .reduce((acc, key) => ({ ...acc, [key]: properties[key] }), {});

    return (
        <Popup keepInView>
            <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography variant="h6" color="textPrimary" fontWeight="bold">
                    {header}
                </Typography>
            </Grid>

            <Grid container spacing={0}>
                {Object.keys(filteredObject).map((key) => (
                    <React.Fragment key={key}>
                        <Grid item xs={4}>
                            <Typography>{entityTemplate.properties.properties[key].title}:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography color="textSecondary">{filteredObject[key]}</Typography>
                        </Grid>
                    </React.Fragment>
                ))}
            </Grid>
        </Popup>
    );
};

export default EntityPopup;
