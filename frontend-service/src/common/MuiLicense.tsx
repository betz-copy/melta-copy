import { LicenseInfo } from '@mui/x-license-pro';
import { environment } from '../globals';

const {
    mui: { activationKey },
} = environment;

LicenseInfo.setLicenseKey(activationKey);

const MuiXLicense = () => {
    return null;
};

export default MuiXLicense;
