import { Close, InfoOutlined } from '@mui/icons-material';
import { Autocomplete, Button, Grid, TextField, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useQueryClient } from 'react-query';
import { useLocation } from 'wouter';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

interface DashboardItemDetailsProps {
    title: string;
}

const DashboardItemDetails: React.FC<DashboardItemDetailsProps> = ({ title }) => {
    const theme = useTheme();
    const [_, navigate] = useLocation();
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const [selectedTemplate, setSelectedTemplate] = useState<string | null>();

    return (
        <Grid container flexDirection="column" gap={4} paddingTop={1}>
            <Autocomplete
                popupIcon={<IoIosArrowDown fontSize="small" />}
                clearIcon={<Close fontSize="small" />}
                size="small"
                value={selectedTemplate}
                onChange={(_event, newValue) => setSelectedTemplate(newValue)}
                options={Array.from(entityTemplates.keys())}
                getOptionLabel={(option) => entityTemplates.get(option)?.displayName || ''}
                renderInput={(params) => <TextField {...params} variant="outlined" sx={{ borderRadius: '5px' }} label="ישות" />}
            />
            <TextField value={null} fullWidth onChange={(e) => console.log(e.target.value)} variant="outlined" type="text" label="שם תצוגה" />
            <Grid container direction="row" alignItems="center" wrap="nowrap" gap={1}>
                <InfoOutlined style={{ color: theme.palette.primary.main }} />
                <Typography fontWeight={400} fontSize={14} color=" #53566E">
                    טבלה זו והמידע המוצג בה יופיע לכלל המשתמשים בהתאם להרשאותיהם
                </Typography>
            </Grid>
            <Button
                variant="contained"
                onClick={() => navigate('/table')}
                disabled={!selectedTemplate}
                sx={{ borderRadius: '7px', width: '40%', alignSelf: 'flex-end', fontWeight: 400, fontSize: 14 }}
            >
                הוספה
            </Button>
        </Grid>
    );
};

export { DashboardItemDetails };
