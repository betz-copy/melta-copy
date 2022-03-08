import React, { cloneElement, isValidElement } from 'react';
import { ListItemButton } from '@mui/material';
import { StyledLink, StyledListItemText } from './NavBar.styled';

const NavButton: React.FC<{ to: string; isDrawerOpen: boolean; text: string }> = ({ to, isDrawerOpen, text, children }) => {
    return (
        <StyledLink to={to}>
            {({ isActive }) => (
                <ListItemButton style={{ justifyContent: 'space-around' }}>
                    {isValidElement(children) && cloneElement(children, { sx: { color: isActive ? '#225AA7' : '#A9A9A9' } })}
                    {isDrawerOpen && <StyledListItemText primary={text} sx={{ color: isActive ? '#225AA7' : '#A9A9A9' }} />}
                </ListItemButton>
            )}
        </StyledLink>
    );
};

export { NavButton };
