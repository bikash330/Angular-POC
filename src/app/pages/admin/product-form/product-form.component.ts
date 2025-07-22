import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit, OnDestroy {
  productForm: FormGroup;
  loading = false;
  error = '';
  isEditMode = false;
  productId: number | null = null;
  categories: string[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      originalPrice: [''],
      imageUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      category: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = +params['id'];
        this.loadProduct(this.productId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  loadProduct(id: number): void {
    this.loading = true;
    this.productService.getProductById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice || '',
            imageUrl: product.imageUrl,
            category: product.category,
            stock: product.stock
          });
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load product';
          this.loading = false;
          console.error('Error loading product:', error);
        }
      });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.loading = true;
      this.error = '';

      const formData = { ...this.productForm.value };
      if (!formData.originalPrice) {
        delete formData.originalPrice;
      }

      const operation = this.isEditMode
        ? this.productService.updateProduct({ ...formData, id: this.productId! })
        : this.productService.createProduct(formData);

      operation.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.loading = false;
          alert(`Product ${this.isEditMode ? 'updated' : 'created'} successfully!`);
          this.router.navigate(['/admin/products']);
        },
        error: (error) => {
          this.loading = false;
          this.error = `Failed to ${this.isEditMode ? 'update' : 'create'} product`;
          console.error('Error saving product:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(field => {
      const control = this.productForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} must be at least ${requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${this.getFieldDisplayName(fieldName)} must be greater than ${field.errors['min'].min}`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid URL starting with http:// or https://';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      name: 'Product name',
      description: 'Description',
      price: 'Price',
      originalPrice: 'Original price',
      imageUrl: 'Image URL',
      category: 'Category',
      stock: 'Stock quantity'
    };
    return displayNames[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
} 