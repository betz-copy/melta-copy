import { WidgetProps } from '@rjsf/utils';
import 'react-quill-new/dist/quill.snow.css';
import TextArea from '../../TextArea';

const RjfsTextAreaWidget = ({ id, value, label, readonly, onChange, options, placeholder, rawErrors }: WidgetProps) => {
    const { toPrint, defaultValue } = options;

    return (
        <TextArea
            id={id}
            value={value}
            label={label}
            readonly={readonly}
            onChange={(editorContentAsHtml: string) => onChange(editorContentAsHtml === '<p><br></p>' ? defaultValue : editorContentAsHtml)}
            placeholder={placeholder}
            defaultValue={defaultValue}
            toPrint={toPrint}
            error={!!rawErrors?.length}
        />
    );
};

export default RjfsTextAreaWidget;
