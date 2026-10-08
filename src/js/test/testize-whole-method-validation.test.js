import './importer.js';
import { spawnSync } from 'child_process';
import path from 'path';
const source = 'class Parcel { constructor() { this.data = 7; this.link = null; } cut() {} }';
beforeEach(() => {
    __$__.Testize.storedCallArguments = {};
    __$__.Testize.storedTest = {};
    __$__.Testize.storedActualGraph = {};
    __$__.Testize.callParenthesisPos = {};
    __$__.Testize.callMethodNameByLabel = {};
    __$__.editor.getValue = () => source;
    globalThis.jQuery = { extend: (_deep, _target, value) => JSON.parse(JSON.stringify(value)) };
});
function capture() {
    const Parcel = new Function(`${source}; return Parcel;`)();
    const a = new Parcel(), b = new Parcel();
    Object.setProperty(a, '__id', 'a');
    Object.setProperty(b, '__id', 'b');
    a.link = b; b.link = a; a.unset = undefined;
    __$__.Testize.storeCallArguments('call', 'ctx', [], a, [a, b]);
    __$__.Testize.storeValidationReturn('call', 'ctx', undefined);
    return { a, b, snapshot: __$__.Testize.storedCallArguments.call.ctx.validation };
}
function installTest(snapshot) {
    __$__.Testize.storedTest = { call: { ctx: {
        validation: snapshot, methodName: 'cut',
        operations: [{ editType: 'deleteEdge', from: 'a', to: 'b', label: 'link' }],
        testData: { nodes: [{ id: 'a', label: 'Parcel' }, { id: 'b', label: 'Parcel' }], edges: [] },
    } } };
}
test('captures immutable typed pre-state with aliases, cycles and undefined independently of display graphs', () => {
    const { a, snapshot } = capture(); a.data = 99;
    expect(snapshot.example.objects[0].fields).toEqual({ data: 7, link: { ref: 'b' }, unset: { undefined: true } });
    expect(snapshot.example.objects[1].fields.link).toEqual({ ref: 'a' });
    expect(snapshot.example.returnValue).toEqual({ undefined: true });
    expect(snapshot.classes[0].source).toBe(source);
    expect(snapshot.classes[0].referenceFields).toEqual(['link']);
});
test('sends captured state through the payload builder and passes the real Node validator', async () => {
    installTest(capture().snapshot);
    const dispatch = jest.spyOn(__$__.Testize, 'dispatchSynthesisRequest').mockResolvedValue(null);
    __$__.Testize.synthesize(); await Promise.resolve();
    const request = dispatch.mock.calls[0][0];
    expect(request.validation.version).toBe(1);
    const output = spawnSync(process.execPath, [path.resolve(__dirname, '../../../../scripts/validate_method.mjs')], {
        input: JSON.stringify({ request, response: { code: [], composed_method_code: 'cut() { this.link = null; }' }, taskNames: [] }), encoding: 'utf8'
    });
    expect(output.status).toBe(0);
    expect(JSON.parse(output.stdout).status).toBe('passed');
    dispatch.mockRestore();
});
test('blocks unverified and failed responses before any editor mutation', async () => {
    installTest(capture().snapshot);
    const replace = jest.spyOn(__$__.Testize, 'replaceMethodDefinitionSource').mockReturnValue(true);
    const insert = jest.fn(); __$__.editor.session.insert = insert;
    for (const validation of [undefined, { status: 'failed', checked_demonstrations: 0 }, { status: 'passed', checked_demonstrations: 0 }]) {
        const dispatch = jest.spyOn(__$__.Testize, 'dispatchSynthesisRequest').mockResolvedValue({ composed_method_code: 'cut() {}', code: ['helper() {}'], validation });
        __$__.Testize.synthesize(); await Promise.resolve();
        expect(replace).not.toHaveBeenCalled(); expect(insert).not.toHaveBeenCalled(); dispatch.mockRestore();
    }
    replace.mockRestore();
});
test('rejects stale source and a heap already mutated by the old method', () => {
    const { a, b, snapshot } = capture();
    __$__.editor.getValue = () => source + '\n// changed';
    expect(__$__.Testize.validationPayload([{ operations: [] }], [snapshot]).error).toMatch(/stale/);
    __$__.editor.getValue = () => source;
    __$__.Testize.storeCallArguments('call', 'ctx', [], a, [a, b]); a.data = 88;
    __$__.Testize.storeValidationReturn('call', 'ctx', undefined);
    expect(__$__.Testize.storedCallArguments.call.ctx.validation.error).toMatch(/changed the heap/);
});
test('rejects accessor fields without invoking getters', () => {
    const { a, b } = capture(); const getter = jest.fn(() => 2);
    Object.defineProperty(a, 'computed', { get: getter, enumerable: true });
    __$__.Testize.storeCallArguments('call', 'ctx', [], a, [a, b]);
    expect(getter).not.toHaveBeenCalled();
    expect(__$__.Testize.storedCallArguments.call.ctx.validation.error).toMatch(/ordinary data fields/);
});

test('instrumentation captures the pre-state and the return around the actual invocation', () => {
    __$__.UpdateLabelPos.Initialize();
    __$__.CallTree.Initialize();
    const instrumented = __$__.CodeInstrumentation.instrument(source + '\nconst parcel = new Parcel(); parcel.cut();');
    expect(instrumented).toMatch(/storeCallArguments\([\s\S]*?__obj,\s*__objs\)/);
    expect(instrumented).toContain('storeValidationReturn');
    let __objs = [];
    let __loopLabels = ['main'];
    let checkpoint = () => {};
    eval(instrumented);
    const captures = Object.values(__$__.Testize.storedCallArguments).flatMap(Object.values);
    expect(captures.some(entry => entry.validation?.example?.returnValue?.undefined === true)).toBe(true);
});

test('a verified response replaces the method, but a source change during synthesis does not', async () => {
    installTest(capture().snapshot);
    const replace = jest.spyOn(__$__.Testize, 'replaceMethodDefinitionSource').mockReturnValue(true);
    const dispatch = jest.spyOn(__$__.Testize, 'dispatchSynthesisRequest').mockResolvedValue({ composed_method_code: 'cut() { this.link = null; }', code: [], validation: { status: 'passed', checked_demonstrations: 1 } });
    __$__.Testize.synthesize(); await Promise.resolve();
    expect(replace).toHaveBeenCalledTimes(1);
    __$__.Testize.synthesize();
    __$__.editor.getValue = () => source + '\n// changed';
    await Promise.resolve();
    expect(replace).toHaveBeenCalledTimes(1);
    replace.mockRestore(); dispatch.mockRestore();
});
