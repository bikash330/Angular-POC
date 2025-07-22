import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'ecommerce_token';
  private userKey = 'ecommerce_user';

  // Dummy users for testing
  private dummyUsers: User[] = [
    {
      id: 1,
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      email: 'user@example.com',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
      createdAt: new Date().toISOString()
    }
  ];

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Simulate API call with delay
    return new Observable(observer => {
      setTimeout(() => {
        try {
          const user = this.dummyUsers.find(u => u.email === credentials.email);
          
          if (!user) {
            observer.error(new Error('User not found'));
            return;
          }

          // In real implementation, password would be verified on backend
          if (credentials.password !== 'password123') {
            observer.error(new Error('Invalid password'));
            return;
          }

          const token = this.generateDummyToken(user);
          const response: AuthResponse = { user, token };

          localStorage.setItem(this.tokenKey, token);
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.currentUserSubject.next(user);

          observer.next(response);
          observer.complete();
        } catch (error) {
          console.error('Login error:', error);
          observer.error(error);
        }
      }, 1000);
    });
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return of(null).pipe(
      delay(1000),
      map(() => {
        // Check if user already exists
        const existingUser = this.dummyUsers.find(u => u.email === userData.email);
        if (existingUser) {
          throw new Error('User already exists');
        }

        const newUser: User = {
          id: this.dummyUsers.length + 1,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: 'user',
          createdAt: new Date().toISOString()
        };

        this.dummyUsers.push(newUser);
        const token = this.generateDummyToken(newUser);
        const response: AuthResponse = { user: newUser, token };

        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(newUser));
        this.currentUserSubject.next(newUser);

        return response;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  isUser(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'user';
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private generateDummyToken(user: User): string {
    // In real implementation, this would be a proper JWT from backend
    return btoa(JSON.stringify({ userId: user.id, email: user.email, role: user.role, exp: Date.now() + 86400000 }));
  }
} 