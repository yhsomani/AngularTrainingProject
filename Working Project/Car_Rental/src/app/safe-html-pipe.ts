import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * A pipe to bypass security and trust a string as safe HTML.
 * This is necessary to render our inline SVG icons.
 *
 * **WARNING:** Only use this for content you trust.
 * Do not use it for user-provided content.
 */
@Pipe({
  name: 'safeHtml',
  standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
  private sanitized = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    return this.sanitized.bypassSecurityTrustHtml(value || '');
  }
}
