import { expect, test } from 'vitest';
import { Vector } from './Vector';

test('Vector addition', () => {
    const v1 = new Vector(1, 2);
    const v2 = new Vector(3, 4);
    v1.add(v2);
    expect(v1.x).toBe(4);
    expect(v1.y).toBe(6);
});

test('Vector subtraction', () => {
    const v1 = new Vector(5, 5);
    const v2 = new Vector(2, 3);
    const result = Vector.sub(v1, v2);
    expect(result.x).toBe(3);
    expect(result.y).toBe(2);
});
