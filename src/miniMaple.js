class Symbol {
    constructor(name) {
        this.name = name;
    }

    diff(sym) {
        return this.name === sym.name ? Integer.ONE : Integer.ZERO;
    }

    toString() {
        return this.name;
    }
}

class Integer {
    constructor(value) {
        this.value = value;
    }

    diff() {
        return Integer.ZERO;
    }

    toString() {
        return String(this.value);
    }
}

Integer.ZERO = new Integer(0);
Integer.ONE = new Integer(1);

// Одночлен вида k * s ^ p
class Term {
    constructor(coef, sym, exp) {
        this.coef = coef;
        this.sym = sym;
        this.exp = exp;
    }

    diff(sym) {
        if (this.exp === 0 || this.sym.name !== sym.name) {
            return Integer.ZERO;
        }
        return new Term(this.coef * this.exp, this.sym, this.exp - 1);
    }

    toString() {
        if (this.coef === 0) {
            return '';
        }
        let head = '';
        if (this.coef !== 1 || this.exp === 0) {
            head = String(this.coef);
        }
        if (this.exp === 0) {
            return head;
        }
        const power = this.exp === 1 ? this.sym.name : `${this.sym.name}^${this.exp}`;
        return head === '' ? power : `${head}*${power}`;
    }
}

// Ошибка для всех выражений, которые MiniMaple не может обработать
class MiniMapleError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MiniMapleError';
    }
}

const TOKEN = /^(?:\s+)|(?:(\d+))|(?:([A-Za-z]))|(?:([+\-*^]))/;

// Разбивает строку на токены: числа, переменные и операторы
function tokenize(text) {
    const tokens = [];
    let rest = text;
    while (rest.length > 0) {
        const match = TOKEN.exec(rest);
        if (match === null) {
            throw new MiniMapleError(`Unexpected character in expression: '${rest[0]}'`);
        }
        if (match[1] !== undefined) {
            tokens.push(new Integer(Number(match[1])));
        } else if (match[2] !== undefined) {
            tokens.push(new Symbol(match[2]));
        } else if (match[3] !== undefined) {
            tokens.push(match[3]);
        }
        rest = rest.slice(match[0].length);
    }
    return tokens;
}

// Рекурсивный спуск: сумма -> произведение -> степень -> атом
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    peek() {
        return this.tokens[this.pos];
    }

    next() {
        return this.tokens[this.pos++];
    }

    parse() {
        const terms = this.parseSum();
        if (this.pos !== this.tokens.length) {
            throw new MiniMapleError(`Unexpected token: '${this.peek()}'`);
        }
        return terms;
    }

    parseSum() {
        const terms = [];
        let sign = 1;
        if (this.peek() === '-') {
            this.next();
            sign = -1;
        } else if (this.peek() === '+') {
            throw new MiniMapleError("Expression cannot start with '+'");
        }
        terms.push(this.signed(sign, this.parseProduct()));
        while (this.peek() === '+' || this.peek() === '-') {
            const op = this.next();
            terms.push(this.signed(op === '-' ? -1 : 1, this.parseProduct()));
        }
        return terms;
    }

    signed(sign, term) {
        const normalized = asTerm(term);
        return sign === -1 ? new Term(-normalized.coef, normalized.sym, normalized.exp) : normalized;
    }

    parseProduct() {
        let term = this.parsePower();
        while (this.peek() === '*') {
            this.next();
            term = multiply(term, this.parsePower());
        }
        return term;
    }

    parsePower() {
        const base = this.parseAtom();
        if (this.peek() === '^') {
            this.next();
            const exponent = this.peek();
            if (!(exponent instanceof Integer)) {
                throw new MiniMapleError('Exponent must be a non-negative integer');
            }
            this.next();
            if (!(base instanceof Symbol)) {
                throw new MiniMapleError('Only a variable can be raised to a power');
            }
            return new Term(1, base, exponent.value);
        }
        return base;
    }

    parseAtom() {
        const token = this.next();
        if (token === undefined) {
            throw new MiniMapleError('Unexpected end of expression');
        }
        if (token instanceof Integer || token instanceof Symbol) {
            return token;
        }
        throw new MiniMapleError(`Unexpected token: '${token}'`);
    }
}

// Любой атом — это одночлен со степенью 1, а число хранит значение в coef
function asTerm(atom) {
    if (atom instanceof Term) {
        return atom;
    }
    if (atom instanceof Symbol) {
        return new Term(1, atom, 1);
    }
    return new Term(atom.value, null, 0);
}

// Умножение: константы идут в коэффициент, степени одной переменной складываются
function multiply(left, right) {
    const a = asTerm(left);
    const b = asTerm(right);
    if (a.sym === null) {
        return new Term(a.coef * b.coef, b.sym, b.exp);
    }
    if (b.sym === null) {
        return new Term(a.coef * b.coef, a.sym, a.exp);
    }
    if (a.sym.name !== b.sym.name) {
        throw new MiniMapleError(
            `Only one variable per term is supported: '${a.sym.name}' and '${b.sym.name}'`);
    }
    return new Term(a.coef * b.coef, a.sym, a.exp + b.exp);
}

// Складывает подобные одночлены и убирает нулевые
function collect(terms) {
    const merged = new Map();
    for (const atom of terms) {
        const term = asTerm(atom);
        if (term.coef === 0) {
            continue;
        }
        const key = term.sym === null ? '' : `${term.sym.name}^${term.exp}`;
        const existing = merged.get(key);
        if (existing === undefined) {
            merged.set(key, term);
        } else {
            merged.set(key, new Term(existing.coef + term.coef, term.sym, term.exp));
        }
    }
    const kept = [...merged.values()].filter((term) => term.coef !== 0);
    if (kept.length > 1) {
        const constants = kept.filter((term) => term.sym === null);
        const variables = kept.filter((term) => term.sym !== null);
        return [...variables, ...constants];
    }
    return kept;
}

// Собирает результат в строку вида 12*x^2-2*x
function render(parts) {
    let text = '';
    for (const part of parts) {
        const piece = String(part);
        if (piece === '') {
            continue;
        }
        if (text === '') {
            text = piece;
        } else {
            text += piece.startsWith('-') ? piece : `+${piece}`;
        }
    }
    return text === '' ? '0' : text;
}

class MiniMaple {

    // Принимает многочлен строкой, например '4*x^3-x^2', и имя переменной 'x'
    diff(expr, sym) {
        if (typeof expr !== 'string') {
            throw new MiniMapleError('Expression must be a string');
        }
        if (typeof sym !== 'string' || !/^[A-Za-z]$/.test(sym)) {
            throw new MiniMapleError('Variable name must be a single letter');
        }
        const terms = new Parser(tokenize(expr)).parse();
        const derivatives = terms.map((term) => term.diff(new Symbol(sym)));
        return render(collect(derivatives));
    }
}

export { MiniMaple, Symbol, Integer, Term, MiniMapleError };
