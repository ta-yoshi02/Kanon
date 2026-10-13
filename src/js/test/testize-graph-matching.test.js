import './importer.js';

const literal = { background: 'white', border: 'white' };
const object = (id, label = 'C') => ({ id, label });
const value = (id, label, type = 'number') => ({ id, label, type, color: literal });
const edge = (from, label, to) => ({ from, label, to });

// r.copyTo(): d.val = this.val, demonstrated by pointing d's val edge at r's literal node.
const actual = (dVal = '100', dType = 'number') => ({
    nodes: [object('main-new1'), value('main-new1-val', '100'), object('main-new2'), value('main-new2-val', dVal, dType)],
    edges: [
        edge('__Variable-r', 'r', 'main-new1'), edge('__Variable-d', 'd', 'main-new2'),
        edge('main-new1', 'val', 'main-new1-val'), edge('main-new1', 'next', 'main-new2'),
        edge('main-new2', 'val', 'main-new2-val'),
    ],
});
const expected = () => ({
    nodes: [object('main-new1'), value('main-new1-val', '100'), object('main-new2'), value('main-new2-val', '2')],
    edges: [
        edge('__Variable-r', 'r', 'main-new1'), edge('__Variable-d', 'd', 'main-new2'),
        edge('main-new1', 'val', 'main-new1-val'), edge('main-new1', 'next', 'main-new2'),
        edge('main-new2', 'val', 'main-new1-val'),
    ],
});

beforeEach(() => {
    globalThis.jQuery = { extend: (_deep, _target, data) => JSON.parse(JSON.stringify(data)) };
});

describe('matching', () => {
    test('a copied value matches the literal it was copied from', () => {
        expect(__$__.Testize.matching(actual(), expected())).toBe(true);
    });

    test('literals still have to hold the same value', () => {
        expect(__$__.Testize.matching(actual('2'), expected())).toBe(false);
    });

    // Labels are strings, so 100 and "100" share a label; only the type tells them apart.
    test('a copied value of another type does not match', () => {
        expect(__$__.Testize.matching(actual('100', 'string'), expected())).toBe(false);
    });

    test('a literal kept in place must keep its type too', () => {
        const same = expected();
        same.edges = same.edges.map(e => (e.from === 'main-new2' ? edge('main-new2', 'val', 'main-new2-val') : e));
        same.nodes = same.nodes.map(n => (n.id === 'main-new2-val' ? value('main-new2-val', '100', 'number') : n));
        expect(__$__.Testize.matching(actual('100', 'number'), same)).toBe(true);
        expect(__$__.Testize.matching(actual('100', 'string'), same)).toBe(false);
    });

    test('objects are still compared by identity', () => {
        const other = expected();
        other.nodes.push(object('main-new3'));
        other.edges = other.edges.map(e => (e.from === 'main-new1' && e.label === 'next' ? edge('main-new1', 'next', 'main-new3') : e));
        expect(__$__.Testize.matching(actual(), other)).toBe(false);
    });
});

describe('testAndOverride', () => {
    afterEach(() => jest.restoreAllMocks());

    // A failed comparison reflects the demonstration again on the state the method produced, so a
    // correct run that is judged a failure would be edited a second time.
    test('a correct value copy is not reflected again', () => {
        const toDataSet = graph => {
            const nodes = Object.fromEntries(graph.nodes.map(n => [n.id, n]));
            return { nodes: { _data: nodes, get: id => nodes[id] }, edges: { _data: Object.fromEntries(graph.edges.map((e, i) => [i, e])) } };
        };
        __$__.Testize.storedTest = { call: { ctx: { testData: toDataSet(expected()), operations: [] } } };
        __$__.Testize.storedActualGraph = { call: { ctx: actual() } };
        const reflect = jest.spyOn(__$__.Testize, 'applyMoldEdits');
        const override = jest.spyOn(__$__.Testize, 'override').mockReturnValue({ newObjects: [], variableReferences: { fallback: true } });
        expect(__$__.Testize.testAndOverride([], {}, undefined, 'call', 'ctx', false, {})).toEqual({ newObjects: [], variableReferences: {} });
        expect(__$__.Testize.storedTest.call.ctx.passed).toBe(true);
        expect(reflect).not.toHaveBeenCalled();
        expect(override).not.toHaveBeenCalled();
    });
});
