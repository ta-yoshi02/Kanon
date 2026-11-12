// Drives the built Pages site (dist/) in a real Chromium: demonstrations are recorded through the
// Kanon UI with real mouse and keyboard input, synthesis runs in the page's Worker, and the result
// must be validated and applied to the editor. A second run blocks the synthesis Worker's chunk and
// checks that the failure is recorded and the editor is left alone.
//
// Script-only actions, which do not change what is demonstrated: setting the program in the editor,
// moving nodes apart on the canvas, and reading state. Usage: node scripts/verify-refsyn-ui.mjs [dist]
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(process.argv[2] ?? join(rootDir, "dist"));
const vendorDir = join(distDir, "src/js/vendor");

const source = `class Node {
    constructor(v) {
        this.next = null;
        this.val = v;
    }
    insert(i, arg) {
    }
}

let list = new Node(39);
list.next = new Node(27);
list.next.next = new Node(53);
list.insert(0, 89);
list.insert(2, 46);
list.insert(1, 71);
`;

// The paper's insert, as recorded in Kanon on 2026-10-14. Node names are the IDs Kanon gives the
// pre-call objects; "new" is the node added in that demonstration and "value" its literal.
const demonstrations = {
    call1: { value: "89", edges: [["new", "val", "value"], ["new", "next", "main-new2"], ["main-new1", "next", "new"]] },
    call2: { value: "46", edges: [["new", "val", "value"], ["new", "next", "main-new3"], ["main-new2", "next", "new"]] },
    call3: { value: "71", edges: [["call1-new", "next", "new"], ["new", "val", "value"], ["new", "next", "main-new2"]] },
};
const expectedOperations = {
    call1: ["addNode:Node", "addNode:89", "addEdge:val", "addEdge:next", "editEdgeReference:next"],
    call2: ["addNode:Node", "addNode:46", "addEdge:val", "addEdge:next", "editEdgeReference:next"],
    call3: ["addNode:Node", "addNode:71", "editEdgeReference:next", "addEdge:val", "addEdge:next"],
};

const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
    ".json": "application/json", ".wasm": "application/wasm", ".png": "image/png", ".svg": "image/svg+xml", ".gif": "image/gif" };

function serve(blocked = new Set()) {
    const server = createServer(async (request, response) => {
        const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
        const file = join(distDir, path.endsWith("/") ? `${path}index.html` : path);
        if (!file.startsWith(distDir) || blocked.has(file)) {
            response.writeHead(404).end();
            return;
        }
        try {
            const body = await readFile(file);
            response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" }).end(body);
        } catch {
            response.writeHead(404).end();
        }
    });
    return new Promise((done) => server.listen(0, "127.0.0.1", () => done(server)));
}

async function workerChunks() {
    const files = (await readdir(vendorDir)).filter((name) => /^\d+-.*\.js$/.test(name)).map((name) => join(vendorDir, name));
    const chunks = [];
    for (const file of files) {
        if ((await readFile(file, "utf8")).includes("synthesize_browser")) chunks.push(file);
    }
    if (chunks.length === 0) throw new Error(`no synthesis Worker chunk in ${vendorDir}`);
    return chunks;
}

const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};

async function openPage(browser, server) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => globalThis.__$__?.editor && typeof globalThis.runRefsynBrowser === "function");
    await page.evaluate((text) => globalThis.__$__.editor.setValue(text, -1), source);
    await page.waitForFunction(() => Object.keys(globalThis.__$__.Testize.callParenthesisPos).length === 3);
    return { page, errors };
}

const network = (page, body, arg) => page.evaluate(body, arg);

async function pagePoint(page, id) {
    return network(page, (nodeId) => {
        const n = globalThis.__$__.Testize.network.network;
        const p = n.canvasToDOM(n.getPositions([nodeId])[nodeId]);
        const r = n.canvas.frame.canvas.getBoundingClientRect();
        return { x: r.left + p.x, y: r.top + p.y };
    }, id);
}

