import type { ChangeEvent } from 'react';
import type { FluxTheme } from '../../constants';

interface FluxSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[] | { label: string; value: string }[];
    title?: string;
    style?: React.CSSProperties;
    theme?: FluxTheme;
}

export function FluxSelect({
    value,
    onChange,
    options,
    title,
    style,
    theme,
}: FluxSelectProps) {
    return (
        <select
            value={value}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            title={title}
            style={{
                background: `${theme?.surface}80`,
                color: theme?.text,
                border: `1px solid ${theme?.border}`,
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.9em',
                outline: 'none',
                cursor: 'pointer',
                ...style
            }}
        >
            {options.map((opt) => {
                const label = typeof opt === 'string' ? opt : opt.label;
                const val = typeof opt === 'string' ? opt : opt.value;
                return (
                    <option key={val} value={val} style={{ backgroundColor: theme?.bgSolid, color: theme?.text }}>
                        {label}
                    </option>
                );
            })}
        </select>
    );
}
