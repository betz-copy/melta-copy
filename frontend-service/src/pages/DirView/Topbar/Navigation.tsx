import { Home } from '@mui/icons-material';
import { Breadcrumbs, Button, Typography } from '@mui/material';
import React from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { useLocation } from 'wouter';
import { useDarkModeStore } from '../../../stores/darkMode';

export const Navigation: React.FC = () => {
    const [location, setLocation] = useLocation();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <ScrollContainer style={{ display: 'flex', borderRadius: '0.25rem', backgroundColor: darkMode ? '#252525' : '#101440' }}>
            <Breadcrumbs sx={{ '.MuiBreadcrumbs-ol': { flexWrap: 'nowrap' }, '.MuiBreadcrumbs-separator': { color: 'white' } }}>
                <Button onClick={() => setLocation('/')} sx={{ color: '#fff' }}>
                    <Home />
                </Button>

                {location
                    .split('/')
                    .filter(Boolean)
                    .map((segment, index) => (
                        <Button
                            key={index}
                            sx={{ color: '#fff' }}
                            onClick={() =>
                                setLocation(
                                    location
                                        .split('/')
                                        .slice(0, index + 2)
                                        .join('/'),
                                )
                            }
                        >
                            <Typography>{segment}</Typography>
                        </Button>
                    ))}
            </Breadcrumbs>
        </ScrollContainer>
    );
};
