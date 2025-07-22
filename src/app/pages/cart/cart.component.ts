import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { Cart, CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  loading = false;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.loadCart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCart(): void {
    this.loading = true;
    this.cartService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          this.cart = cart;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load cart';
          this.loading = false;
          console.error('Error loading cart:', error);
        }
      });
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(item);
      return;
    }

    this.cartService.updateCartItem({ cartItemId: item.id, quantity })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          this.cart = cart;
        },
        error: (error) => {
          alert('Failed to update item quantity');
          console.error('Error updating cart item:', error);
        }
      });
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          this.cart = cart;
        },
        error: (error) => {
          alert('Failed to remove item from cart');
          console.error('Error removing cart item:', error);
        }
      });
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart();
      this.cart = null;
    }
  }

  get itemCount(): number {
    return this.cart ? this.cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
  }

  get subtotal(): number {
    return this.cart ? this.cart.total : 0;
  }

  get shipping(): number {
    return this.subtotal > 50 ? 0 : 10;
  }

  get total(): number {
    return this.subtotal + this.shipping;
  }

  getQuantityOptions(stock: number): number[] {
    const maxQuantity = Math.min(stock, 10);
    return Array.from({ length: maxQuantity }, (_, i) => i + 1);
  }
} 