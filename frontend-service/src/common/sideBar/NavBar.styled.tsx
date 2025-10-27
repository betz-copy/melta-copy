import { ListItemText, styled } from '@mui/material';
import { Link } from 'wouter';

const StyledListItemText = styled(ListItemText)({
    marginLeft: '20px',
});

const StyledLink = styled(Link)({
    textDecoration: 'none',
    color: 'inherit',
});

export { StyledListItemText, StyledLink };
