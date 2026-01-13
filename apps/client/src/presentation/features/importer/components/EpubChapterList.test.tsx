import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EpubChapterList } from './EpubChapterList';
import type { Chapter } from '../../utils/epubUtils';

const mockChapters: Chapter[] = [
    { id: '1', label: 'Chapter 1', href: 'ch1.html' },
    {
        id: '2',
        label: 'Chapter 2',
        href: 'ch2.html',
        subitems: [
            { id: '2.1', label: 'Section 2.1', href: 'ch2-1.html' }
        ]
    }
];

describe('EpubChapterList', () => {
    const mockOnToggle = vi.fn();

    it('renders top-level chapters', () => {
        render(
            <EpubChapterList
                chapters={mockChapters}
                selectedHrefs={new Set()}
                onToggle={mockOnToggle}
            />
        );
        expect(screen.getByText('Chapter 1')).toBeInTheDocument();
        expect(screen.getByText('Chapter 2')).toBeInTheDocument();
    });

    it('renders sub-chapters', () => {
        render(
            <EpubChapterList
                chapters={mockChapters}
                selectedHrefs={new Set()}
                onToggle={mockOnToggle}
            />
        );
        expect(screen.getByText('Section 2.1')).toBeInTheDocument();
    });

    it('shows checkmark for selected chapters', () => {
        const selected = new Set(['ch1.html']);
        render(
            <EpubChapterList
                chapters={mockChapters}
                selectedHrefs={selected}
                onToggle={mockOnToggle}
            />
        );

        // Verify visual state or logic. Ideally look for checked checkbox or active state.
        // Assuming Checkbox component from UI library is used which has role "checkbox".
        const checkboxes = screen.getAllByRole('checkbox');
        // We need to match checkbox to label, but order implies: Ch1, Ch2, Sec2.1
        // Ch1 should be checked.
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).not.toBeChecked();
    });

    it('calls onToggle when clicked', () => {
        render(
            <EpubChapterList
                chapters={mockChapters}
                selectedHrefs={new Set()}
                onToggle={mockOnToggle}
            />
        );

        fireEvent.click(screen.getByText('Chapter 1'));
        expect(mockOnToggle).toHaveBeenCalledWith('ch1.html');
    });
});
