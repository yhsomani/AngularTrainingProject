import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RegistryService {
    private remotes: Record<string, string> = {};

    loadConfig(): Promise<void> {
        return fetch('/assets/remotes.config.json')
            .then(res => res.json())
            .then(config => {
                this.remotes = config;
                console.log('✅ Remotes config loaded:', this.remotes);
            })
            .catch(err => console.error('❌ Failed to load remotes config:', err));
    }

    getRemoteUrl(key: string): string {
        return this.remotes[key];
    }
}