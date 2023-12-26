import { Button } from '@mui/material';
import React, { ReactNode } from 'react';
import { NavLink, To } from 'react-router-dom';

interface NavButtonProps {
    to: To;
    children: ReactNode;
}

export const NavButton: React.FC<NavButtonProps> = ({ to, children }) => {
    return (
        <NavLink to={to} style={{ textDecoration: 'none' }}>
            <Button sx={{ ':hover': { backdropFilter: 'brightness(1.15)', bgcolor: 'transparent' } }}>{children}</Button>
        </NavLink>
    );
};
