import { Grid, InputLabel } from '@mui/material';
import { ErrorSchema } from '@rjsf/utils';
import React, { useState } from 'react';
import ReactQuill, { DeltaStatic, EmitterSource } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import '../../css/quill.css';

const TextArea = ({
    id,
    value,
    label,
    readonly,
    onChange,
    placeholder,
    defaultValue,
    toPrint,
    error,
}: {
    id: string;
    value?: string;
    label: string;
    readonly?: boolean;
    onChange: (value: any, es?: ErrorSchema<any> | undefined, id?: string) => void;
    placeholder?: string;
    defaultValue?: string;
    toPrint?: boolean;
    error?: boolean;
}) => {
    const [showLabel, setShowLabel] = useState<Boolean>(false);

    const handleChange = (_content: string, _delta: DeltaStatic, _source: EmitterSource, editor: ReactQuill.UnprivilegedEditor) => {
        const editorContentAsHtml = editor.getHTML();
        onChange(editorContentAsHtml === '<p><br></p>' || editorContentAsHtml === '<p><br/></p>' ? '' : editorContentAsHtml);
    };

    const handleFocus = () => setShowLabel(true);

    const handleBlur = () => setShowLabel(false);

    const modules = {
        toolbar: [
            [{ header: '4' }, { header: '2' }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }, { align: '' }, { align: 'center' }, { align: 'right' }, { align: 'left' }],
        ],
    };

    const formats = ['header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'indent', 'direction', 'align'];

    const editorStyle: React.CSSProperties = {
        border: readonly ? 'none' : error ? '1px solid #FF0000' : (showLabel && '1px solid #1E2775') || '1px solid #CCCFE5',
        borderBottom: readonly ? '1px solid gray' : error ? '1px solid #FF0000' : (showLabel && '1px solid #1E2775') || '1px solid #CCCFE5',
        transition: 'border-color 0.3s',
    };

    const isEditorEmpty = () => value === '<p><br></p>' || value === undefined;

    if (toPrint) return null;

    return (
        <Grid position="relative">
            {(showLabel || !isEditorEmpty()) && (
                <InputLabel
                    style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        zIndex: 1,
                        background: '#fff',
                        padding: '0 8px',
                        transition: 'top 0.3s',
                        transform: 'translate(-14px,-9px) scale(0.75)',
                        transformOrigin: 'top-right',
                        color: error ? '#FF0000' : showLabel ? '#1E2775' : '#9398C2',
                    }}
                    shrink={readonly || undefined}
                >
                    {label}
                </InputLabel>
            )}
            <ReactQuill
                id={id}
                value={value}
                readOnly={readonly}
                onChange={handleChange}
                modules={readonly ? { toolbar: false } : modules}
                formats={formats}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={editorStyle}
                placeholder={placeholder}
                defaultValue={defaultValue}
            />
            {isEditorEmpty() && !showLabel && (
                <div
                    className="ql-editor-placeholder"
                    style={{
                        color: error ? '#FF0000' : '#9398C2',
                        padding: '8.5px 14px',
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        pointerEvents: 'none',
                        paddingLeft: 20,
                        width: 'inherit',
                    }}
                >
                    {label}
                </div>
            )}
        </Grid>
    );
};

export default TextArea;