async function operations(page) {
    return network(page, () => (globalThis.__$__.Testize.focusedTestOperations ?? []).map((o) => ({ ...o })));
}

async function ensureEditing(page) {
    const add = page.locator("#window-for-manipulation .vis-button.vis-add");
    if (!(await add.isVisible())) {
        await page.locator("#window-for-manipulation .vis-button.vis-edit").click();
        await add.waitFor({ state: "visible" });
    }
}

async function fillPopup(page, label, literal) {
    await page.locator("#network-popUp").waitFor({ state: "visible" });
    await page.locator("#node-label").fill(label);
    if (literal !== undefined) {
        // A user checks Literal for a literal and leaves it alone otherwise, so the popup must open
        // unchecked whatever the previous node was.
        const box = page.locator("#checkboxForLiteral");
        assert(!(await box.isChecked()), `Add Node for ${label} opened with Literal checked`);
        if (literal) await box.click();
    }
    await page.locator("#saveButtonForTestize").click();
    await page.locator("#network-popUp").waitFor({ state: "hidden" });
}

async function addNode(page, label, literal, at) {
    const before = (await operations(page)).length;
    await ensureEditing(page);
    await page.locator("#window-for-manipulation .vis-button.vis-add").click();
    await page.mouse.click(at.x, at.y);
    await fillPopup(page, label, literal);
    const ops = await operations(page);
    assert(ops.length === before + 1 && ops.at(-1).editType === "addNode", `adding ${label} recorded ${JSON.stringify(ops.slice(before))}`);
    return ops.at(-1).id;
}

async function addEdge(page, from, label, to) {
    const before = (await operations(page)).length;
    await ensureEditing(page);
    await page.locator("#window-for-manipulation .vis-button.vis-connect").click();
    const a = await pagePoint(page, from);
    const b = await pagePoint(page, to);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 12 });
    await page.mouse.up();
    await fillPopup(page, label);
    const ops = await operations(page);
    assert(ops.length === before + 1, `edge ${from}.${label} -> ${to} recorded ${JSON.stringify(ops.slice(before))}`);
}

async function openDemonstration(page, call) {
    const point = await network(page, (label) => {
        const { editor, Testize } = globalThis.__$__;
        const p = Testize.callParenthesisPos[label];
        const s = editor.renderer.textToScreenCoordinates(p.start.line - 1, p.start.column + 1);
        return { x: s.pageX + 2, y: s.pageY + editor.renderer.lineHeight / 2 };
    }, call);
    await page.mouse.move(5, 880);
    await page.mouse.move(point.x, point.y, { steps: 5 });
    await page.locator("#tooltip_set").waitFor({ state: "visible" });
    await page.locator("#tooltip_set").click();
    await page.waitForFunction((label) => globalThis.__$__.Testize.selectedCallInfo?.label === label
        && globalThis.__$__.Testize.focusedTestOperations?.length === 0, call);
    await page.locator("#window-for-manipulation").waitFor({ state: "visible" });
    // Lay the pre-call objects out in a row, away from each other and from the "def var" box.
    return network(page, () => {
        const n = globalThis.__$__.Testize.network.network;
        n.fit();
        const r = n.canvas.frame.canvas.getBoundingClientRect();
        const objects = Object.values(n.body.data.nodes._data).filter((node) => node.label === "Node");
        objects.forEach((node, k) => {
            const c = n.DOMtoCanvas({ x: 80 + k * ((r.width - 160) / Math.max(1, objects.length - 1)), y: 90 });
            n.moveNode(node.id, c.x, c.y);
        });
        return { left: r.left, top: r.top, width: r.width, height: r.height };
    });
}

