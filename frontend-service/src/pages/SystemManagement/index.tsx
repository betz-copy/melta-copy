import React, { useEffect } from 'react';
import { Grid } from '@mui/material';

import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { CategoriesRow } from './components/CategoriesRow';
import { EntityTemplatesRow } from './components/EntityTemplatesRow';
import { RelationshipTemplatesRow } from './components/RelationshipTemplatesRow';
import { RulesRow } from './components/RulesRow';

import '../../css/pages.css';
import { IPermissionsOfUser } from '../../services/permissionsService';

const SystemManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('pages.systemManagement')), [setTitle]);

    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    return (
        <Grid container className="pageMargin" spacing={4}>
            <CategoriesRow />
            <EntityTemplatesRow />
            <RelationshipTemplatesRow />
            {myPermissions.rulesManagementId && <RulesRow />}
        </Grid>
    );
};

export default SystemManagement;
