import "./importer.js";

function createNodeDataSet() {
    const entries = new Map();
    return {
        get: (id) => entries.get(id),
        add: (node) => {
            entries.set(node.id, { ...node });
        },
        update: (node) => {
            const prev = entries.get(node.id) || {};
            entries.set(node.id, { ...prev, ...node });
        }
    };
}

function createEdgeDataSet() {
    const entries = new Map();
    let seq = 0;
    return {
        get: (id) => {
            if (typeof id === "undefined") {
                return Array.from(entries.values());
            }
            return entries.get(id);
        },
        add: (edge) => {
            const next = { ...edge };
            if (next.id === undefined) {
                seq += 1;
                next.id = `edge_${seq}`;
            }
            entries.set(next.id, next);
            return next.id;
        },
        update: (edge) => {
            const prev = entries.get(edge.id) || {};
            entries.set(edge.id, { ...prev, ...edge });
        }
    };
}

describe("Testize argument overlay helpers", () => {
    let inferSpy;

    beforeEach(() => {
        __$__.Testize.testNodeCounter = 0;
        __$__.Testize.focusedTestOperations = [];
        __$__.Testize.storedCallArguments = {};
        __$__.Testize.storedtext = [];
        __$__.Testize.storedActualGraph = {};
        inferSpy = jest
            .spyOn(__$__.Testize, "inferMethodParamNamesForCall")
            .mockImplementation((_callLabel, _ctx, count) =>
                Array.from({ length: count }, (_, idx) => `arg${idx}`));
    });

    afterEach(() => {
        if (inferSpy) inferSpy.mockRestore();
    });

    test("storeCallArguments encodes Int/Ptr arguments", () => {
        __$__.Testize.storeCallArguments("call", "ctx", [25, { __id: "obj2" }, null]);

        expect(__$__.Testize.storedCallArguments.call.ctx).toEqual({
            arguments: [25, "obj2", null],
            argumentTypes: ["Int", "Ptr", "Ptr"],
            argumentNames: ["arg0", "arg1", "arg2"]
        });
    });

    test("insertArgumentLiteralNode adds literal node and addNode operation", () => {
        const nodes = createNodeDataSet();
        const edges = createEdgeDataSet();
        const redraw = jest.fn();

        __$__.Testize.network = {
            network: {
                body: {
                    data: {
                        nodes,
                        edges
                    }
                },
                getPositions: () => ({}),
                redraw
            },
            container: {
                clientWidth: 900,
                clientHeight: 600
            }
        };

        __$__.Testize.storedCallArguments = {
            call: {
                ctx: {
                    arguments: [25],
                    argumentTypes: ["Int"],
                    argumentNames: ["arg0"]
                }
            }
        };

        __$__.Testize.insertArgumentLiteralNode("call", "ctx", 0);

        expect(nodes.get("__temp_arg_1")).toMatchObject({
            id: "__temp_arg_1",
            label: "25",
            isLiteral: true,
            type: "string",
            fixed: true
        });
        expect(__$__.Testize.focusedTestOperations).toHaveLength(1);
        expect(__$__.Testize.focusedTestOperations[0]).toMatchObject({
            editType: "addNode",
            id: "__temp_arg_1",
            label: "25",
            isLiteral: true,
            type: "string"
        });
        expect(redraw).toHaveBeenCalled();
    });

    test("insertArgumentLiteralNode ignores non-Int argument", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        const nodes = createNodeDataSet();
        const edges = createEdgeDataSet();

        __$__.Testize.network = {
            network: {
                body: {
                    data: {
                        nodes,
                        edges
                    }
                },
                getPositions: () => ({}),
                redraw: jest.fn()
            }
        };

        __$__.Testize.storedCallArguments = {
            call: {
                ctx: {
                    arguments: ["obj2"],
                    argumentTypes: ["Ptr"],
                    argumentNames: ["arg0"]
                }
            }
        };

        __$__.Testize.insertArgumentLiteralNode("call", "ctx", 0);

        expect(__$__.Testize.focusedTestOperations).toHaveLength(0);
        expect(nodes.get("__temp_arg_1")).toBeUndefined();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    test("resolveCallArgumentsForOverlay reports Ptr reference and display name", () => {
        inferSpy.mockReturnValue(["list"]);
        __$__.Testize.storedCallArguments = {
            call: {
                ctx: {
                    arguments: ["obj2"],
                    argumentTypes: ["Ptr"],
                    argumentNames: ["arg0"]
                }
            }
        };
        __$__.Testize.storedActualGraph = {
            call: {
                ctx: {
                    nodes: [{ id: "obj2", label: "Node", isLiteral: false }],
                    edges: [{ from: "__Variable-list", to: "obj2", label: "list" }]
                }
            }
        };

        const info = __$__.Testize.resolveCallArgumentsForOverlay("call", "ctx");
        expect(info.displayNames).toEqual(["list"]);
        expect(info.pointerReferences[0]).toEqual({
            targetId: "obj2",
            targetLabel: "Node",
            aliases: ["list"]
        });
    });

    test("insertArgumentVariableReferenceNode creates addVariable operation", () => {
        inferSpy.mockReturnValue(["list"]);
        const nodes = createNodeDataSet();
        const edges = createEdgeDataSet();
        nodes.add({ id: "obj2", label: "Node", isLiteral: false });

        __$__.Testize.network = {
            network: {
                body: {
                    data: {
                        nodes,
                        edges
                    }
                },
                redraw: jest.fn()
            }
        };
        __$__.Testize.storedCallArguments = {
            call: {
                ctx: {
                    arguments: ["obj2"],
                    argumentTypes: ["Ptr"],
                    argumentNames: ["arg0"]
                }
            }
        };

        __$__.Testize.insertArgumentVariableReferenceNode("call", "ctx", 0);

        expect(__$__.Testize.focusedTestOperations).toHaveLength(1);
        expect(__$__.Testize.focusedTestOperations[0]).toEqual({
            editType: "addVariable",
            to: "obj2",
            label: "list"
        });
        const allEdges = edges.get();
        expect(allEdges).toHaveLength(1);
        expect(allEdges[0]).toMatchObject({
            from: "__Variable-list",
            to: "obj2",
            label: "list"
        });
    });

    test("insertArgumentVariableReferenceNode updates existing variable reference", () => {
        inferSpy.mockReturnValue(["list"]);
        const nodes = createNodeDataSet();
        const edges = createEdgeDataSet();
        nodes.add({ id: "obj1", label: "Node", isLiteral: false });
        nodes.add({ id: "obj2", label: "Node", isLiteral: false });
        nodes.add({ id: "__Variable-list", label: "list", hidden: true });
        edges.add({ id: "edge_existing", from: "__Variable-list", to: "obj1", label: "list" });

        __$__.Testize.network = {
            network: {
                body: {
                    data: {
                        nodes,
                        edges
                    }
                },
                redraw: jest.fn()
            }
        };
        __$__.Testize.storedCallArguments = {
            call: {
                ctx: {
                    arguments: ["obj2"],
                    argumentTypes: ["Ptr"],
                    argumentNames: ["arg0"]
                }
            }
        };

        __$__.Testize.insertArgumentVariableReferenceNode("call", "ctx", 0);

        expect(__$__.Testize.focusedTestOperations).toHaveLength(1);
        expect(__$__.Testize.focusedTestOperations[0]).toEqual({
            editType: "editVariableReference",
            oldTo: "obj1",
            newTo: "obj2",
            label: "list"
        });
        expect(edges.get("edge_existing")).toMatchObject({
            from: "__Variable-list",
            to: "obj2",
            label: "list"
        });
    });

    test("ensureArgumentReferenceVisualization materializes argument references in graph", () => {
        inferSpy.mockReturnValue(["list", "count"]);
        const nodes = createNodeDataSet();
        const edges = createEdgeDataSet();
        nodes.add({ id: "obj2", label: "Node", isLiteral: false });

        const visGraph = { nodes, edges };
        __$__.Testize.storedCallArguments = {
            call: {
                ctx: {
                    arguments: ["obj2", 25],
                    argumentTypes: ["Ptr", "Int"],
                    argumentNames: ["arg0", "arg1"]
                }
            }
        };

        __$__.Testize.ensureArgumentReferenceVisualization(visGraph, "call", "ctx");

        expect(nodes.get("__Variable-list")).toMatchObject({
            id: "__Variable-list",
            label: "list",
            hidden: true
        });
        expect(nodes.get("__Variable-count")).toMatchObject({
            id: "__Variable-count",
            label: "count",
            hidden: true
        });
        expect(nodes.get("__arg_literal_count_1")).toMatchObject({
            id: "__arg_literal_count_1",
            label: "25",
            isLiteral: true,
            type: "number"
        });

        const allEdges = edges.get();
        expect(allEdges).toEqual(expect.arrayContaining([
            expect.objectContaining({
                from: "__Variable-list",
                to: "obj2",
                label: "list"
            }),
            expect.objectContaining({
                from: "__Variable-count",
                to: "__arg_literal_count_1",
                label: "count"
            })
        ]));
    });
});
