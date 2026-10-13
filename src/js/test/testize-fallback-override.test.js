import './importer.js';

// p.attach() demonstrated as `this.child = new Box()`, where `new Box()` cannot be evaluated, so the
// display-graph fallback (override) reflects it.
const dataSet = (items, key) => {
    const data = Object.fromEntries(items.map((item, i) => [key(item, i), item]));
    return { _data: data, get: id => data[id] };
};
const install = (variableTarget) => {
    const nodes = [{ id: 'main-new1', label: 'Box' }, { id: '__temp1', label: 'Box' }];
    const edges = [{ from: '__Variable-p', label: 'p', to: variableTarget }, { from: 'main-new1', label: 'child', to: '__temp1' }];
    __$__.Testize.storedTest = { call: { ctx: { testData: { nodes: dataSet(nodes, n => n.id), edges: dataSet(edges, (_, i) => i) } } } };
};

describe('override', () => {
    class Box { constructor(v) { this.v = v.value; } }
    const receiver = () => {
        const p = Object.create(Box.prototype);
        Object.setProperty(p, '__id', 'main-new1');
        p.v = 1;
        return p;
    };

    // The caller assigns every returned variable with `eval(name + ' = __object')`, which throws
    // for a const binding and stops the run, so an unchanged variable must not be returned.
    test('a variable the demonstration leaves pointing at the same object is not reassigned', () => {
        install('main-new1');
        const p = receiver();
        const { newObjects, variableReferences } = __$__.Testize.override([p], { p, this: p }, undefined, 'call', 'ctx', { Box });
        expect(Object.keys(variableReferences)).not.toContain('p');
        expect(newObjects).toHaveLength(1);
        expect(p.child).toBe(newObjects[0]);
    });

    test('a variable the demonstration points elsewhere is still reassigned', () => {
        install('__temp1');
        const p = receiver();
        const { newObjects, variableReferences } = __$__.Testize.override([p], { p, this: p }, undefined, 'call', 'ctx', { Box });
        expect(variableReferences.p).toBe(newObjects[0]);
    });
});
