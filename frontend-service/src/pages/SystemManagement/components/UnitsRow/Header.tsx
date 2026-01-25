import { CloseFullscreen, OpenInFull, Visibility, VisibilityOff } from '@mui/icons-material';
import { Grid, IconButton, Tooltip } from '@mui/material';
import { IMongoUnit, IUnitHierarchy } from '@packages/unit';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import SearchInput from '../../../../common/inputs/SearchInput';
import { flattenTree } from '../../../../common/Tree';
import { CreateButton } from '../CreateButton';

interface HeaderProps {
    expandedIds: string[];
    setExpandedIds: React.Dispatch<React.SetStateAction<string[]>>;
    hierarchy: IUnitHierarchy[];
    setWizardDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            unit: Partial<IMongoUnit> | IMongoUnit | null;
        }>
    >;
    isShowDisabled: boolean;
    setIsShowDisabled: React.Dispatch<React.SetStateAction<boolean>>;
    onSearch: (value: string) => void;
}

const Header = ({ setWizardDialogState, setExpandedIds, expandedIds, onSearch, isShowDisabled, setIsShowDisabled, hierarchy }: HeaderProps) => {
    const flattenedTree = useMemo(() => flattenTree(hierarchy, ({ _id }) => _id, true), [hierarchy]);

    return (
        <Grid
            container
            spacing={1}
            alignItems="center"
            sx={{
                display: 'flex',
                flexDirection: 'row',
                marginBottom: '1rem',
                width: 'maxContent',
            }}
        >
            <Grid>
                <SearchInput onChange={onSearch} borderRadius="7px" placeholder={i18next.t('globalSearch.searchUnits')} />
            </Grid>

            <Grid>
                <CreateButton onClick={() => setWizardDialogState({ isWizardOpen: true, unit: null })} text={i18next.t('systemManagement.newUnit')} />
            </Grid>

            <div
                style={{
                    display: 'flex',
                    marginRight: '2rem',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Tooltip
                    title={`${i18next.t(`wizard.unit.header.${expandedIds.length ? 'collapse' : 'expand'}`)} ${i18next.t('wizard.unit.unitTree')}`}
                >
                    <IconButton
                        onClick={() => {
                            if (expandedIds.length) setExpandedIds([]);
                            else setExpandedIds(flattenedTree?.map(({ _id }) => _id) ?? []);
                        }}
                    >
                        {expandedIds.length ? <CloseFullscreen color="primary" /> : <OpenInFull color="primary" />}
                    </IconButton>
                </Tooltip>

                <Tooltip
                    title={`${i18next.t(`wizard.unit.header.${isShowDisabled ? 'hide' : 'show'}`)} ${i18next.t('wizard.unit.header.disabledUnits')}`}
                >
                    <IconButton onClick={() => setIsShowDisabled((prev) => !prev)}>
                        {isShowDisabled ? <Visibility color="primary" /> : <VisibilityOff color="primary" />}
                    </IconButton>
                </Tooltip>
            </div>
        </Grid>
    );
};
export default Header;
