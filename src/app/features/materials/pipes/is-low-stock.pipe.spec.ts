import { IsLowStockPipe } from './is-low-stock.pipe';

describe('IsLowStockPipe', () => {
  it('create an instance', () => {
    const pipe = new IsLowStockPipe();
    expect(pipe).toBeTruthy();
  });
});
