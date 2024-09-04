import React, { ReactNode } from 'react';
import { Grid, ListItemButton, MenuItem, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router';
import i18next from 'i18next';
import { StyledLink, StyledListItemText } from './NavBar.styled';
import './NavButton.css';
import { MeltaTooltip } from '../MeltaTooltip';

interface NavButtonProps {
    to: string;
    isDrawerOpen: boolean;
    text: string | ReactNode;
    disabled?: boolean;
    onChangeToActive: (boolean) => void;
}

const NavButton: React.FC<NavButtonProps> = ({ to, isDrawerOpen, text, children, disabled = false, onChangeToActive }) => {

    return (
        <StyledLink to={to} className="nav-button">
            {({ isActive }) => {
                onChangeToActive(isActive);
                return (
                    <MeltaTooltip
                        title={disabled ? (i18next.t('permissions.dontHavePermissionsToCategory') as string) : text}
                        placement="left"
                        disableHoverListener={!disabled && isDrawerOpen} // when drawer is opened text is already shown, so no need for tooltip
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
                                    backgroundColor: isActive ? '#ffffffcc' : 'transparent',
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
                    </MeltaTooltip>
                );
            }}
        </StyledLink>
    );
};

export { NavButton };
