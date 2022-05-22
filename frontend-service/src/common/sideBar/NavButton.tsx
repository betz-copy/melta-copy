import React from 'react';
import { ListItemButton, Tooltip } from '@mui/material';
import i18next from 'i18next';
import { StyledLink, StyledListItemText } from './NavBar.styled';

const NavButton: React.FC<{ to: string; isDrawerOpen: boolean; text: string; disabled?: boolean }> = ({
    to,
    isDrawerOpen,
    text,
    children,
    disabled = false,
}) => {
    return (
        <StyledLink
            to={to}
            onClick={(e) => {
                if (disabled) e.preventDefault();
            }}
        >
            {({ isActive }) => (
                <Tooltip title={disabled ? (i18next.t('permissions.dontHavePermissionsToCategory') as string) : text} followCursor>
                    <span>
                        <ListItemButton
                            disabled={disabled}
                            style={{
                                justifyContent: 'space-around',
                                direction: 'rtl',
                                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.17)' : 'transparent',
                            }}
                        >
                            {children}
                            {isDrawerOpen && <StyledListItemText primary={text} sx={{ color: 'white' }} />}
                        </ListItemButton>
                    </span>
                </Tooltip>
            )}
        </StyledLink>
    );
};

export { NavButton };
