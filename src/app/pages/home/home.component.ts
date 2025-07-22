import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  selectedCategory = '';
  searchQuery = '';
  loading = false;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';
    
    this.productService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.filteredProducts = products;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load products. Please try again.';
          this.loading = false;
          console.error('Error loading products:', error);
        }
      });
  }

  loadCategories(): void {
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  filterProducts(): void {
    let filtered = [...this.products];

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === this.selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    this.filteredProducts = filtered;
  }

  onCategoryChange(): void {
    this.filterProducts();
  }

  onSearchChange(): void {
    this.filterProducts();
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.searchQuery = '';
    this.filteredProducts = [...this.products];
  }

  viewProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isUser()) {
      alert('Only regular users can add items to cart');
      return;
    }

    this.cartService.addToCart({ productId: product.id, quantity: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Product added to cart successfully!');
        },
        error: (error) => {
          alert('Failed to add product to cart. Please try again.');
          console.error('Error adding to cart:', error);
        }
      });
  }

  addToWishlist(product: Product, event: Event): void {
    event.stopPropagation();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isUser()) {
      alert('Only regular users can add items to wishlist');
      return;
    }

    this.wishlistService.addToWishlist(product.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Product added to wishlist successfully!');
        },
        error: (error) => {
          if (error.message === 'Product is already in wishlist') {
            alert('Product is already in your wishlist');
          } else {
            alert('Failed to add product to wishlist. Please try again.');
          }
          console.error('Error adding to wishlist:', error);
        }
      });
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
} 