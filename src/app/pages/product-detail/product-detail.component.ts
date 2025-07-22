import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  loading = false;
  error = '';
  quantity = 1;
  isInWishlist = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      if (productId) {
        this.loadProduct(productId);
        if (this.authService.isAuthenticated() && this.authService.isUser()) {
          this.checkWishlistStatus(productId);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.error = '';

    this.productService.getProductById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Product not found or failed to load.';
          this.loading = false;
          console.error('Error loading product:', error);
        }
      });
  }

  checkWishlistStatus(productId: number): void {
    this.wishlistService.isInWishlist(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isInWishlist) => {
          this.isInWishlist = isInWishlist;
        },
        error: (error) => {
          console.error('Error checking wishlist status:', error);
        }
      });
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isUser()) {
      alert('Only regular users can add items to cart');
      return;
    }

    this.cartService.addToCart({ productId: this.product.id, quantity: this.quantity })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert(`${this.quantity} item(s) added to cart successfully!`);
          this.quantity = 1; // Reset quantity
        },
        error: (error) => {
          alert('Failed to add product to cart. Please try again.');
          console.error('Error adding to cart:', error);
        }
      });
  }

  toggleWishlist(): void {
    if (!this.product) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isUser()) {
      alert('Only regular users can manage wishlist');
      return;
    }

    if (this.isInWishlist) {
      this.removeFromWishlist();
    } else {
      this.addToWishlist();
    }
  }

  private addToWishlist(): void {
    if (!this.product) return;

    this.wishlistService.addToWishlist(this.product.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isInWishlist = true;
          alert('Product added to wishlist successfully!');
        },
        error: (error) => {
          alert('Failed to add product to wishlist. Please try again.');
          console.error('Error adding to wishlist:', error);
        }
      });
  }

  private removeFromWishlist(): void {
    if (!this.product) return;

    this.wishlistService.removeFromWishlist(this.product.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isInWishlist = false;
          alert('Product removed from wishlist successfully!');
        },
        error: (error) => {
          alert('Failed to remove product from wishlist. Please try again.');
          console.error('Error removing from wishlist:', error);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isUser(): boolean {
    return this.authService.isUser();
  }

  getStarArray(rating: number): boolean[] {
    const stars: boolean[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.floor(rating));
    }
    return stars;
  }

  getSavingsPercentage(): number {
    if (this.product?.originalPrice && this.product?.price) {
      return Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
    }
    return 0;
  }
} 