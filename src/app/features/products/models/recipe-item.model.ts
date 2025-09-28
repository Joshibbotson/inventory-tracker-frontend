import { Material } from '../../materials/models/material.model';
import { Unit } from '../../units/models/Unit.model';

export type RecipeItem = {
  _id: string;
  material: Material;
  quantity: number;
  unit: Unit;
};
