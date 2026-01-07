import React from 'react';
import { cn } from '../../../../lib/utils';

interface TokenTextProps {
    token: string;
}

export const TokenText: React.FC<TokenTextProps> = ({ token }) => {
    // Simplified parser for **bold** and *italic*
    const renderParts = (text: string, bold: boolean) => {
        const italicRegex = /\*([^*]+)\*/g;
        if (italicRegex.test(text)) {
            return (
                <>
                    {text.split(italicRegex).map((part, i) => {
                        const isItalic = i % 2 === 1;
                        const classes = cn(
                            bold && "font-bold",
                            isItalic && "italic"
                        );
                        return <span key={i} className={classes}>{part}</span>;
                    })}
                </>
            );
        }
        if (bold) {
            return <strong className="font-bold">{text}</strong>;
        }
        return text;
    };

    const boldRegex = /\*\*(.*?)\*\*/g;
    if (boldRegex.test(token)) {
        return (
            <>
                {token.split(boldRegex).map((part, i) => (
                    <React.Fragment key={i}>
                        {renderParts(part, i % 2 === 1)}
                    </React.Fragment>
                ))}
            </>
        );
    } else {
        return <React.Fragment>{renderParts(token, false)}</React.Fragment>;
    }
};
