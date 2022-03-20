import React, { cloneElement, isValidElement } from 'react';
import { ListItemButton } from '@mui/material';
import { StyledLink, StyledListItemText } from './NavBar.styled';

const NavButton: React.FC<{ to: string; isDrawerOpen: boolean; text: string }> = ({ to, isDrawerOpen, text, children }) => {
    return (
        <StyledLink to={to}>
            {({ isActive }) => (
                <ListItemButton style={{ justifyContent: 'space-around' }}>
                    {isValidElement(children) &&
                        cloneElement(children, {
                            style: {
                                filter: isActive
                                    ? 'invert(30%) sepia(35%) saturate(1584%) hue-rotate(181deg) brightness(98%) contrast(97%)'
                                    : 'invert(77%) sepia(0%) saturate(1%) hue-rotate(179deg) brightness(88%) contrast(89%)',
                            },
                        })}
                    {isDrawerOpen && (
                        <StyledListItemText
                            primary={text}
                            sx={{
                                color: isActive ? '#225AA7' : '#A9A9A9',
                            }}
                        />
                    )}
                </ListItemButton>
            )}
        </StyledLink>
    );
};

export { NavButton };
