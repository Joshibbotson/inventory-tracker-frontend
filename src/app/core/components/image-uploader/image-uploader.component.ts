import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-uploader',
  imports: [CommonModule, FormsModule],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss',
})
export class ImageUploaderComponent {
  selectedImage = signal<File | null>(null);
  imageUrl = signal<string | null>(null);

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  fileOutput = output<File>();

  handleFileUpload(event: Event) {
    const files = (event.target as HTMLInputElement).files;

    if (!files?.item(0)) return;
    this.selectedImage.set(files?.item(0));
    this.readAndPreviewImage();
  }

  readAndPreviewImage() {
    const reader = new FileReader();
    if (!this.selectedImage()) return;
    console.log('file:', this.selectedImage());

    reader.onload = (e) => {
      const url = e.target?.result as string;
      this.imageUrl.set(url);
      console.log('image url:', url);
    };

    reader.readAsDataURL(this.selectedImage()!);

    this.fileOutput.emit(this.selectedImage()!);
  }

  resetSelectedImage() {
    this.selectedImage.set(null);
    this.imageUrl.set(null);

    const input = this.fileInput()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }
}
