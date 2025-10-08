import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'snakeToTitle',
})
export class SnakeToTitlePipe implements PipeTransform {
  transform(value: string): unknown {
    return value
      .split('_')
      .map((val) => val.charAt(0).toUpperCase() + val.slice(1))
      .join(' ');
  }
}
