import { Unit } from '../../units/models/Unit.model';

export interface Material {
  _id: string;
  name: string;
  sku: string;
  unit: Unit;
  currentStock: number;
  minimumStock: number;
  averageCost: number;
  supplier?: string;
  category: MaterialCategory;
  notes?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export enum MaterialCategory {
  WAX = 'wax',
  WICK = 'wick',
  FRAGRANCE = 'fragrance',
  DYE = 'dye',
  CONTAINER = 'container',
  LABEL = 'label',
  OTHER = 'other',
}
