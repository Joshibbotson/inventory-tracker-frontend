import { Component, input, output } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { ProductionBatch } from '../../services/production.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-waste-modal',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './waste-modal.component.html',
  styleUrl: './waste-modal.component.scss',
})
export class WasteModalComponent {
  wasteBatch = input.required<ProductionBatch>();
  wasting = input<boolean>();

  cancelClick = output<void>();
  confirmClick = output<{ quantity: number; wasteReason: string }>();

  maxAllowed!: number;
  prevQuantity = 0;

  wasteForm = new FormGroup({
    quantity: new FormControl(0, [Validators.required, Validators.min(1)]),
    wasteReason: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    this.maxAllowed =
      this.wasteBatch().quantity -
      ((this.wasteBatch().wastedQuantity || 0) +
        (this.wasteBatch().reversedQuantity || 0));

    this.wasteForm.get('quantity')!.setValue(this.maxAllowed);
    this.prevQuantity = this.maxAllowed;

    // Add max validator dynamically
    this.wasteForm
      .get('quantity')!
      .addValidators(Validators.max(this.maxAllowed));

    // Clamp input if over max or under min
    this.wasteForm.get('quantity')!.valueChanges.subscribe((val) => {
      const num = Number(val);
      if (num > this.maxAllowed) {
        this.wasteForm.get('quantity')!.setValue(this.maxAllowed, {
          emitEvent: false,
        });
      } else if (num < 1) {
        this.wasteForm.get('quantity')!.setValue(1, { emitEvent: false });
      }
    });
  }

  get quantity() {
    return this.wasteForm.get('quantity')!;
  }

  get wasteReason() {
    return this.wasteForm.get('wasteReason')!;
  }

  getProductName(product: any): string {
    return typeof product === 'object' && product?.name
      ? product.name
      : 'Unknown Product';
  }

  cancelWaste(): void {
    this.cancelClick.emit();
  }

  confirmWaste(): void {
    if (this.wasteForm.invalid) {
      this.wasteForm.markAllAsTouched();
      return;
    }

    const { quantity, wasteReason } = this.wasteForm.value;
    this.confirmClick.emit({ quantity: quantity!, wasteReason: wasteReason! });
  }
}
