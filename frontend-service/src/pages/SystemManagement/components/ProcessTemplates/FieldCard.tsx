import React from 'react';
import { Grid, Typography } from '@mui/material';
import { ViewingCard } from '../Card';
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
    return (
        <Grid item key={keyPath}>
            <ViewingCard
                width={400}
                cursor="auto"
                title={
                    <Grid direction="column" container gap="10px">
                        <Grid item container direction="row" justifyContent="space-between" alignItems="center" paddingLeft="20px" flexWrap="nowrap">
                            <Grid item>
                                <Typography
                                    sx={{
                                        fontSize: '14px',
                                        fontWeight: '400',
                                        color: 'rgb(30, 39, 117)',
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
