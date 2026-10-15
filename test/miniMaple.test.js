import {MiniMaple} from "../src/miniMaple";

let maple;

beforeEach(() => {
    maple = new MiniMaple();
});

describe('examples from the README', () => {
    test('4*x^3, x => 12*x^2', () => {
        expect(maple.diff('4*x^3', 'x')).toEqual('12*x^2');
    });

    test('4*x^3, y => 0', () => {
        expect(maple.diff('4*x^3', 'y')).toEqual('0');
    });

    test('4*x^3-x^2, x => 12*x^2-2*x', () => {
        expect(maple.diff('4*x^3-x^2', 'x')).toEqual('12*x^2-2*x');
    });
});

describe('single terms', () => {
    test('constant', () => {
        expect(maple.diff('5', 'x')).toEqual('0');
    });

    test('bare variable', () => {
        expect(maple.diff('x', 'x')).toEqual('1');
    });

    test('other bare variable', () => {
        expect(maple.diff('y', 'x')).toEqual('0');
    });

    test('negative coefficient', () => {
        expect(maple.diff('-3*x^2', 'x')).toEqual('-6*x');
    });

    test('minus variable', () => {
        expect(maple.diff('-x', 'x')).toEqual('-1');
    });

    test('unit coefficient is not printed', () => {
        expect(maple.diff('x^2', 'x')).toEqual('2*x');
    });

    test('coefficient 1 after differentiation', () => {
        expect(maple.diff('x^3', 'x')).toEqual('3*x^2');
    });

    test('exponent 0', () => {
        expect(maple.diff('4*x^0', 'x')).toEqual('0');
    });

    test('exponent 1', () => {
        expect(maple.diff('4*x', 'x')).toEqual('4');
    });

    test('zero coefficient', () => {
        expect(maple.diff('0*x^3', 'x')).toEqual('0');
    });
});

describe('polynomials', () => {
    test('sum of terms', () => {
        expect(maple.diff('2*x^2-x-2', 'x')).toEqual('4*x-1');
    });

    test('other variable is treated as a constant factor', () => {
        expect(maple.diff('3*x^2+4*y^3', 'x')).toEqual('6*x');
    });

    test('other variable is treated as a constant, diff by it', () => {
        expect(maple.diff('3*x^2+4*y^3', 'y')).toEqual('12*y^2');
    });

    test('product of two different variables is not allowed', () => {
        expect(() => maple.diff('3*x^2*y', 'x')).toThrow();
    });

    test('terms cancelled by differentiation', () => {
        expect(maple.diff('x^2-x^2+5*x', 'x')).toEqual('5');
    });

    test('repeated variable in one term', () => {
        expect(maple.diff('2*x*x', 'x')).toEqual('4*x');
    });
});

describe('formatting', () => {
    test('whitespace is ignored', () => {
        expect(maple.diff(' 4 * x ^ 3 - x ^ 2 ', 'x')).toEqual('12*x^2-2*x');
    });

    test('multi-digit numbers are kept', () => {
        expect(maple.diff('12*x^10', 'x')).toEqual('120*x^9');
    });

    test('coefficient times coefficient', () => {
        expect(maple.diff('2*3*x^2', 'x')).toEqual('12*x');
    });
});

describe('errors', () => {
    test('division is not allowed', () => {
        expect(() => maple.diff('4/x', 'x')).toThrow();
    });

    test('parentheses are not allowed', () => {
        expect(() => maple.diff('(x+1)*x', 'x')).toThrow();
    });

    test('function call is not allowed', () => {
        expect(() => maple.diff('sin(x)', 'x')).toThrow();
    });

    test('unsupported operator is not allowed', () => {
        expect(() => maple.diff('x%2', 'x')).toThrow();
    });

    test('empty expression is not allowed', () => {
        expect(() => maple.diff('', 'x')).toThrow();
    });

    test('dangling operator is not allowed', () => {
        expect(() => maple.diff('x+', 'x')).toThrow();
    });

    test('malformed exponent is not allowed', () => {
        expect(() => maple.diff('x^x', 'x')).toThrow();
    });

    test('non-string expression is not allowed', () => {
        expect(() => maple.diff(42, 'x')).toThrow();
    });

    test('non-string symbol is not allowed', () => {
        expect(() => maple.diff('x', 1)).toThrow();
    });

    test('identifiers must be single letters', () => {
        expect(() => maple.diff('4*xy^2', 'x')).toThrow();
    });
});
