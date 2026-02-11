import type { ChangeEvent } from 'react';

interface FluxSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[] | { label: string; value: string }[];
    title?: string;
    style?: React.CSSProperties;
}

export function FluxSelect({
    value,
    onChange,
    options,
    title,
    style
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
                background: 'rgba(51, 65, 85, 0.5)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
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
                    <option key={val} value={val} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                        {label}
                    </option>
                );
            })}
        </select>
    );
}