async function demonstrate(page, call, ids) {
    const rect = await openDemonstration(page, call);
    const spot = (fx, fy) => ({ x: rect.left + rect.width * fx, y: rect.top + rect.height * fy });
    const added = await addNode(page, "Node", false, spot(0.45, 0.82));
    const value = await addNode(page, demonstrations[call].value, true, spot(0.2, 0.82));
    const name = (role) => ({ new: added, value, "call1-new": ids.call1 }[role] ?? role);
    for (const [from, label, to] of demonstrations[call].edges) {
        await addEdge(page, name(from), label, name(to));
    }
    const recorded = (await operations(page)).map((o) => `${o.editType}:${o.label}`);
    assert(JSON.stringify(recorded) === JSON.stringify(expectedOperations[call]),
        `${call} recorded ${JSON.stringify(recorded)}, expected ${JSON.stringify(expectedOperations[call])}`);
    await page.locator("#acceptButton").click();
    await page.waitForFunction((label) => globalThis.__$__.Testize.storedTest[label]?.main?.operations?.length === 5, call);
    ids[call] = added;
}

async function synthesize(page) {
    const previous = await page.evaluate(() => (globalThis.__previousSynthesis = globalThis.__$__.Testize.lastSynthesis, true));
    assert(previous, "could not read the previous synthesis");
    await page.locator("#synthesizeButton").click();
    await page.waitForFunction(() => globalThis.__$__.Testize.lastSynthesis !== globalThis.__previousSynthesis, null, { timeout: 90000 });
    return page.evaluate(() => {
        const { applied, reason, validation, demonstrations } = globalThis.__$__.Testize.lastSynthesis;
        return { applied, reason, validation, demonstrations };
    });
}

async function adoptsTheDemonstratedInsert(browser) {
    const server = await serve();
    const { page, errors } = await openPage(browser, server);
    try {
        const ids = {};
        for (const call of ["call1", "call2", "call3"]) await demonstrate(page, call, ids);
        const outcome = await synthesize(page);
        assert(outcome.applied === true && outcome.reason === null, `not applied: ${JSON.stringify(outcome)}`);
        assert(outcome.validation?.status === "passed" && outcome.validation.checked_demonstrations === 3, `validation: ${JSON.stringify(outcome)}`);
        await page.waitForFunction(() => Object.values(globalThis.__$__.Testize.storedTest).every((t) => t.main?.passed === true), null, { timeout: 30000 });
        const result = await page.evaluate(() => {
            const text = globalThis.__$__.editor.getValue();
            const run = new Function(`${text}; const out = []; for (let n = list; n; n = n.next) out.push(n.val); return out;`);
            return { helpers: (text.match(/refsyn: generated helper/g) ?? []).length, list: run() };
        });
        assert(result.helpers === 3, `editor has ${result.helpers} helpers`);
        assert(JSON.stringify(result.list) === "[39,89,71,27,46,53]", `list after the calls: ${JSON.stringify(result.list)}`);
        assert(errors.length === 0, `page errors: ${errors.join("; ")}`);
        return { ...outcome, list: result.list };
    } finally {
        await page.close();
        server.close();
    }
}

async function recordsAWorkerThatCannotLoad(browser) {
    const server = await serve(new Set(await workerChunks()));
    const { page } = await openPage(browser, server);
    try {
        await demonstrate(page, "call1", {});
        const before = await page.evaluate(() => globalThis.__$__.editor.getValue());
        const outcome = await synthesize(page);
        const after = await page.evaluate(() => globalThis.__$__.editor.getValue());
        assert(outcome.applied === false && /^error: RefSyn worker failed/.test(outcome.reason ?? ""), `outcome: ${JSON.stringify(outcome)}`);
        assert(after === before, "the editor changed although synthesis failed");
        return outcome;
    } finally {
        await page.close();
        server.close();
    }
}

const browser = await chromium.launch();
try {
    const adopted = await adoptsTheDemonstratedInsert(browser);
    console.log(`adopted: ${JSON.stringify(adopted)}`);
    const failed = await recordsAWorkerThatCannotLoad(browser);
    console.log(`worker unavailable: ${JSON.stringify(failed)}`);
} finally {
    await browser.close();
}
