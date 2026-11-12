import './importer.js';

// Stand-ins for the popup's elements, enough for the manipulation handlers.
function popup() {
    const elements = {
        operation: { innerHTML: '' },
        'node-label': { value: 'stale', focus() {} },
        saveButtonForTestize: {},
        cancelButtonForTestize: {},
        isLiteral: { style: {} },
        checkboxForLiteral: { checked: true },
        'network-popUp': { style: {} },
    };
    globalThis.document = { getElementById: id => elements[id] };
    return elements;
}

afterEach(() => { delete globalThis.document; });

// Seen in a real browser: after adding a literal, the next Add Node popup kept "Literal"
// checked, so a node labelled Node was recorded as the string literal "Node".
test('Add Node opens with Literal unchecked whatever the previous node was', () => {
    const elements = popup();
    __$__.Testize.network.options.manipulation.addNode({ x: 0, y: 0 }, () => {});
    expect(elements.checkboxForLiteral.checked).toBe(false);
    expect(elements['node-label'].value).toBe('');
    expect(elements['network-popUp'].style.display).toBe('block');
});
