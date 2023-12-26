import React from 'react';
import { ListItemButton, Tooltip, tooltipClasses } from '@mui/material';
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
                <Tooltip
                    title={disabled ? (i18next.t('permissions.dontHavePermissionsToCategory') as string) : text}
                    arrow
                    placement="left"
                    disableHoverListener={!disabled && isDrawerOpen} // when drawer is opened text is already shown, so no need for tooltip
                    PopperProps={{
                        sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem' } },
                    }}
                >
                    <div>
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
                    </div>
                </Tooltip>
            )}
        </StyledLink>
    );
};

export { NavButton };
