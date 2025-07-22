export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  stock: number;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isSale?: boolean;
  createdAt?: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  stock: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
} 