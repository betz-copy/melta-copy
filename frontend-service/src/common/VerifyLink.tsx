import React, { ReactNode, useState } from 'react';
import Linkify from 'react-linkify';

const CustomLink: React.FC<{ href: string; text: string; color?: string }> = ({ href, text, color }) => {
    const [isHovered, setIsHovered] = useState<boolean>(false);

    return (
        <a
            target="_blank"
            rel="noreferrer"
            href={href}
            style={{
                textDecoration: isHovered ? 'underline' : 'none',
                color: color || '#166BD4',
                transition: 'color 0.3s, text-decoration 0.3s',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {text}
        </a>
    );
};

const VerifyLink: React.FC<{ children?: ReactNode; color?: string }> = ({ children, color }) => {
    const componentDecorator = (decoratedHref: string, decoratedText: string, key: number) => (
        <CustomLink key={key} href={decoratedHref} text={decoratedText} color={color} />
    );

    return (
        <span style={{ color }}>
            <Linkify componentDecorator={componentDecorator}>{children}</Linkify>
        </span>
    );
};

export { VerifyLink };
