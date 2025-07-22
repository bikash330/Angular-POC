import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { Wishlist, WishlistItem } from '../../models/cart.model';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit, OnDestroy {
  wishlist: Wishlist | null = null;
  loading = false;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWishlist(): void {
    this.loading = true;
    this.wishlistService.getWishlist()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (wishlist) => {
          this.wishlist = wishlist;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load wishlist';
          this.loading = false;
          console.error('Error loading wishlist:', error);
        }
      });
  }

  removeFromWishlist(item: WishlistItem): void {
    this.wishlistService.removeFromWishlist(item.product.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (wishlist) => {
          this.wishlist = wishlist;
        },
        error: (error) => {
          alert('Failed to remove item from wishlist');
          console.error('Error removing from wishlist:', error);
        }
      });
  }

  addToCart(item: WishlistItem): void {
    this.cartService.addToCart({ productId: item.product.id, quantity: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Item added to cart successfully!');
        },
        error: (error) => {
          alert('Failed to add item to cart');
          console.error('Error adding to cart:', error);
        }
      });
  }

  clearWishlist(): void {
    if (confirm('Are you sure you want to clear your wishlist?')) {
      this.wishlistService.clearWishlist();
      this.wishlist = null;
    }
  }

  getStarArray(rating: number): boolean[] {
    const stars: boolean[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.floor(rating));
    }
    return stars;
  }
} 