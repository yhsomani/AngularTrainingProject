import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    userName = signal('');
    password = signal('');
    errorMessage = signal('');

    constructor(private router: Router) { }

    onLogin() {
        this.errorMessage.set(''); // Clear previous errors

        // Hardcoded Admin Auth for Demo
        if (this.userName() === 'admin' && this.password() === 'admin') {
            // Simulate network delay for "realism"
            setTimeout(() => {
                // Save token to session (or use a service)
                sessionStorage.setItem('token', 'fake-jwt-token');
                this.router.navigate(['/dashboard']);
            }, 800);
        } else {
            this.errorMessage.set('Invalid credentials. Try admin / admin');
        }
    }
}