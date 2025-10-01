import { Component, input, output } from '@angular/core';
import { Pagination } from '../../types/Pagination';

@Component({
  selector: 'app-pagination-footer',
  imports: [],
  templateUrl: './pagination-footer.component.html',
  styleUrl: './pagination-footer.component.scss',
})
export class PaginationFooterComponent {
  pagination = input.required<Pagination>();

  handlePageClick = output<number>();
  handlePageSizeChange = output<number>();

  goToPage(page: number) {
    this.handlePageClick.emit(page);
  }

  /**
   * Calculate total number of pages
   */
  totalPages(): number {
    const total = this.pagination().total;
    const pageSize = this.pagination().pageSize;
    return Math.ceil(total / pageSize);
  }

  /**
   * Get the starting item number for current page
   */
  getStartItem(): number {
    const { page, pageSize, total } = this.pagination();
    if (total === 0) return 0;
    return (page - 1) * pageSize + 1;
  }

  /**
   * Get the ending item number for current page
   */
  getEndItem(): number {
    const { page, pageSize, total } = this.pagination();
    const end = page * pageSize;
    return Math.min(end, total);
  }

  /**
   * Generate array of page numbers with ellipsis for smart pagination
   * Shows: [1] ... [4] [5] [6] ... [10]
   */
  getPageNumbers(): (number | string)[] {
    const current = this.pagination().page;
    const total = this.totalPages();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  }

  /**
   * Change page size (items per page)
   */
  changePageSize(newSize: number) {
    this.handlePageSizeChange.emit(newSize);
  }
}
