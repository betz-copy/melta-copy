import { Home } from '@mui/icons-material';
import { Breadcrumbs, Button, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { useLocation } from 'wouter';
import { useDarkModeStore } from '../../../stores/darkMode';

export const Navigation: React.FC = () => {
    const [location, setLocation] = useLocation();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const iconColor = useMemo(() => (darkMode ? '#000' : '#fff'), [darkMode]);

    return (
        <ScrollContainer style={{ display: 'flex', borderRadius: '0.25rem', backgroundColor: darkMode ? '#252525' : '#101440' }}>
            <Breadcrumbs sx={{ '.MuiBreadcrumbs-ol': { flexWrap: 'nowrap' }, '.MuiBreadcrumbs-separator': { color: 'white' } }}>
                <Button onClick={() => setLocation('/')} sx={{ color: iconColor }}>
                    <Home />
                </Button>

                {location
                    .split('/')
                    .filter(Boolean)
                    .map((segment, index) => (
                        <Button
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            sx={{ color: iconColor }}
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
