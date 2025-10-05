import { Component, input, output } from '@angular/core';
import { ProductionBatch } from '../../services/production.service';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-reversal-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reversal-modal.component.html',
  styleUrl: './reversal-modal.component.scss',
})
export class ReversalModalComponent {
  reversalBatch = input.required<ProductionBatch>();
  reversalCheck = input.required<{
    canReverse: boolean;
    reason?: string;
  } | null>();

  reversing = input<boolean>();

  cancelClick = output<void>();
  confirmClick = output<{ quantity: number; reversalReason: string }>();

  reversalForm = new FormGroup({
    quantity: new FormControl(0, [Validators.required, Validators.min(1)]),
    reversalReason: new FormControl('', Validators.required),
  });

  maxAllowed!: number;
  prevQuantity = 0;
  reversalAttempted = false;

  ngOnInit(): void {
    this.maxAllowed =
      this.reversalBatch().quantity -
      ((this.reversalBatch().wastedQuantity || 0) +
        (this.reversalBatch().reversedQuantity || 0));

    this.reversalForm.get('quantity')!.setValue(this.maxAllowed);
    this.prevQuantity = this.maxAllowed;

    // Add max validator dynamically
    this.reversalForm
      .get('quantity')!
      .addValidators(Validators.max(this.maxAllowed));

    // Clamp input if over max or under min
    this.reversalForm.get('quantity')!.valueChanges.subscribe((val) => {
      const num = Number(val);
      if (num > this.maxAllowed) {
        this.reversalForm.get('quantity')!.setValue(this.maxAllowed, {
          emitEvent: false,
        });
      } else if (num < 1) {
        this.reversalForm.get('quantity')!.setValue(1, { emitEvent: false });
      }
    });
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (value > this.maxAllowed)
      this.quantity.setValue(Number(this.prevQuantity));

    this.prevQuantity = Number(input.value);
    this.quantity.setValue(Number(input.value));
  }

  get quantity() {
    return this.reversalForm.get('quantity')!;
  }

  get reversalReason() {
    return this.reversalForm.get('wasteReason')!;
  }
  getProductName(product: any): string {
    if (typeof product === 'object' && product?.name) {
      return product.name;
    }
    return 'Unknown Product';
  }

  cancelReversal() {
    this.cancelClick.emit();
  }

  confirmReversal() {
    if (this.reversalForm.invalid) {
      this.reversalForm.markAllAsTouched();
      return;
    }

    const { quantity, reversalReason } = this.reversalForm.value;
    this.confirmClick.emit({
      quantity: quantity!,
      reversalReason: reversalReason!,
    });
  }
}
