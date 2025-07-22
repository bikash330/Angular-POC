import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest } from '../models/cart.model';
import { ProductService } from './product.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();
  private cartKey = 'ecommerce_cart';

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {
    this.loadCartFromStorage();
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.clearCart();
      } else {
        this.loadCartFromStorage();
      }
    });
  }

  private loadCartFromStorage(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const cartStr = localStorage.getItem(`${this.cartKey}_${user.id}`);
    if (cartStr) {
      try {
        const cart = JSON.parse(cartStr);
        this.cartSubject.next(cart);
      } catch (error) {
        this.clearCart();
      }
    } else {
      this.initializeEmptyCart();
    }
  }

  private saveCartToStorage(cart: Cart): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      localStorage.setItem(`${this.cartKey}_${user.id}`, JSON.stringify(cart));
    }
  }

  private initializeEmptyCart(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      const emptyCart: Cart = {
        id: 1,
        userId: user.id,
        items: [],
        total: 0,
        updatedAt: new Date().toISOString()
      };
      this.cartSubject.next(emptyCart);
      this.saveCartToStorage(emptyCart);
    }
  }

  getCart(): Observable<Cart> {
    const currentCart = this.cartSubject.value;
    if (currentCart) {
      return of(currentCart).pipe(delay(200));
    }
    
    this.initializeEmptyCart();
    return of(this.cartSubject.value!).pipe(delay(200));
  }

  addToCart(request: AddToCartRequest): Observable<Cart> {
    return this.productService.getProductById(request.productId).pipe(
      delay(300),
      map(product => {
        const user = this.authService.getCurrentUser();
        if (!user) {
          throw new Error('User must be logged in to add items to cart');
        }

        let cart = this.cartSubject.value;
        if (!cart) {
          this.initializeEmptyCart();
          cart = this.cartSubject.value!;
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => item.product.id === request.productId);
        
        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          cart.items[existingItemIndex].quantity += request.quantity;
        } else {
          // Add new item to cart
          const newCartItem: CartItem = {
            id: cart.items.length + 1,
            product,
            quantity: request.quantity,
            addedAt: new Date().toISOString()
          };
          cart.items.push(newCartItem);
        }

        cart.total = this.calculateCartTotal(cart.items);
        cart.updatedAt = new Date().toISOString();

        this.cartSubject.next(cart);
        this.saveCartToStorage(cart);
        return cart;
      })
    );
  }

  updateCartItem(request: UpdateCartItemRequest): Observable<Cart> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const cart = this.cartSubject.value;
        if (!cart) {
          throw new Error('Cart not found');
        }

        const itemIndex = cart.items.findIndex(item => item.id === request.cartItemId);
        if (itemIndex === -1) {
          throw new Error('Cart item not found');
        }

        if (request.quantity <= 0) {
          // Remove item if quantity is 0 or less
          cart.items.splice(itemIndex, 1);
        } else {
          // Update quantity
          cart.items[itemIndex].quantity = request.quantity;
        }

        cart.total = this.calculateCartTotal(cart.items);
        cart.updatedAt = new Date().toISOString();

        this.cartSubject.next(cart);
        this.saveCartToStorage(cart);
        return cart;
      })
    );
  }

  removeFromCart(cartItemId: number): Observable<Cart> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const cart = this.cartSubject.value;
        if (!cart) {
          throw new Error('Cart not found');
        }

        const itemIndex = cart.items.findIndex(item => item.id === cartItemId);
        if (itemIndex === -1) {
          throw new Error('Cart item not found');
        }

        cart.items.splice(itemIndex, 1);
        cart.total = this.calculateCartTotal(cart.items);
        cart.updatedAt = new Date().toISOString();

        this.cartSubject.next(cart);
        this.saveCartToStorage(cart);
        return cart;
      })
    );
  }

  clearCart(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      const emptyCart: Cart = {
        id: 1,
        userId: user.id,
        items: [],
        total: 0,
        updatedAt: new Date().toISOString()
      };
      this.cartSubject.next(emptyCart);
      this.saveCartToStorage(emptyCart);
    } else {
      this.cartSubject.next(null);
    }
  }

  getCartItemCount(): Observable<number> {
    return this.cart$.pipe(
      map(cart => cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0)
    );
  }

  private calculateCartTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }
} 