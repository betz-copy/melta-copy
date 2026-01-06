import { Card, CardContent, Collapse, Grid } from '@mui/material';
import React, { useState } from 'react';
import { useDarkModeStore } from '../../../stores/darkMode';

export const ViewingCard: React.FC<{
    title: React.ReactNode;
    expendedCard?: React.ReactNode;
    onHover?: (isHover: boolean) => void;
    width?: number;
    cursor?: boolean;
    isDisabled?: boolean;
}> = ({ title, expendedCard, onHover, width, cursor, isDisabled = false }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const [open, setOpen] = useState<boolean>(false);

    return (
        <Grid>
            <Card
                onMouseEnter={() => (onHover ? onHover(true) : '')}
                onMouseLeave={() => (onHover ? onHover(false) : '')}
                sx={{
                    bgcolor: darkMode ? '#111111' : '#fff',
                    opacity: isDisabled ? 0.6 : 1,
                    ':hover': { transform: 'scale(1.01)' },
                    borderRadius: '10px',
                    boxShadow: '-2px 2px 6px 0px rgba(30, 39, 117, 0.30)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: cursor ? 'auto' : 'pointer',
                    height: 'fit-content',
                    width: width ? `${width}px` : '100%',
                }}
            >
                <CardContent
                    style={{ padding: '10px' }}
                    onClick={() => {
                        if (!isDisabled && expendedCard) setOpen(true);
                    }}
                >
                    {!open && title}
                </CardContent>

                <Collapse in={open} style={{ transformOrigin: '0 0 0' }} {...{ timeout: 500 }} mountOnEnter unmountOnExit>
                    <CardContent style={{ padding: '10px' }} onClick={() => setOpen(false)}>
                        {open && (
                            <Grid container direction="column">
                                <Grid>{title}</Grid>
                                {expendedCard && <Grid>{expendedCard}</Grid>}
                            </Grid>
                        )}
                    </CardContent>
                </Collapse>
            </Card>
        </Grid>
    );
};
