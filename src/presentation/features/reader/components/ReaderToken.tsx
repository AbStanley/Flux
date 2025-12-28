import React from 'react';
import styles from '../ReaderView.module.css';

interface ReaderTokenProps {
    token: string;
    index: number;
    isSelected: boolean;
    isHovered: boolean;
    isWhitespace: boolean;
    groupTranslation: string | undefined;
    position: string | undefined;
    hoverTranslation: string | null;
    onClick: (index: number) => void;
    onMouseEnter: (index: number) => void;
    onMouseLeave: () => void;
}

export const ReaderToken: React.FC<ReaderTokenProps> = ({
    token,
    index,
    isSelected,
    isHovered,
    isWhitespace,
    groupTranslation,
    position,
    hoverTranslation,
    onClick,
    onMouseEnter,
    onMouseLeave
}) => {
    return (
        <span
            className={`
                ${styles.token} 
                ${isSelected ? styles.selected : ''} 
                ${!isWhitespace ? styles.interactive : ''}
                ${position ? styles[position] : ''}
            `}
            onClick={() => !isWhitespace && onClick(index)}
            onMouseEnter={() => !isWhitespace && onMouseEnter(index)}
            onMouseLeave={onMouseLeave}
            style={{ position: 'relative' }}
        >
            {groupTranslation && (
                <span className={styles.selectionPopupValid}>
                    {groupTranslation}
                </span>
            )}

            {token}

            {isHovered && hoverTranslation && !isSelected && (
                <span className={styles.hoverPopup}>{hoverTranslation}</span>
            )}
        </span>
    );
};
