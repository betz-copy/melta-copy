import * as React from 'react';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { Header } from './common/Header';
import { SideBar } from './common/SideBar';
import { Info } from './pages/Info';
import { Home } from './pages/Home';
import { Page } from './pages/Page';
import { MainBox } from './Main.styled';
import { Unavailable } from './pages/Unavailable/Unavailable';

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [rtlPlugin],
});

const Main = () => {
    const [open, setOpen] = React.useState(false);
    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <CacheProvider value={cacheRtl}>
            <Router>
                <Box display="flex">
                    <CssBaseline />
                    <Header toggleDrawer={toggleDrawer} isDrawerOpen={open} />
                    <SideBar toggleDrawer={toggleDrawer} isDrawerOpen={open} />
                    <MainBox>
                        <Toolbar />
                        <Box margin={4}>
                            <Routes>
                                <Route path="/info" element={<Info />} />
                                <Route path="/page" element={<Page />} />
                                <Route path="/unavailable" element={<Unavailable />} />
                                <Route path="/" element={<Home />} />
                                <Route path="*" element={<Home />} />
                            </Routes>
                        </Box>
                    </MainBox>
                </Box>
            </Router>
        </CacheProvider>
    );
};
export default Main;
