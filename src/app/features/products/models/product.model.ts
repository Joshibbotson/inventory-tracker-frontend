import { RecipeItem } from './recipe-item.model';

export interface Product {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  sellingPrice: number;
  status: 'active' | 'seasonal' | 'discontinued';
  category: 'regular' | 'seasonal' | 'limited_edition' | 'custom';
  recipe: RecipeItem[];
  imageUrl?: string;
  currentStock?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
