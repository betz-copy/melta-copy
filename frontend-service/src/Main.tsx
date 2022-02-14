import React, { useEffect } from 'react';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { useDispatch } from 'react-redux';
import { useQuery } from 'react-query';
import { Header } from './common/Header';
import { SideBar } from './common/SideBar';
import { Home } from './pages/Home';
import { MainBox } from './Main.styled';
import { Unavailable } from './pages/Unavailable/Unavailable';
import { SystemManagement } from './pages/SystemManagement';
import { setCategories, setEntityTemplates } from './store/globalState';
import { Category } from './pages/Category';
import { getEntityTemplatesRequest } from './services/enitityTemplatesService';
import { getCategoriesRequest } from './services/categoriesService';

const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

const Main = () => {
    const { data: entityTemplates } = useQuery('getEntityTemplates', getEntityTemplatesRequest);
    const { data: categories } = useQuery('getCategories', getCategoriesRequest);

    const dispatch = useDispatch();

    useEffect(() => {
        if (categories) {
            dispatch(setCategories(categories));
        }
    }, [categories, dispatch]);

    useEffect(() => {
        if (entityTemplates) {
            dispatch(setEntityTemplates(entityTemplates));
        }
    }, [entityTemplates, dispatch]);

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
                                <Route path="/system-management" element={<SystemManagement />} />
                                <Route path="/unavailable" element={<Unavailable />} />
                                <Route path="/category" element={<Category />} />
                                <Route path="/" element={<Home />} />
                                <Route path="/graph/:instanceId" element={<Home />} />
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
