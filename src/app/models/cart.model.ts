import { Product } from './product.model';

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  total: number;
  updatedAt: string;
}

export interface WishlistItem {
  id: number;
  product: Product;
  addedAt: string;
}

export interface Wishlist {
  id: number;
  userId: number;
  items: WishlistItem[];
  updatedAt: string;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  cartItemId: number;
  quantity: number;
} 