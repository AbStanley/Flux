import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to delay import until we setup mocks because the file executes on top-level
describe('Content Script Entry', () => {
    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = '';
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('injects host element and mounts React app', async () => {
        // Mock style import
        vi.doMock('../styles/global.css?inline', () => ({ default: 'mock-css' }));

        // Mock createRoot
        const renderMock = vi.fn();
        const createRootMock = vi.fn().mockReturnValue({ render: renderMock });
        vi.doMock('react-dom/client', () => ({ createRoot: createRootMock }));

        // Import the file to trigger execution
        await import('./index');

        // Check host element
        const host = document.getElementById('flux-reader-host');
        expect(host).toBeTruthy();
        expect(host?.style.position).toBe('absolute');
        expect(host?.style.zIndex).toBe('2147483647');
        expect(host?.shadowRoot).toBeTruthy();

        // Check styling
        expect(host?.shadowRoot?.innerHTML).toContain('mock-css');

        // Check React mount
        expect(createRootMock).toHaveBeenCalledWith(host?.shadowRoot);
        expect(renderMock).toHaveBeenCalled();
    });

    it('does not double inject if host exists', async () => {
        // Setup existing host
        const existingHost = document.createElement('div');
        existingHost.id = 'flux-reader-host';
        document.body.appendChild(existingHost);

        vi.doMock('react-dom/client', () => ({ createRoot: vi.fn() }));

        await import('./index');

        // Should still be just one
        const hosts = document.querySelectorAll('#flux-reader-host');
        expect(hosts.length).toBe(1);
    });
});
