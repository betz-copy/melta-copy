import { Grid, Typography, useTheme } from '@mui/material';
import React from 'react';
import { ViewingCard } from './Card';
import FieldButtons from './FieldButtons';

interface FieldCardProps {
    keyPath: string;
    title: string;
    input: React.ReactNode;
    handleUpdate: () => void;
    isModified: boolean;
    handleReset: () => void;
    isValueDifferentFromDefault: boolean;
}

const FieldCard: React.FC<FieldCardProps> = ({ keyPath, title, input, handleUpdate, isModified, handleReset, isValueDifferentFromDefault }) => {
    const theme = useTheme();
    return (
        <Grid key={keyPath}>
            <ViewingCard
                width={400}
                cursor
                title={
                    <Grid direction="column" container gap="10px">
                        <Grid container direction="row" justifyContent="space-between" alignItems="center" paddingLeft="20px" flexWrap="nowrap">
                            <Grid>
                                <Typography
                                    sx={{
                                        fontSize: '14px',
                                        fontWeight: '400',
                                        color: theme.palette.primary.main,
                                    }}
                                >
                                    {title}
                                </Typography>
                                {input}
                            </Grid>
                        </Grid>
                        <FieldButtons
                            handleUpdate={handleUpdate}
                            isModified={isModified}
                            handleReset={handleReset}
                            isValueDifferentFromDefault={isValueDifferentFromDefault}
                        />
                    </Grid>
                }
            />
        </Grid>
    );
};

export default FieldCard;
