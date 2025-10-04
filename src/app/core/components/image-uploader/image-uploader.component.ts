import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss',
})
export class ImageUploaderComponent {
  existingImage = input<string | null>();

  selectedImage = signal<File | null>(null);
  imageUrl = signal<string | null>(null);
  isDragging = signal<boolean>(false);

  backendUrl = environment.apiUrl;

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  fileOutput = output<File>();

  handleFileUpload(event: Event) {
    const files = (event.target as HTMLInputElement).files;

    if (!files?.item(0)) return;
    this.selectedImage.set(files?.item(0));
    this.readAndPreviewImage();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Check if it's an image
      if (file.type.startsWith('image/')) {
        this.selectedImage.set(file);
        this.readAndPreviewImage();

        // Update the file input
        const input = this.fileInput()?.nativeElement;
        if (input) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          input.files = dataTransfer.files;
        }
      } else {
        alert('Please drop an image file');
      }
    }
  }

  readAndPreviewImage() {
    const reader = new FileReader();
    if (!this.selectedImage()) return;

    reader.onload = (e) => {
      const url = e.target?.result as string;
      this.imageUrl.set(url);
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
