import { Pipe, PipeTransform } from '@angular/core';
import { Material } from '../models/material.model';

@Pipe({
  name: 'isLowStock',
})
export class IsLowStockPipe implements PipeTransform {
  transform(material: Material): boolean {
    return material.currentStock <= material.minimumStock;
  }
}
