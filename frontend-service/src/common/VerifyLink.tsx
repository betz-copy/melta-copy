import React, { ReactNode } from 'react';
import Linkify from 'react-linkify';

const CustomLink: React.FC<{ href: string; text: string }> = ({ href, text }) => (
    <a target="_blank" rel="noreferrer" href={href} style={{ textDecoration: 'none', color: '#166BD4' }}>
        {text}
    </a>
);

const componentDecorator = (decoratedHref, decoratedText, key) => <CustomLink key={key} href={decoratedHref} text={decoratedText} />;

const VerifyLink: React.FC<{ children?: ReactNode }> = ({ children }) => {
    return <Linkify componentDecorator={componentDecorator}>{children}</Linkify>;
};

export { VerifyLink };
