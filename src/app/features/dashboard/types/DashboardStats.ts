import { ProductionStats } from './ProductionStats';

export interface DashboardStats {
  totalMaterials: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  productionStats: ProductionStats;
}
