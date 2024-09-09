import { Button } from '@mui/material';
import React, { ReactNode } from 'react';
import { Link } from 'wouter';

interface NavButtonProps {
    to: string;
    children: ReactNode;
}

export const NavButton: React.FC<NavButtonProps> = ({ to, children }) => {
    return (
        <Link href={to} style={{ textDecoration: 'none' }}>
            <Button sx={{ ':hover': { backdropFilter: 'brightness(1.15)', bgcolor: 'transparent' } }}>{children}</Button>
        </Link>
    );
};
