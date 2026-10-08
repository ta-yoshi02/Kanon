import './importer.js';
import { spawnSync } from 'child_process';
import path from 'path';
const source = 'class Parcel { constructor() { this.data = 7; this.link = null; } cut() {} }';
const validator = path.resolve(__dirname, '../../../../scripts/validate_method.mjs');
let warn;
beforeEach(() => {
    __$__.Testize.storedCallArguments = {};
    __$__.Testize.storedTest = {};
    __$__.Testize.storedActualGraph = {};
    __$__.Testize.callParenthesisPos = {};
    __$__.Testize.callMethodNameByLabel = {};
    __$__.editor.getValue = () => source;
    globalThis.jQuery = { extend: (_deep, _target, value) => JSON.parse(JSON.stringify(value)) };
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());
function capture() {
    const Parcel = new Function(`${source}; return Parcel;`)();
    const a = new Parcel(), b = new Parcel();
    Object.setProperty(a, '__id', 'a');
    Object.setProperty(b, '__id', 'b');
    a.link = b; b.link = a; a.unset = undefined;
    __$__.Testize.storeCallArguments('call', 'ctx', [], a, [a, b]);
    __$__.Testize.confirmValidationPreState('call', 'ctx');
    return { a, b, snapshot: __$__.Testize.storedCallArguments.call.ctx.validation };
}
function installTest(snapshot, methodName = 'cut') {
    __$__.Testize.storedTest = { call: { ctx: {
        validation: snapshot, methodName,
        operations: [{ editType: 'deleteEdge', from: 'a', to: 'b', label: 'link' }],
        testData: { nodes: [{ id: 'a', label: 'Parcel' }, { id: 'b', label: 'Parcel' }], edges: [] },
    } } };
}
// A minimal stand-in for the ACE editor that applies row/column replacements to a string.
function useEditor(initial) {
    let text = initial;
    const offset = (row, column) => text.split('\n').slice(0, row).reduce((sum, line) => sum + line.length + 1, 0) + column;
    __$__.Range = class { constructor(...bounds) { this.bounds = bounds; } };
    __$__.editor.getValue = () => text;
    __$__.editor.getCursorPosition = () => ({ row: 0, column: 0 });
    __$__.editor.session.insert = jest.fn();
    __$__.editor.session.replace = (range, replacement) => {
        const [sr, sc, er, ec] = range.bounds;
        text = text.slice(0, offset(sr, sc)) + replacement + text.slice(offset(er, ec));
    };
    return { text: () => text, edit: next => { text = next; } };
}
async function synthesizeWith(response) {
    const dispatch = jest.spyOn(__$__.Testize, 'dispatchSynthesisRequest').mockResolvedValue(response);
    __$__.Testize.synthesize();
    await Promise.resolve(); await Promise.resolve();
    dispatch.mockRestore();
}
const passed = { status: 'passed', checked_demonstrations: 1 };

test('captures immutable typed pre-state with aliases, cycles and undefined independently of display graphs', () => {
    const { a, snapshot } = capture(); a.data = 99;
    expect(snapshot.example.objects[0].fields).toEqual({ data: 7, link: { ref: 'b' }, unset: { undefined: true } });
    expect(snapshot.example.objects[1].fields.link).toEqual({ ref: 'a' });
    expect(snapshot.example).not.toHaveProperty('returnValue');
    // Field kinds are not guessed from the values that happened to be observed.
    expect(snapshot.classes).toEqual([{ name: 'Parcel', source }]);
});
test('sends captured state through the payload builder to the real Node validator', async () => {
    installTest(capture().snapshot);
    const dispatch = jest.spyOn(__$__.Testize, 'dispatchSynthesisRequest').mockResolvedValue(null);
    __$__.Testize.synthesize(); await Promise.resolve();
    const request = dispatch.mock.calls[0][0];
    dispatch.mockRestore();
    expect(request.validation.version).toBe(2);
    const run = code => {
        const output = spawnSync(process.execPath, [validator], {
            input: JSON.stringify({ request, response: { code: [], composed_method_code: code }, taskNames: [] }), encoding: 'utf8'
        });
        expect(output.status).toBe(0);
        return JSON.parse(output.stdout).status;
    };
    expect(run('cut() { this.link = null; }')).toBe('passed');
    // No return edit was demonstrated, so returning the receiver contradicts the demonstration.
    expect(run('cut() { this.link = null; return this; }')).toBe('failed');
    expect(run('cut() { delete this.link; }')).toBe('failed');
});
test('blocks unverified and failed responses before any editor mutation', async () => {
    installTest(capture().snapshot);
    const editor = useEditor(source);
    for (const validation of [undefined, { status: 'failed', checked_demonstrations: 0 }, { status: 'passed', checked_demonstrations: 0 }]) {
        await synthesizeWith({ composed_method_code: 'cut() {}', code: ['helper() {}'], validation });
        expect(editor.text()).toBe(source);
        expect(__$__.editor.session.insert).not.toHaveBeenCalled();
    }
});
test('rejects stale source and a heap already mutated by the old method', () => {
    const { a, b, snapshot } = capture();
    __$__.editor.getValue = () => source + '\n// changed';
    expect(__$__.Testize.validationPayload([{ operations: [] }], [snapshot]).error).toMatch(/stale/);
    __$__.editor.getValue = () => source;
    __$__.Testize.storeCallArguments('call', 'ctx', [], a, [a, b]); a.data = 88;
    __$__.Testize.confirmValidationPreState('call', 'ctx');
    expect(__$__.Testize.storedCallArguments.call.ctx.validation.error).toMatch(/changed the heap/);
});
test('rejects accessor fields without invoking getters', () => {
    const { a, b } = capture(); const getter = jest.fn(() => 2);
    Object.defineProperty(a, 'computed', { get: getter, enumerable: true });
    __$__.Testize.storeCallArguments('call', 'ctx', [], a, [a, b]);
    expect(getter).not.toHaveBeenCalled();
    expect(__$__.Testize.storedCallArguments.call.ctx.validation.error).toMatch(/ordinary data fields/);
});

test('instrumentation captures the pre-state and re-checks it after the actual invocation', () => {
    __$__.UpdateLabelPos.Initialize();
    __$__.CallTree.Initialize();
    const instrumented = __$__.CodeInstrumentation.instrument(source + '\nconst parcel = new Parcel(); parcel.cut();');
    expect(instrumented).toMatch(/storeCallArguments\([\s\S]*?__obj,\s*__objs\)/);
    expect(instrumented).toContain('confirmValidationPreState');
    let __objs = [];
    let __loopLabels = ['main'];
    let checkpoint = () => {};
    eval(instrumented);
    const captures = Object.values(__$__.Testize.storedCallArguments).flatMap(Object.values);
    expect(captures.some(entry => entry.validation && !entry.validation.error)).toBe(true);
});

test('a verified response is applied as validated and the applied class reproduces the demonstration', async () => {
    installTest(capture().snapshot);
    const editor = useEditor(source);
    await synthesizeWith({ composed_method_code: 'cut() { this.link = this.cutTarget(); }', code: ['cutTarget() { return null; }'], validation: passed });
    expect(editor.text()).toContain(__$__.Testize.generatedHelperMarker);
    // Re-execute the edited program on the demonstrated pre-state.
    const Parcel = new Function(`${editor.text()}; return Parcel;`)();
    const a = new Parcel(), b = new Parcel(), outside = { alias: b };
    a.link = b; b.link = a;
    a.cut();
    expect(Object.hasOwn(a, 'link') && a.link === null).toBe(true);
    expect(b.link).toBe(a);
    expect(outside.alias).toBe(b);
});
test('a source change during synthesis prevents application', async () => {
    installTest(capture().snapshot);
    const editor = useEditor(source);
    const dispatch = jest.spyOn(__$__.Testize, 'dispatchSynthesisRequest').mockResolvedValue({ composed_method_code: 'cut() { this.link = null; }', code: [], validation: passed });
    __$__.Testize.synthesize();
    editor.edit(source + '\n// changed');
    await Promise.resolve(); await Promise.resolve();
    dispatch.mockRestore();
    expect(editor.text()).toBe(source + '\n// changed');
});
test('a helper that would overwrite a user-written method is refused', async () => {
    const userSource = 'class Parcel { constructor() { this.data = 7; this.link = null; } cutTarget() { return 1; } cut() {} }';
    __$__.editor.getValue = () => userSource;
    const { snapshot } = capture();
    snapshot.source = userSource;
    installTest(snapshot);
    const editor = useEditor(userSource);
    await synthesizeWith({ composed_method_code: 'cut() { this.link = this.cutTarget(); }', code: ['cutTarget() { return null; }'], validation: passed });
    expect(editor.text()).not.toContain('return null');
    expect(warn.mock.calls.flat().join(' ')).toMatch(/did not generate/);
});

describe('buildValidatedSource', () => {
    const build = (text, helpers = []) => __$__.Testize.buildValidatedSource(text, 'Parcel', 'cut', 'cut() { this.link = null; }', helpers);
    test('replaces a helper inserted by an earlier synthesis', () => {
        const previous = build(source, ['helper() { return 1; }']).source;
        const next = build(previous.replace('this.link = null;', ''), ['helper() { return 2; }']);
        expect(next.error).toBeUndefined();
        expect(next.source).toContain('return 2');
        expect(next.source).not.toContain('return 1');
        expect(next.source.split(__$__.Testize.generatedHelperMarker).length).toBe(2);
    });
    test('refuses ambiguous or unusual targets', () => {
        expect(build(source + '\nclass Parcel {}').error).toMatch(/exactly once/);
        expect(build('class Parcel { get cut() { return 1; } }').error).toMatch(/ordinary method/);
        expect(build('class Parcel { static cut() {} }').error).toMatch(/ordinary method/);
        expect(build('class Other { cut() {} }').error).toMatch(/exactly once/);
        expect(build(source, ['cut() {}']).error).toMatch(/duplicate/);
        expect(build(source, ['x = 1']).error).toMatch(/Invalid/);
    });
    test('demonstrations of different methods are not applied', async () => {
        installTest(capture().snapshot, 'cut');
        __$__.Testize.storedTest.call.other = { ...__$__.Testize.storedTest.call.ctx, methodName: 'other' };
        __$__.Testize.storedCallArguments.call.other = __$__.Testize.storedCallArguments.call.ctx;
        const editor = useEditor(source);
        await synthesizeWith({ composed_method_code: 'cut() { this.link = null; }', code: [], validation: { status: 'passed', checked_demonstrations: 2 } });
        expect(editor.text()).toBe(source);
        expect(warn.mock.calls.flat().join(' ')).toMatch(/different methods/);
    });
});
