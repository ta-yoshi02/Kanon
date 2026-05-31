import "./importer.js";

describe("Testize receiver capture", () => {
    beforeEach(() => {
        __$__.Testize.storedCallArguments = {};
        __$__.Testize.storedTest = {};
        __$__.Testize.storedActualGraph = {};
        __$__.Testize.callParenthesisPos = {};
        __$__.Testize.callMethodNameByLabel = {};
        globalThis.jQuery = {
            extend: (_deep, _target, value) => JSON.parse(JSON.stringify(value))
        };
    });

    test("storeCallArguments stores runtime receiver object id for member calls", () => {
        __$__.Testize.storeCallArguments("call", "ctx", [25], { __id: "obj1" });

        expect(__$__.Testize.storedCallArguments.call.ctx).toEqual({
            arguments: [25],
            argumentTypes: ["Int"],
            argumentNames: ["arg0"],
            receiverObject: "obj1"
        });
    });

    test("synthesize prefers stored runtime receiver object over operation heuristics", async () => {
        const dispatchSpy = jest
            .spyOn(__$__.Testize, "dispatchSynthesisRequest")
            .mockResolvedValue(null);
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

        __$__.Testize.storedTest = {
            call: {
                ctx: {
                    operations: [{
                        editType: "editEdgeReference",
                        from: "main-new2",
                        oldTo: "main-new3",
                        newTo: "__temp4",
                        label: "next"
                    }],
                    methodName: "insert",
                    testData: {
                        nodes: [
                            { id: "main-new1", label: "Node", isLiteral: false },
                            { id: "main-new2", label: "Node", isLiteral: false }
                        ],
                        edges: []
                    }
                }
            }
        };
        __$__.Testize.storedActualGraph = {
            call: {
                ctx: {
                    nodes: [
                        { id: "main-new1", label: "Node", isLiteral: false },
                        { id: "main-new2", label: "Node", isLiteral: false }
                    ],
                    edges: []
                }
            }
        };
        __$__.Testize.storedCallArguments = {
            call: {
                ctx: {
                    arguments: [2, 83],
                    argumentTypes: ["Int", "Int"],
                    argumentNames: ["arg0", "arg1"],
                    receiverObject: "main-new1"
                }
            }
        };

        __$__.Testize.synthesize();
        await Promise.resolve();

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        const payload = dispatchSpy.mock.calls[0][0];
        expect(payload.method_calls).toHaveLength(1);
        expect(payload.method_calls[0].receiverObject).toBe("main-new1");

        warnSpy.mockRestore();
        dispatchSpy.mockRestore();
    });

});
