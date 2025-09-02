import React, { ReactNode } from 'react';
import { Grid, MenuItem } from '@mui/material';

const MenuButton: React.FC<{
    onClick: React.MouseEventHandler<HTMLLIElement>;
    text: string;
    disabled?: boolean;
    icon: ReactNode;
}> = ({ icon, onClick, text, disabled = false }) => {
    return (
        <MenuItem disabled={disabled} onClick={onClick}>
            <Grid container>
                <Grid>{icon}</Grid>
                <Grid paddingLeft="8px">{text}</Grid>
            </Grid>
        </MenuItem>
    );
};

export { MenuButton };
