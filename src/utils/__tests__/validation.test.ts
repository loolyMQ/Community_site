// Простой тест для проверки работоспособности тестовой среды

describe('Basic Test Suite', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle strings', () => {
    const message = 'Hello, World!';
    expect(message).toContain('Hello');
  });

  test('should handle arrays', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
  });
}); 