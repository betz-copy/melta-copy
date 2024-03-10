import { Home } from '@mui/icons-material';
import { Breadcrumbs, Button } from '@mui/material';
import React, { useMemo } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { useLocation } from 'wouter';
import { useDarkModeStore } from '../../../stores/darkMode';

export const Navigation: React.FC = () => {
    const [location, setLocation] = useLocation();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const iconColor = useMemo(() => (darkMode ? '#fff' : '#000'), [darkMode]);

    return (
        <ScrollContainer style={{ display: 'flex', borderRadius: '0.25rem', backgroundColor: darkMode ? '#252525' : 'lightgray' }}>
            <Breadcrumbs sx={{ '.MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}>
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
                            {segment}
                        </Button>
                    ))}
            </Breadcrumbs>
        </ScrollContainer>
    );
};
