import React from 'react';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { BlueTitle } from './BlueTitle';
import { RootState } from '../store';

const TopBar: React.FC<{ title: string }> = ({ title }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    if (title.length) {
        return (
            <Box
                bgcolor={darkMode ? '#131313' : '#fcfeff'}
                boxShadow="0px 4px 4px #0000000D"
                height="3.6rem"
                paddingTop="0.5rem"
                paddingLeft="2.5rem"
                paddingBottom="0.4rem"
                marginBottom="1rem"
                position="sticky"
                style={{ top: 0, right: 0, zIndex: 1 }}
            >
                <BlueTitle title={title} component="h4" variant="h4" />
            </Box>
        );
    }

    return null;
};
export { TopBar };
