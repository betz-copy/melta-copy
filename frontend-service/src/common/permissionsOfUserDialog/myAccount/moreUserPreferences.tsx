const MoreUserPreferences: React.FC<{}> = () => {
    return (
        <Grid container item display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Grid item marginLeft={1}>
                <SelectCheckbox
                    title={i18next.t('notifications.notificationType')}
                    options={allNotifications}
                    selectedOptions={notificationsToShowCheckbox}
                    setSelectedOptions={setNotificationsToShowCheckbox}
                    getOptionId={({ type }) => type}
                    getOptionLabel={(option) => option.displayName()}
                    size="small"
                    toUserProfile
                    isDraggableDisabled
                    horizontalOrigin={153}
                />
            </Grid>
            <Grid item marginRight={2}>
                <DayNightSwitch
                    checked={darkMode}
                    onClick={() => {
                        setIsDarkMode(!isDarkMode);
                        toggleDarkMode();
                        updateUserPreferencesMetadataRequest(
                            existingUser!._id,
                            existingUser.preferences,
                            existingUser.preferences.mailsNotificationsTypes,
                            !isDarkMode,
                        );
                    }}
                />
            </Grid>
        </Grid>
    );
};

export { MoreUserPreferences };
