import React, { ReactNode } from 'react';
import { ListItemButton } from '@mui/material';
import i18next from 'i18next';
import { StyledLink, StyledListItemText } from './NavBar.styled';
import './NavButton.css';
import { MeltaTooltip } from '../MeltaTooltip';

interface NavButtonProps {
    to: string;
    isDrawerOpen: boolean;
    title: string | ReactNode;
    disabled?: boolean;
    text?: string;
    onChangeToActive: (boolean) => void;
}

const NavButton: React.FC<NavButtonProps> = ({ to, isDrawerOpen, title, children, disabled = false, onChangeToActive, text }) => {
    return (
        <StyledLink to={to} className="nav-button">
            {({ isActive }) => {
                onChangeToActive(isActive);
                return (
                    <MeltaTooltip
                        title={disabled ? (i18next.t('permissions.dontHavePermissionsToCategory') as string) : title}
                        placement="left-end"
                        disableHoverListener={!disabled && isDrawerOpen && !text} // when drawer is opened text is already shown, so no need for tooltip
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
                                        primary={text ?? title}
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
