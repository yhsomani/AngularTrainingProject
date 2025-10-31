import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  // Use signals for form state
  userName = signal('');
  password = signal('');
  errorMessage = signal('');

  router = inject(Router);

  onLogin() {
    // Reset error message on new login attempt
    this.errorMessage.set('');

    if (this.userName() === 'Admin' && this.password() === '11223') {
      this.router.navigate(['/dashboard']);
    } else {
      // Set error message instead of using alert()
      this.errorMessage.set('Invalid username or password. Please try again.');
    }
  }
}
