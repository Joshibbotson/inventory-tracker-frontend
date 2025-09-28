export interface StockAdjustment {
  _id: string;
  material: any; // Material object or ID
  adjustmentType:
    | 'purchase'
    | 'waste'
    | 'correction'
    | 'return'
    | 'production'
    | 'sale';
  quantity: number;
  unit: any; // Unit object or ID
  notes?: string;
  cost?: number;
  adjustedBy?: any; // User object or ID
  relatedProduct?: string;
  previousStock: number;
  newStock: number;
  createdAt?: Date;
  updatedAt?: Date;
}
