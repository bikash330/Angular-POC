import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Wishlist, WishlistItem } from '../models/cart.model';
import { ProductService } from './product.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistSubject = new BehaviorSubject<Wishlist | null>(null);
  public wishlist$ = this.wishlistSubject.asObservable();
  private wishlistKey = 'ecommerce_wishlist';

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {
    this.loadWishlistFromStorage();
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.clearWishlist();
      } else {
        this.loadWishlistFromStorage();
      }
    });
  }

  private loadWishlistFromStorage(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const wishlistStr = localStorage.getItem(`${this.wishlistKey}_${user.id}`);
    if (wishlistStr) {
      try {
        const wishlist = JSON.parse(wishlistStr);
        this.wishlistSubject.next(wishlist);
      } catch (error) {
        this.clearWishlist();
      }
    } else {
      this.initializeEmptyWishlist();
    }
  }

  private saveWishlistToStorage(wishlist: Wishlist): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      localStorage.setItem(`${this.wishlistKey}_${user.id}`, JSON.stringify(wishlist));
    }
  }

  private initializeEmptyWishlist(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      const emptyWishlist: Wishlist = {
        id: 1,
        userId: user.id,
        items: [],
        updatedAt: new Date().toISOString()
      };
      this.wishlistSubject.next(emptyWishlist);
      this.saveWishlistToStorage(emptyWishlist);
    }
  }

  getWishlist(): Observable<Wishlist> {
    const currentWishlist = this.wishlistSubject.value;
    if (currentWishlist) {
      return of(currentWishlist).pipe(delay(200));
    }
    
    this.initializeEmptyWishlist();
    return of(this.wishlistSubject.value!).pipe(delay(200));
  }

  addToWishlist(productId: number): Observable<Wishlist> {
    return this.productService.getProductById(productId).pipe(
      delay(300),
      map(product => {
        const user = this.authService.getCurrentUser();
        if (!user) {
          throw new Error('User must be logged in to add items to wishlist');
        }

        let wishlist = this.wishlistSubject.value;
        if (!wishlist) {
          this.initializeEmptyWishlist();
          wishlist = this.wishlistSubject.value!;
        }

        // Check if item already exists in wishlist
        const existingItem = wishlist.items.find(item => item.product.id === productId);
        if (existingItem) {
          throw new Error('Product is already in wishlist');
        }

        // Add new item to wishlist
        const newWishlistItem: WishlistItem = {
          id: wishlist.items.length + 1,
          product,
          addedAt: new Date().toISOString()
        };
        
        wishlist.items.push(newWishlistItem);
        wishlist.updatedAt = new Date().toISOString();

        this.wishlistSubject.next(wishlist);
        this.saveWishlistToStorage(wishlist);
        return wishlist;
      })
    );
  }

  removeFromWishlist(productId: number): Observable<Wishlist> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const wishlist = this.wishlistSubject.value;
        if (!wishlist) {
          throw new Error('Wishlist not found');
        }

        const itemIndex = wishlist.items.findIndex(item => item.product.id === productId);
        if (itemIndex === -1) {
          throw new Error('Product not found in wishlist');
        }

        wishlist.items.splice(itemIndex, 1);
        wishlist.updatedAt = new Date().toISOString();

        this.wishlistSubject.next(wishlist);
        this.saveWishlistToStorage(wishlist);
        return wishlist;
      })
    );
  }

  isInWishlist(productId: number): Observable<boolean> {
    return this.wishlist$.pipe(
      map(wishlist => {
        if (!wishlist) return false;
        return wishlist.items.some(item => item.product.id === productId);
      })
    );
  }

  clearWishlist(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      const emptyWishlist: Wishlist = {
        id: 1,
        userId: user.id,
        items: [],
        updatedAt: new Date().toISOString()
      };
      this.wishlistSubject.next(emptyWishlist);
      this.saveWishlistToStorage(emptyWishlist);
    } else {
      this.wishlistSubject.next(null);
    }
  }

  getWishlistItemCount(): Observable<number> {
    return this.wishlist$.pipe(
      map(wishlist => wishlist ? wishlist.items.length : 0)
    );
  }
} 