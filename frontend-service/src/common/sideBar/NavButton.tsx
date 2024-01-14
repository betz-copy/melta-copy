import React from 'react';
import { ListItemButton, Tooltip, tooltipClasses } from '@mui/material';
import i18next from 'i18next';
import { StyledLink, StyledListItemText } from './NavBar.styled';
import './NavButton.css';

const NavButton: React.FC<{ to: string; isDrawerOpen: boolean; text: string; disabled?: boolean; onChangeToActive: (boolean) => void }> = ({
    to,
    isDrawerOpen,
    text,
    children,
    disabled = false,
    onChangeToActive,
}) => {
    return (
        <StyledLink
            to={to}
            onClick={(e) => {
                if (disabled) e.preventDefault();
            }}
            className="nav-button"
        >
            {({ isActive }) => {
                onChangeToActive(isActive);
                return (
                    <Tooltip
                        title={disabled ? (i18next.t('permissions.dontHavePermissionsToCategory') as string) : text}
                        placement="left"
                        disableHoverListener={!disabled && isDrawerOpen} // when drawer is opened text is already shown, so no need for tooltip
                        PopperProps={{
                            sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem', backgroundColor: '#101440' } },
                        }}
                    >
                        <div>
                            <ListItemButton
                                disabled={disabled}
                                sx={{
                                    color: 'black',
                                }}
                                style={{
                                    justifyContent: 'space-around',
                                    direction: 'rtl',
                                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.80)' : 'transparent',
                                    borderRadius: '20px',
                                    height: '32px',
                                }}
                                className="child"
                            >
                                {children}
                                {isDrawerOpen && (
                                    <StyledListItemText
                                        primary={text}
                                        sx={{ color: isActive ? '#545eb9' : 'white', backgroundColor: 'transparent' }}
                                        className="child"
                                    />
                                )}
                            </ListItemButton>
                        </div>
                    </Tooltip>
                );
            }}
        </StyledLink>
    );
};

export { NavButton };
