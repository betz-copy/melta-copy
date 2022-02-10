import React, { useEffect } from 'react';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Header } from './common/Header';
import { SideBar } from './common/SideBar';
import { Home } from './pages/Home';
import { MainBox } from './Main.styled';
import { Unavailable } from './pages/Unavailable/Unavailable';
import { SystemManagement } from './pages/SystemManagement';
import { setCategories, setEntityTemplates } from './store/globalState';
import { useAxios } from './axios';
import { IMongoCategory, IMongoEntityTemplatePopulated } from './interfaces';
import { environment } from './globals';
import { Category } from './pages/Category';

const Main = () => {
    const [{ loading: _categoriesLoading, error: _categoriesError, data: categories }] = useAxios<IMongoCategory[]>(environment.api.categories);
    const [{ loading: _entityTemplatesLoading, error: _entityTemplatesError, data: entityTemplates }] = useAxios<IMongoEntityTemplatePopulated[]>(
        environment.api.entityTemplates,
    );

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
    );
};
export default Main;
