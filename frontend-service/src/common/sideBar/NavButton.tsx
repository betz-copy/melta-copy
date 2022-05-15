import React, { cloneElement, isValidElement } from 'react';
import { ListItemButton } from '@mui/material';
import { StyledLink, StyledListItemText } from './NavBar.styled';

const NavButton: React.FC<{ to: string; isDrawerOpen: boolean; text: string }> = ({ to, isDrawerOpen, text, children }) => {
    return (
        <StyledLink to={to}>
            {({ isActive }) => (
                <ListItemButton style={{ justifyContent: 'space-around', direction: 'rtl' }}>
                    {isValidElement(children) &&
                        cloneElement(children, {
                            style: {
                                filter: isActive
                                    ? 'invert(100%) sepia(22%) saturate(353%) hue-rotate(311deg) brightness(122%) contrast(100%)'
                                    : 'invert(85%) sepia(8%) saturate(21%) hue-rotate(323deg) brightness(81%) contrast(80%)',
                            },
                        })}
                    {isDrawerOpen && (
                        <StyledListItemText
                            primary={text}
                            sx={{
                                color: isActive ? 'white' : '#A9A9A9',
                            }}
                        />
                    )}
                </ListItemButton>
            )}
        </StyledLink>
    );
};

export { NavButton };
