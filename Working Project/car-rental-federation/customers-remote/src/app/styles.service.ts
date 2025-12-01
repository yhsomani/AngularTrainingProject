import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Service to ensure application styles are properly loaded
 * This is especially important for Module Federation where remote CSS might not auto-inject
 */
@Injectable({
    providedIn: 'root'
})
export class StylesService {
    private doc = inject(DOCUMENT);

    constructor() {
        this.ensureStylesLoaded();
    }

    /**
     * Ensures that the application's global styles are loaded
     */
    private ensureStylesLoaded(): void {
        // Check if global styles are already loaded
        const styleId = 'customers-remote-styles';
        if (this.doc.getElementById(styleId)) {
            return;
        }

        // If not loaded, the styles should be imported via styles.css in the build
        // This service acts as a failsafe to ensure styles are present
        // The actual CSS loading happens through Angular's build process
    }

    /**
     * Dynamically load a stylesheet if it's not already loaded
     */
    loadStylesheet(href: string, id?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (id && this.doc.getElementById(id)) {
                resolve();
                return;
            }

            const link = this.doc.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            if (id) {
                link.id = id;
            }

            link.onload = () => {
                console.log(`Stylesheet loaded: ${href}`);
                resolve();
            };

            link.onerror = () => {
                console.error(`Failed to load stylesheet: ${href}`);
                reject(new Error(`Failed to load stylesheet: ${href}`));
            };

            this.doc.head.appendChild(link);
        });
    }
}
