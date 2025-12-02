import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface User {
    userId: number;
    username: string;
    email: string;
    role: 'Administrator' | 'Manager' | 'Support';
    status: 'Active' | 'Inactive';
}

@Component({
    selector: 'app-users-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './users-management.component.html'
})
export class UsersManagementComponent implements OnInit {
    private http = inject(HttpClient);

    // State Signals
    userList = signal<User[]>([]);
    isLoading = signal(true);
    modalOpen = signal(false);
    isEditing = signal(false);
    notification = signal<{ type: 'success' | 'error'; message: string } | null>(null);
    searchQuery = signal('');

    // Active user for form
    activeUser: User = this.getEmptyUser();

    // Computed filtered list
    get filteredUsers(): User[] {
        const query = this.searchQuery().toLowerCase();
        if (!query) return this.userList();
        return this.userList().filter(
            (u) =>
                u.username.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query) ||
                u.role.toLowerCase().includes(query)
        );
    }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.isLoading.set(true);
        this.http.get<User[]>('http://localhost:4000/api/users').subscribe({
            next: (data) => {
                this.userList.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.showNotification('error', 'Failed to load users. Is the backend running?');
                this.isLoading.set(false);
            }
        });
    }

    openModal(mode: 'new' | 'edit', user?: User) {
        this.isEditing.set(mode === 'edit');
        if (mode === 'edit' && user) {
            this.activeUser = { ...user };
        } else {
            this.activeUser = this.getEmptyUser();
        }
        this.modalOpen.set(true);
    }

    closeModal() {
        this.modalOpen.set(false);
        this.activeUser = this.getEmptyUser();
    }

    saveUser() {
        if (!this.activeUser.username || !this.activeUser.email) {
            this.showNotification('error', 'Please fill in all required fields');
            return;
        }

        if (this.isEditing()) {
            this.http.put('http://localhost:4000/api/user', this.activeUser).subscribe({
                next: () => {
                    this.loadUsers();
                    this.closeModal();
                    this.showNotification('success', 'User updated successfully');
                },
                error: () => this.showNotification('error', 'Failed to update user')
            });
        } else {
            this.http.post('http://localhost:4000/api/user', this.activeUser).subscribe({
                next: () => {
                    this.loadUsers();
                    this.closeModal();
                    this.showNotification('success', 'User created successfully');
                },
                error: () => this.showNotification('error', 'Failed to create user')
            });
        }
    }

    deleteUser(user: User) {
        if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
            this.http.delete(`http://localhost:4000/api/user?userId=${user.userId}`).subscribe({
                next: () => {
                    this.loadUsers();
                    this.showNotification('success', 'User deleted successfully');
                },
                error: () => this.showNotification('error', 'Failed to delete user')
            });
        }
    }

    toggleUserStatus(user: User) {
        const updatedUser = {
            ...user,
            status: user.status === 'Active' ? 'Inactive' : 'Active'
        };
        this.http.put('http://localhost:4000/api/user', updatedUser).subscribe({
            next: () => {
                this.loadUsers();
                this.showNotification('success', `User ${updatedUser.status === 'Active' ? 'activated' : 'deactivated'}`);
            },
            error: () => this.showNotification('error', 'Failed to update user status')
        });
    }

    showNotification(type: 'success' | 'error', message: string) {
        this.notification.set({ type, message });
        setTimeout(() => this.notification.set(null), 4000);
    }

    private getEmptyUser(): User {
        return {
            userId: 0,
            username: '',
            email: '',
            role: 'Support',
            status: 'Active'
        };
    }

    getRoleBadgeClass(role: string): string {
        switch (role) {
            case 'Administrator':
                return 'bg-purple-100 text-purple-800';
            case 'Manager':
                return 'bg-blue-100 text-blue-800';
            case 'Support':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    getStatusBadgeClass(status: string): string {
        return status === 'Active'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    }
}
