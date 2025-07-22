import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [
    {
      id: 1,
      name: 'Wireless Bluetooth Headphones',
      description: 'Premium quality wireless headphones with noise cancellation and 30-hour battery life.',
      price: 199.99,
      originalPrice: 249.99,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      category: 'Electronics',
      stock: 25,
      rating: 4.8,
      reviewCount: 124,
      isNew: false,
      isSale: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Smart Fitness Watch',
      description: 'Advanced fitness tracking with heart rate monitor, GPS, and waterproof design.',
      price: 299.99,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
      category: 'Electronics',
      stock: 15,
      rating: 4.6,
      reviewCount: 89,
      isNew: true,
      isSale: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Organic Cotton T-Shirt',
      description: 'Comfortable and sustainable organic cotton t-shirt available in multiple colors.',
      price: 29.99,
      originalPrice: 39.99,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
      category: 'Clothing',
      stock: 50,
      rating: 4.4,
      reviewCount: 67,
      isNew: false,
      isSale: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Professional Camera Lens',
      description: '85mm f/1.4 portrait lens with exceptional image quality and beautiful bokeh.',
      price: 599.99,
      imageUrl: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500&h=500&fit=crop',
      category: 'Photography',
      stock: 8,
      rating: 4.9,
      reviewCount: 45,
      isNew: true,
      isSale: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Ergonomic Office Chair',
      description: 'Premium ergonomic office chair with lumbar support and adjustable height.',
      price: 399.99,
      originalPrice: 499.99,
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop',
      category: 'Furniture',
      stock: 12,
      rating: 4.7,
      reviewCount: 156,
      isNew: false,
      isSale: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 6,
      name: 'Stainless Steel Water Bottle',
      description: 'Insulated stainless steel water bottle that keeps drinks cold for 24 hours.',
      price: 34.99,
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
      category: 'Sports',
      stock: 30,
      rating: 4.5,
      reviewCount: 78,
      isNew: false,
      isSale: false,
      createdAt: new Date().toISOString()
    }
  ];

  private nextId = this.products.length + 1;

  constructor() { }

  getAllProducts(): Observable<Product[]> {
    return of([...this.products]).pipe(delay(500));
  }

  getProductById(id: number): Observable<Product> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const product = this.products.find(p => p.id === id);
        if (!product) {
          throw new Error('Product not found');
        }
        return { ...product };
      })
    );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return of(null).pipe(
      delay(400),
      map(() => {
        return this.products.filter(p => 
          p.category.toLowerCase() === category.toLowerCase()
        );
      })
    );
  }

  searchProducts(query: string): Observable<Product[]> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const searchTerm = query.toLowerCase();
        return this.products.filter(p => 
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.category.toLowerCase().includes(searchTerm)
        );
      })
    );
  }

  createProduct(productData: CreateProductRequest): Observable<Product> {
    return of(null).pipe(
      delay(800),
      map(() => {
        const newProduct: Product = {
          ...productData,
          id: this.nextId++,
          rating: 0,
          reviewCount: 0,
          isNew: true,
          isSale: false,
          createdAt: new Date().toISOString()
        };
        this.products.push(newProduct);
        return { ...newProduct };
      })
    );
  }

  updateProduct(productData: UpdateProductRequest): Observable<Product> {
    return of(null).pipe(
      delay(600),
      map(() => {
        const index = this.products.findIndex(p => p.id === productData.id);
        if (index === -1) {
          throw new Error('Product not found');
        }

        this.products[index] = { ...this.products[index], ...productData };
        return { ...this.products[index] };
      })
    );
  }

  deleteProduct(id: number): Observable<boolean> {
    return of(null).pipe(
      delay(400),
      map(() => {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) {
          throw new Error('Product not found');
        }

        this.products.splice(index, 1);
        return true;
      })
    );
  }

  getCategories(): Observable<string[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const categories = [...new Set(this.products.map(p => p.category))];
        return categories.sort();
      })
    );
  }
} 