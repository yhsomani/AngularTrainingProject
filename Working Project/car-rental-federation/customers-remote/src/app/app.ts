import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersComponent } from './customers.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CustomersComponent],
  template: `
    <div class="min-h-screen bg-neutral-light px-4 py-8">
      <div class="mx-auto max-w-6xl space-y-8">
        <section
          class="rounded-3xl border border-white/60 bg-gradient-to-br from-white via-primary/5 to-accent/10 p-8 shadow-card">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Customers remote</p>
          <h1 class="mt-3 text-3xl font-semibold text-neutral-dark">Customer intelligence workspace</h1>
          <p class="mt-2 text-sm text-neutral">
            QA the Tailwind refresh locally before exposing this module to the host application.
          </p>
          <div class="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
            <span class="rounded-full bg-white/80 px-4 py-1 text-neutral-dark">Dev preview</span>
            <span class="rounded-full bg-primary/10 px-4 py-1 text-primary">Standalone build</span>
          </div>
        </section>

        <section class="rounded-2xl border border-white/70 bg-white/95 p-4 shadow-lg">
          <div class="mb-4">
            <p class="text-sm font-semibold text-neutral-dark">Customers module</p>
            <p class="text-xs text-neutral">Live data interactions render directly below.</p>
          </div>
          <app-customers></app-customers>
        </section>
      </div>
    </div>
  `
})
export class AppComponent { }
