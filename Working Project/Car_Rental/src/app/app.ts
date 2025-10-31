import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, // Set component to standalone
  imports: [RouterOutlet], // Import dependencies
  templateUrl: './app.html', // FIX: Use templateUrl instead of inline template
  changeDetection: ChangeDetectionStrategy.OnPush, // Improve performance
})
export class AppComponent {
  // The title signal was unused, so it's removed for cleanup.
}