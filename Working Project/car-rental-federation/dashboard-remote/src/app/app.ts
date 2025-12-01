import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent],
  template: `
    <div class="min-h-screen bg-neutral-light px-4 py-8">
      <div class="mx-auto max-w-6xl space-y-8">
        <section
          class="rounded-3xl border border-white/60 bg-gradient-to-br from-white via-primary/5 to-accent/10 p-8 shadow-card">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Dashboard remote</p>
          <h1 class="mt-3 text-3xl font-semibold text-neutral-dark">Operations intelligence hub</h1>
          <p class="mt-2 text-sm text-neutral">
            Preview cards, tables, and toasts with the shared Tailwind preset without needing the host container.
          </p>
          <div class="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
            <span class="rounded-full bg-white/80 px-4 py-1 text-neutral-dark">Dev preview</span>
            <span class="rounded-full bg-primary/10 px-4 py-1 text-primary">Realtime mock data</span>
          </div>
        </section>

        <section class="rounded-2xl border border-white/70 bg-white/95 p-4 shadow-lg">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-neutral-dark">Dashboard module</p>
              <p class="text-xs text-neutral">Grid + KPI previews render directly below.</p>
            </div>
            <span class="rounded-full bg-neutral-light px-3 py-1 text-xs font-semibold text-neutral">Signals demo</span>
          </div>
          <app-dashboard></app-dashboard>
        </section>
      </div>
    </div>
  `
})
export class AppComponent { }
