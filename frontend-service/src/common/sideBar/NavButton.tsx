import React, { ReactNode, useEffect } from 'react';
import { ListItemButton } from '@mui/material';
import i18next from 'i18next';
import { Link, useRoute } from 'wouter';
import { MeltaTooltip } from '../MeltaTooltip';
import { StyledListItemText } from './NavBar.styled';
import './NavButton.css';

interface NavButtonProps {
    to: string;
    isDrawerOpen: boolean;
    extension?: ReactNode;
    disabled?: boolean;
    onChangeToActive: (isActive: boolean) => void;
    isActiveButton?: boolean;
    text: string;
    onClick?: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({
    to,
    isDrawerOpen,
    text,
    children,
    disabled = false,
    onChangeToActive,
    isActiveButton,
    onClick,
    extension,
}) => {
    const [isActive] = useRoute(to);

    useEffect(() => {
        if (isActive) onChangeToActive(isActive);
    }, [onChangeToActive, isActive]);

    return (
        <Link
            href={to}
            onClick={(e) => {
                if (disabled) {
                    e.preventDefault();
                    return;
                }
                onClick?.();
            }}
            className="nav-button"
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <MeltaTooltip
                title={disabled ? (i18next.t('permissions.dontHavePermissionsToCategory') as string) : extension ?? text}
                placement="left-start"
                disableHoverListener={!disabled && isDrawerOpen && !extension} // when drawer is opened text is already shown, so no need for tooltip
            >
                <div>
                    <ListItemButton
                        disabled={disabled}
                        sx={{ color: 'black' }}
                        style={{
                            justifyContent: 'space-around',
                            direction: 'rtl',
                            backgroundColor: isActiveButton ? '#ffffffcc' : 'transparent',
                            borderRadius: '20px',
                            height: '32px',
                        }}
                        className="child"
                    >
                        {children}
                        {isDrawerOpen && (
                            <StyledListItemText
                                primary={text}
                                sx={{ color: isActiveButton ? '#545eb9' : 'white', backgroundColor: 'transparent' }}
                                className="child"
                            />
                        )}
                    </ListItemButton>
                </div>
            </MeltaTooltip>
        </Link>
    );
};

export { NavButton };
