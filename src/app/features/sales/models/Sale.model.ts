export interface Sale {
  _id: string;
  product: any; // Product object or ID
  quantity: number;
  totalPrice: number;
  notes?: string;
  soldBy?: any; // User object or ID
  stockAdjustments?: string[]; // Array of StockAdjustment IDs
  createdAt?: Date;
  updatedAt?: Date;
}
