import CloseIcon from '@mui/icons-material/Close';
import { DialogTitle, IconButton } from '@mui/material';
import i18next from 'i18next';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';
import { PrintingTemplateCardProps } from '../createOrEditPrintingTemplate';

const Title: React.FC<Pick<PrintingTemplateCardProps, 'printingTemplate' | 'onClose'>> = ({ printingTemplate, onClose }) => {
    return (
        <DialogTitle>
            <BlueTitle
                title={`${i18next.t(`wizard.printingTemplate.${printingTemplate._id ? 'update' : 'create'}Title`)}${printingTemplate._id ? ` - ${printingTemplate.name}` : ''}`}
                component="h6"
                variant="h6"
            />

            <IconButton
                aria-label="close"
                sx={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    color: (theme) => theme.palette.grey[500],
                }}
                onClick={onClose}
            >
                <CloseIcon />
            </IconButton>
        </DialogTitle>
    );
};

export default Title;
