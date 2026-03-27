__$__.Testize = {
    callParenthesisPos: {},
    callMethodNameByLabel: {},
    hoveringCallInfo: {
        label: undefined,
        div: undefined
    },
    selectedCallInfo: {
        label: undefined,
        context_sensitiveID: undefined
    },
    setSelectedCallInfo(label) {
        try {
            let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[label].start).loop;
            let context_sensitiveID = __$__.Context.SpecifiedContext[loopLabelAroundCall];
            __$__.Testize.selectedCallInfo = {
                label: label,
                context_sensitiveID: context_sensitiveID
            };
        } catch (e) {}
    },
    focusedTestOperations: undefined, // Array of mouse operation
    testNodeCounter: 0,
    enable: false,
    storedTest: {},
    storedCallArguments: {},
    storedtext: [],
    storedActualGraph: {},
    window: {},
    network: {
        options: {
            autoResize: false,
            nodes: {
                color: 'skyblue'
            },
            edges: {
                arrows: 'to',
                color: {
                    color: 'skyblue',
                    opacity: 1.0,
                    highlight: 'skyblue',
                    hover: 'skyblue'
                },
                width: 3,
                smooth: {
                    enabled: true,
                    forceDirection: 'none',
                    roundness: 1.0
                }
            },
            physics: {
                enabled: true
            },
            interaction: {
                hover: true
                // zoomView: false
            },
            manipulation: {
                enabled: true,
                addNode: function(data, callback) {
                    let editType = 'addNode';
                    document.getElementById('operation').innerHTML = "Add Node";
                    document.getElementById('node-label').value = "";
                    document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithCallback.bind(this, data, callback, editType, null);
                    document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.cancelEdit.bind(this, callback);
                    document.getElementById('isLiteral').style.display = 'inline';
                    document.getElementById('network-popUp').style.display = 'block';
                    document.getElementById('node-label').focus();
                },
                addEdge: function(data, callback) {
                    if (__$__.Testize.network.network.body.data.nodes.get(data.from).type || data.to === '__RectForVariable__') {
                        callback(null);
                    } else if (data.from === '__RectForVariable__') {
                        let editType = 'addVariable';
                        document.getElementById('operation').innerHTML = "Add Variable";
                        document.getElementById('node-label').value = "";
                        document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithCallback.bind(this, data, callback, editType, true);
                        document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.cancelEdit.bind(this, callback);
                        document.getElementById('isLiteral').style.display = 'none';
                        document.getElementById('network-popUp').style.display = 'block';
                        document.getElementById('node-label').focus();
                    } else {
                        let editType = 'addEdge';
                        document.getElementById('operation').innerHTML = "Add Edge";
                        document.getElementById('node-label').value = "";
                        document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithCallback.bind(this, data, callback, editType, null);
                        document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.cancelEdit.bind(this, callback);
                        document.getElementById('isLiteral').style.display = 'none';
                        document.getElementById('network-popUp').style.display = 'block';
                        document.getElementById('node-label').focus();
                    }
                },
                editEdge: function(data, callback) {
                    let origEdge = __$__.Testize.network.network.body.data.edges.get(data.id);
                    if (origEdge.from !== data.from || origEdge.from.slice(0, 11) === '__Variable-' && data.from.slice(0, 11) !== '__Variable-' || data.from === '__RectForVariable__' || data.to === '__RectForVariable__') {
                        callback(null);
                    } else {
                        if (data.from.slice(0, 11) === '__Variable-') {
                            let editType = 'editVariableReference';
                            __$__.Testize.saveMouseOperation(editType, {
                                oldTo: origEdge.to,
                                newTo: data.to,
                                label: data.label || __$__.Testize.network.network.body.data.edges.get(data.id).label
                            });
                        } else {
                            let editType = 'editEdgeReference';
                            __$__.Testize.saveMouseOperation(editType, {
                                from: data.from,
                                oldTo: origEdge.to,
                                newTo: data.to,
                                label: data.label || __$__.Testize.network.network.body.data.edges.get(data.id).label
                            });
                        }
                        callback(data);
                    }
                },
                deleteNode: function(data, callback) {
                    let editType = 'deleteNode';
                    if (data.nodes.indexOf('__RectForVariable__') >= 0) {
                        callback(null);
                    } else {
                        __$__.Testize.saveMouseOperation(editType, {
                            editType: editType,
                            id: data.nodes[0]
                        });
                        callback(data);
                    }
                },
                deleteEdge: function(data, callback) {
                    let edgeInfo = __$__.Testize.network.network.body.data.edges.get(data.edges[0]);
                    if (edgeInfo) {
                        if (edgeInfo.from.slice(0, 11) === '__Variable-') {
                            let editType = 'deleteVariable';
                            __$__.Testize.saveMouseOperation(editType, {
                                label: edgeInfo.label,
                                to: edgeInfo.to
                            });
                            callback(data);
                            __$__.Testize.network.network.body.data.nodes.remove(edgeInfo.from);
                        } else {
                            let editType = 'deleteEdge';
                            __$__.Testize.saveMouseOperation(editType, {
                                label: edgeInfo.label,
                                from: edgeInfo.from,
                                to: edgeInfo.to
                            });
                            callback(data);
                        }
                    } else {
                        callback(null);
                    }
                }
            }
        }
    },
    actualGraphNetwork: {
        options: {
            autoResize: false,
            nodes: {
                color: 'skyblue'
            },
            edges: {
                arrows: 'to',
                color: {
                    color: 'skyblue',
                    opacity: 1.0,
                    highlight: 'skyblue',
                    hover: 'skyblue'
                },
                width: 3,
                smooth: {
                    enabled: true,
                    forceDirection: 'none',
                    roundness: 1.0
                }
            },
            physics: {
                enabled: true
            },
            interaction: {
                hover: true
                // zoomView: false
            }
        }
    },


    makeLiteralColor() {
        return {
            border: 'white',
            background: 'white',
            highlight: {
                border: 'white',
                background: 'white'
            },
            hover: {
                border: 'white',
                background: 'white'
            }
        }
    },


    initialize() {
        __$__.Testize.callParenthesisPos = {};
        __$__.Testize.callMethodNameByLabel = {};
        __$__.Testize.storedCallArguments = {};
    },


    normalizeMethodName(name) {
        if (typeof name !== 'string') return 'unknown';
        const trimmed = name.trim();
        return trimmed.length > 0 ? trimmed : 'unknown';
    },


    sanitizeClassNameHint(name) {
        if (typeof name !== 'string') return undefined;
        const trimmed = name.trim();
        if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed)) return undefined;
        return trimmed;
    },


    extractMethodNameFromCallNode(node) {
        if (!node || !node.callee) return undefined;
        const callee = node.callee;

        if (callee.type === 'Identifier') {
            return callee.name;
        }

        if (callee.type === 'MemberExpression') {
            const prop = callee.property;
            if (!callee.computed && prop && prop.type === 'Identifier') {
                return prop.name;
            }
            if (prop && prop.type === 'Literal') {
                return String(prop.value);
            }
            if (prop && prop.type === 'Identifier') {
                return prop.name;
            }
        }

        return undefined;
    },


    findNodeLabelById(graph, nodeId) {
        if (!graph || !Array.isArray(graph.nodes) || !nodeId) return undefined;
        const node = graph.nodes.find((n) => n && n.id === nodeId);
        if (!node || typeof node.label !== 'string') return undefined;
        if (node.isLiteral === true) return undefined;
        return node.label;
    },


    resolveReceiverClassName(receiverObject, actualGraph, visGraph) {
        const labelFromActual = __$__.Testize.findNodeLabelById(actualGraph, receiverObject);
        const labelFromVis = __$__.Testize.findNodeLabelById(visGraph, receiverObject);
        return __$__.Testize.sanitizeClassNameHint(labelFromActual || labelFromVis);
    },


    extractParamNameFromPattern(pattern, fallbackName) {
        if (!pattern || typeof pattern !== 'object') return fallbackName;
        if (pattern.type === 'Identifier' && pattern.name) return pattern.name;
        if (pattern.type === 'AssignmentPattern') {
            return __$__.Testize.extractParamNameFromPattern(pattern.left, fallbackName);
        }
        if (pattern.type === 'RestElement') {
            return __$__.Testize.extractParamNameFromPattern(pattern.argument, fallbackName);
        }
        return fallbackName;
    },


    parseEditorAst() {
        const parser = (typeof esprima !== 'undefined' && esprima)
            ? esprima
            : ((typeof window !== 'undefined' && window.esprima) ? window.esprima : undefined);
        if (!parser) {
            throw new Error('esprima is unavailable');
        }

        const source = __$__.editor.getValue();
        const optionsList = [
            { loc: true, range: true, tolerant: true },
            { loc: true, range: true }
        ];
        const parseFns = [];
        if (typeof parser.parseScript === 'function') parseFns.push(parser.parseScript.bind(parser));
        if (typeof parser.parse === 'function') parseFns.push(parser.parse.bind(parser));
        if (typeof parser.parseModule === 'function') parseFns.push(parser.parseModule.bind(parser));
        if (parseFns.length === 0) {
            throw new Error('no usable parse function on esprima');
        }

        const errors = [];
        for (const fn of parseFns) {
            for (const options of optionsList) {
                try {
                    return fn(source, options);
                } catch (e) {
                    errors.push(e && e.message ? e.message : String(e));
                }
            }
        }
        throw new Error(errors.join(' | '));
    },


    findMethodDefinitionInfo(methodName, arityHint, classNameHint) {
        if (!methodName) return null;
        const normalizedClassHint = __$__.Testize.sanitizeClassNameHint(classNameHint);
        let ast;
        try {
            ast = __$__.Testize.parseEditorAst();
        } catch (e) {
            console.warn(`[Testize] failed while locating method '${methodName}':`, e && e.message ? e.message : e);
            return null;
        }

        let best = null;
        const updateBest = (name, params, loc, range, ownerClassName) => {
            if (name !== methodName || !loc || !range) return;
            const paramNames = (params || []).map((param, idx) =>
                __$__.Testize.extractParamNameFromPattern(param, `arg${idx}`));
            const arity = paramNames.length;
            let score = (typeof arityHint === 'number')
                ? (arity === arityHint ? 0 : 100 + Math.abs(arity - arityHint))
                : 0;
            if (normalizedClassHint) {
                if (ownerClassName === normalizedClassHint) {
                    score -= 1000;
                } else if (ownerClassName) {
                    score += 1000;
                } else {
                    score += 2000;
                }
            }
            const candidate = { paramNames, loc, range, score, ownerClassName };
            if (!best || candidate.score < best.score || (candidate.score === best.score && candidate.range[0] < best.range[0])) {
                best = candidate;
            }
        };

        const visit = (node, currentClassName) => {
            if (!node || typeof node !== 'object') return;
            let nextClassName = currentClassName;

            if (node.type === 'ClassDeclaration' && node.id && node.id.type === 'Identifier') {
                nextClassName = node.id.name;
            } else if (node.type === 'ClassExpression' && node.id && node.id.type === 'Identifier') {
                nextClassName = node.id.name;
            }

            if (node.type === 'MethodDefinition') {
                const key = node.key;
                const name = key && key.type === 'Identifier'
                    ? key.name
                    : (key && key.type === 'Literal' ? String(key.value) : undefined);
                if (node.value && node.value.type === 'FunctionExpression') {
                    updateBest(name, node.value.params, node.loc, node.range, nextClassName);
                }
            } else if (node.type === 'FunctionDeclaration' && node.id && node.id.name) {
                updateBest(node.id.name, node.params, node.loc, node.range, undefined);
            }

            for (const key in node) {
                if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                const child = node[key];
                if (!child) continue;
                if (Array.isArray(child)) {
                    child.forEach((entry) => visit(entry, nextClassName));
                } else if (typeof child === 'object' && child.type) {
                    visit(child, nextClassName);
                }
            }
        };
        visit(ast, undefined);
        return best;
    },


    replaceMethodDefinitionSource(methodName, arityHint, replacementSource, classNameHint) {
        const info = __$__.Testize.findMethodDefinitionInfo(methodName, arityHint, classNameHint);
        if (!info || !info.loc || !replacementSource) return false;

        const start = info.loc.start;
        const end = info.loc.end;
        const baseIndent = ' '.repeat(start.column);
        const adjustedSource = replacementSource
            .split('\n')
            .map((line, idx) => idx === 0 ? line : baseIndent + line)
            .join('\n');

        const range = new __$__.Range(
            start.line - 1,
            start.column,
            end.line - 1,
            end.column
        );
        __$__.editor.session.replace(range, adjustedSource);
        return true;
    },


    extractMethodNameFromMethodSource(methodSource) {
        if (typeof methodSource !== 'string') return undefined;
        const match = methodSource.match(/^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/);
        return match ? match[1] : undefined;
    },


    extractMethodArityFromMethodSource(methodSource) {
        if (typeof methodSource !== 'string') return undefined;
        const match = methodSource.match(/^\s*(?:function\s+)?[A-Za-z_$][A-Za-z0-9_$]*\s*\(([^)]*)\)/);
        if (!match) return undefined;
        const paramsText = match[1].trim();
        if (paramsText.length === 0) return 0;
        return paramsText
            .split(',')
            .map((param) => param.trim())
            .filter((param) => param.length > 0)
            .length;
    },


    toLineComments(text) {
        if (typeof text !== 'string' || text.length === 0) return '';
        return text
            .split('\n')
            .map((line) => `// ${line}`)
            .join('\n');
    },

    redraw() {
        let split_pane_size = document.getElementById('split-pane-frame').getBoundingClientRect();
        __$__.Testize.window.testGraph.setWidth(split_pane_size.width / 1.5);
        __$__.Testize.window.testGraph.setHeight(split_pane_size.height / 1.5);
        __$__.Testize.window.runtimeGraph.setWidth(split_pane_size.width / 1.75);
        __$__.Testize.window.runtimeGraph.setHeight(split_pane_size.height / 1.75);
        __$__.Testize.network.network.redraw();
        __$__.Testize.actualGraphNetwork.network.redraw();
    },


    // ==================================================================================
    // ============== start: manipulation callback for constructing a test ==============
    // ==================================================================================


    clickEvent(param) {
        // click node
        if (param.nodes.length) {/* do nothing */}

        // click edge
        else if (param.edges.length) {
        }

        // click blank
        else {
            // __$__.Testize.network.network.disableEditMode();
        }
    },


    doubleClickEvent(param) {
        // double click node
        if (param.nodes.length) {
            // edit label of the node
            let nodeID = param.nodes[0];
            let node = __$__.Testize.network.network.body.data.nodes.get(nodeID);
            let editType = 'editNode';

            document.getElementById('operation').innerHTML = "Edit Node";
            document.getElementById('node-label').value = node.label;
            document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithoutCallback.bind(this, __$__.Testize.network.network.body.data.nodes, editType, param, nodeID);
            document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.clearPopUp;
            document.getElementById('isLiteral').style.display = 'inline';
            document.getElementById('checkboxForLiteral').checked = (node.color && node.color.border === 'white');
            document.getElementById('network-popUp').style.display = 'block';
            document.getElementById('node-label').focus();
        }

        // double click edge
        else if (param.edges.length) {
            // edit label of the edge
            let edgeID = param.edges[0];
            let edge = __$__.Testize.network.network.body.data.edges.get(edgeID);
            let editType = (edge.from.slice(0, 11) === '__Variable-') ? 'editVariableLabel' : 'editEdgeLabel';

            document.getElementById('operation').innerHTML = "Edit Edge";
            document.getElementById('node-label').value = edge.label || "";
            document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithoutCallback.bind(this, __$__.Testize.network.network.body.data.edges, editType, param, edgeID);
            document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.clearPopUp;
            document.getElementById('isLiteral').style.display = 'none';
            document.getElementById('network-popUp').style.display = 'block';
            document.getElementById('node-label').focus();
        }

        // double click blank
        else {
            // add a node
            let editType = 'addNode';

            document.getElementById('operation').innerHTML = "Add Node";
            document.getElementById('node-label').value = '';
            document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithoutCallback.bind(this, __$__.Testize.network.network.body.data.nodes, editType, param, null);
            document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.clearPopUp;
            document.getElementById('isLiteral').style.display = 'inline';
            document.getElementById('checkboxForLiteral').checked = false;
            document.getElementById('network-popUp').style.display = 'block';
            document.getElementById('node-label').focus();
        }
    },


    holdingEvent(param) {
        if (param.nodes.length) {
            // add an edge
            __$__.Testize.network.network.addEdgeMode();
        }

        else if (param.edges.length) {
            // edit edge
            __$__.Testize.network.network.editEdgeMode();
        }

        else {/* do nothing */}
    },


    saveDataWithoutCallback(dataSet, editType, param, id = null) {
        let color = null, type = null;
        if (editType === 'addNode' || editType === 'editNode') {
            // the case of node
            let nodeID = id || '__temp' + ++__$__.Testize.testNodeCounter;
            let label = document.getElementById('node-label').value;
            let isLiteral = document.getElementById('checkboxForLiteral').checked;
            if (isLiteral) {
                color = __$__.Testize.makeLiteralColor();
                type = 'string';
            }

            if (editType === 'addNode') {
                let pos = {x: param.pointer.canvas.x, y: param.pointer.canvas.y};
                dataSet.update({
                    id: nodeID,
                    label: label,
                    color: color,
                    type: type,
                    fixed: true,
                    isLiteral: isLiteral,
                    x: pos.x,
                    y: pos.y
                });
            } else {
                dataSet.update({
                    id: nodeID,
                    label: label,
                    color: color,
                    type: type,
                    fixed: true,
                    isLiteral: isLiteral
                });
            }

            __$__.Testize.saveMouseOperation(editType, {
                editType: editType,
                id: nodeID,
                label: label,
                isLiteral: isLiteral,
                type: type
            });
        } else {
            // the case of edge
            let edgeID = id;
            let edgeInfo = dataSet.get(edgeID);
            let label = document.getElementById('node-label').value;
            color = null;

            if (editType === 'editVariableLabel') {
                // edit variable name
                let origVariableNodeID = edgeInfo.from;
                let nodeDataSet = __$__.Testize.network.network.body.data.nodes;
                let node = nodeDataSet.get(edgeInfo.from);
                let newNodeID = '__Variable-' + label;
                color = (label === 'return') ? 'black' : 'seagreen';

                if (origVariableNodeID !== newNodeID) {
                    __$__.Testize.saveMouseOperation(editType, {
                        to: edgeInfo.to,
                        oldLabel: edgeInfo.label,
                        newLabel: label
                    });
                    nodeDataSet.update({
                        id: newNodeID,
                        label: label,
                        hidden: true
                    });
                    dataSet.update({
                        id: edgeID,
                        label: label,
                        color: color,
                        from: newNodeID
                    });
                    nodeDataSet.remove(origVariableNodeID);
                }
            } else {
                // edit edge label
                __$__.Testize.saveMouseOperation(editType, {
                    from: edgeInfo.from,
                    to: edgeInfo.to,
                    oldLabel: edgeInfo.label,
                    newLabel: label
                });
                dataSet.update({
                    id: edgeID,
                    label: label,
                    color: color
                });
            }
        }
        __$__.Testize.clearPopUp();
    },


    /**
     * @param {Object} data
     * @param {Function} callback
     * @param {string} editType
     */
    saveDataWithCallback(data, callback, editType) {
        let saveOperationData;
        data.label = document.getElementById('node-label').value;
        switch (editType) {
            case 'addNode': {
                data.id = '__temp' + ++__$__.Testize.testNodeCounter;
                data.isLiteral = document.getElementById('checkboxForLiteral').checked;
                data.fixed = true;
                if (data.isLiteral) {
                    data.color = __$__.Testize.makeLiteralColor();
                    data.type = 'string';
                }
                saveOperationData = {
                    editType: editType,
                    id: data.id,
                    label: data.label,
                    isLiteral: data.isLiteral,
                    type: data.type
                };
                break;
            }
            case 'editNode': {
                break;
            }
            case 'deleteNode': {
                break;
            }
            case 'addEdge': {
                let sameEdge = Object.values(__$__.Testize.network.network.body.data.edges._data).find(edge => edge.from === data.from && edge.label === data.label);
                if (sameEdge) {
                    __$__.Testize.network.network.body.data.edges.remove(sameEdge.id);
                    __$__.Testize.network.network.body.data.edges.add({
                        label: data.label,
                        from: data.from,
                        to: data.to
                    });
                    __$__.Testize.clearPopUp();
                    __$__.Testize.saveMouseOperation('editEdgeReference', {
                        editType: editType,
                        label: data.label,
                        from: data.from,
                        oldTo: sameEdge.to,
                        newTo: data.to
                    });
                    callback(null);
                    return;
                } else {
                    saveOperationData = {
                        editType: editType,
                        label: data.label,
                        from: data.from,
                        to: data.to
                    };
                }
                break;
            }
            case 'editEdgeReference': {
                break;
            }
            case 'editEdgeLabel': {
                break;
            }
            case 'deleteEdge': {
                break;
            }
            case 'addVariable': {
                // if a variable edge is added or edited
                let variableName = document.getElementById('node-label').value;
                let invisibleNodeID = '__Variable-' + variableName;

                let invisibleNode = __$__.Testize.network.network.body.data.nodes.get(invisibleNodeID);
                let variableEdge = Object.values(__$__.Testize.network.network.body.data.edges._data).find(edge => edge.from === invisibleNodeID);
                // if the variable is already defined and already refers to an object
                if (invisibleNode && variableEdge) {
                    // this operation type is 'editVariableReference'
                    __$__.Testize.saveMouseOperation('editVariableReference', {
                        oldTo: variableEdge.to,
                        newTo: data.to,
                        label: variableName
                    });

                    __$__.Testize.network.network.body.data.edges.update({
                        id: variableEdge.id,
                        to: data.to
                    });
                } else {
                    if (!invisibleNode)
                        __$__.Testize.network.network.body.data.nodes.add({
                            id: invisibleNodeID,
                            label: variableName,
                            hidden: true
                        });

                    __$__.Testize.network.network.body.data.edges.add({
                        from: invisibleNodeID,
                        to: data.to,
                        color: (variableName === 'return') ? 'black' : 'seagreen',
                        label: variableName,
                        length: 30
                    });

                    __$__.Testize.saveMouseOperation(editType, {
                        to: data.to,
                        label: variableName
                    });
                }
                __$__.Testize.clearPopUp();
                callback(null);
                return;
            }
            case 'editVariableReference': {
                break;
            }
            case 'editVariableLabel': {
                break;
            }
            case 'deleteVariable': {
                break;
            }
        }
        __$__.Testize.clearPopUp();
        __$__.Testize.saveMouseOperation(editType, saveOperationData);
        callback(data);
    },


    toPlainVisGraph(visData) {
        if (!visData || !visData.nodes || !visData.edges) {
            return { nodes: [], edges: [] };
        }

        const toArray = (dataSet) => {
            if (!dataSet) return [];
            if (Array.isArray(dataSet)) {
                return dataSet.map((item) => jQuery.extend(true, {}, item));
            }
            if (dataSet._data) {
                return Object.values(dataSet._data).map((item) => jQuery.extend(true, {}, item));
            }
            if (typeof dataSet.get === 'function') {
                return dataSet.get().map((item) => jQuery.extend(true, {}, item));
            }
            return [];
        };

        return {
            nodes: toArray(visData.nodes),
            edges: toArray(visData.edges)
        };
    },

    dispatchSynthesisRequest(payload) {
        const browserRunner = __$__.Testize.runRefsynBrowser
            || (typeof globalThis !== 'undefined' ? globalThis.runRefsynBrowser : undefined);
        if (typeof browserRunner === 'function') {
            return Promise.resolve(browserRunner(payload));
        }

        const location = typeof globalThis !== 'undefined' ? globalThis.location : undefined;
        const hostname = location && typeof location.hostname === 'string'
            ? location.hostname
            : '';
        const isLocalBackendFallbackHost = hostname === 'localhost'
            || hostname === '127.0.0.1'
            || hostname === '[::1]';
        if (!isLocalBackendFallbackHost) {
            return Promise.reject(new Error(
                'RefSyn browser runtime is not loaded. Production builds must bundle src/js/vendor/refsyn-browser-runtime.js.',
            ));
        }

        return fetch("http://localhost:3030/synthesize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
    },

    isRuntimeScopedId(id) {
        return typeof id === 'string' && id.includes('-call');
    },

    normalizeIdWithRuntimeMap(id, runtimeToTempMap, runtimeAliasMap = undefined) {
        if (typeof id !== 'string') return id;
        let resolvedId = id;
        if (runtimeAliasMap && typeof runtimeAliasMap === 'object') {
            const visited = {};
            while (typeof runtimeAliasMap[resolvedId] === 'string' && !visited[resolvedId]) {
                visited[resolvedId] = true;
                resolvedId = runtimeAliasMap[resolvedId];
            }
        }
        if (!runtimeToTempMap || typeof runtimeToTempMap !== 'object') return resolvedId;
        // Only runtime-scoped IDs are unstable enough to rewrite into temp IDs.
        // Stable graph IDs such as main-new2 must survive normalization unchanged.
        if (!__$__.Testize.isRuntimeScopedId(resolvedId)) return resolvedId;
        return runtimeToTempMap[resolvedId] || resolvedId;
    },

    mergeRuntimeIdMapping(runtimeToTempMap, idMapping) {
        if (!runtimeToTempMap || !idMapping || typeof idMapping !== 'object') return;
        Object.keys(idMapping).forEach((tempId) => {
            const runtimeId = idMapping[tempId];
            if (typeof tempId !== 'string' || typeof runtimeId !== 'string') return;
            if (!runtimeId.length || !tempId.length) return;
            if (!__$__.Testize.isRuntimeScopedId(runtimeId)) return;
            if (!(runtimeId in runtimeToTempMap)) {
                runtimeToTempMap[runtimeId] = tempId;
            }
        });
    },

    mergeRuntimeAliasMapping(runtimeAliasMap, aliasMapping) {
        if (!runtimeAliasMap || !aliasMapping || typeof aliasMapping !== 'object') return;
        Object.keys(aliasMapping).forEach((fromId) => {
            const toId = aliasMapping[fromId];
            if (typeof fromId !== 'string' || typeof toId !== 'string') return;
            if (!fromId.length || !toId.length) return;
            if (!(fromId in runtimeAliasMap)) {
                runtimeAliasMap[fromId] = toId;
            }
        });
    },

    sanitizeIdMapping(idMapping) {
        if (!idMapping || typeof idMapping !== 'object') return null;
        const filtered = {};
        Object.keys(idMapping).forEach((tempId) => {
            const runtimeId = idMapping[tempId];
            if (typeof tempId !== 'string' || typeof runtimeId !== 'string') return;
            if (!tempId.startsWith('__temp')) return;
            if (!__$__.Testize.isRuntimeScopedId(runtimeId)) return;
            filtered[tempId] = runtimeId;
        });
        return Object.keys(filtered).length > 0 ? filtered : null;
    },

    normalizeOperationsWithRuntimeMap(operations, runtimeToTempMap, runtimeAliasMap = undefined) {
        if (!Array.isArray(operations)) return [];
        const idKeys = ['id', 'from', 'to', 'oldTo', 'newTo', 'old_to', 'new_to'];
        return operations.map((op) => {
            const next = jQuery.extend(true, {}, op);
            if (!next || typeof next !== 'object') return next;
            idKeys.forEach((key) => {
                if (!(key in next)) return;
                if (typeof next[key] !== 'string') return;
                next[key] = __$__.Testize.normalizeIdWithRuntimeMap(
                    next[key],
                    runtimeToTempMap,
                    runtimeAliasMap
                );
            });
            return next;
        });
    },

    normalizeCallArgument(value) {
        if (typeof value === 'number' && Number.isInteger(value)) {
            return { ok: true, value: value, type: 'Int' };
        }
        if (value === null) {
            return { ok: true, value: null, type: 'Ptr' };
        }
        if (value && typeof value === 'object' && value.__id) {
            return { ok: true, value: value.__id, type: 'Ptr' };
        }
        return { ok: false };
    },

    storeCallArguments(callLabel, context_sensitiveID, args) {
        if (!callLabel || !context_sensitiveID || !Array.isArray(args)) {
            return;
        }
        if (!__$__.Testize.storedCallArguments[callLabel]) {
            __$__.Testize.storedCallArguments[callLabel] = {};
        }

        const encodedValues = [];
        const encodedTypes = [];
        const encodedNames = [];
        let unsupported = false;

        args.forEach((arg, idx) => {
            const encoded = __$__.Testize.normalizeCallArgument(arg);
            if (!encoded.ok) {
                unsupported = true;
                return;
            }
            encodedValues.push(encoded.value);
            encodedTypes.push(encoded.type);
            encodedNames.push(`arg${idx}`);
        });

        if (unsupported) {
            __$__.Testize.storedCallArguments[callLabel][context_sensitiveID] = {
                arguments: [],
                argumentTypes: [],
                argumentNames: []
            };
            return;
        }

        __$__.Testize.storedCallArguments[callLabel][context_sensitiveID] = {
            arguments: encodedValues,
            argumentTypes: encodedTypes,
            argumentNames: encodedNames
        };
    },


    synthesize() {
        // メソッド呼び出しごとに操作をまとめる
        const methodCalls = [];
        let visGraphPayload = null;
        const runtimeToTempMap = {};
        const runtimeAliasMap = {};

        for (const callLabel in __$__.Testize.storedTest) {
            for (const contextID in __$__.Testize.storedTest[callLabel]) {
                if (contextID === 'markerInfo') continue;

                const test = __$__.Testize.storedTest[callLabel][contextID];
                if (!test.operations || !Array.isArray(test.operations)) continue;
                
                // receiverを特定（main-new1など）
                let receiverObject = "main-new1"; // デフォルト値
                // 操作から自動検出する場合
                for (const op of test.operations) {
                    if (op.from && op.from.startsWith("main-new")) {
                        receiverObject = op.from;
                        break;
                    }
                }
                
                // メソッド名を取得（appendなど）
                const methodNameFromPos = (__$__.Testize.callParenthesisPos[callLabel]
                    && __$__.Testize.callParenthesisPos[callLabel].methodName)
                    || __$__.Testize.callMethodNameByLabel[callLabel];
                const methodName = __$__.Testize.normalizeMethodName(
                    test.methodName || methodNameFromPos || callLabel.split('.').pop() || "unknown"
                );

                // Kanon の期待グラフ（vis.js DataSet）を plain object に変換
                if (!visGraphPayload && test.testData) {
                    visGraphPayload = __$__.Testize.toPlainVisGraph(test.testData);
                }

                // 1つのメソッド呼び出しとして追加
                const runtimeCallArgs = __$__.Testize.storedCallArguments[callLabel]
                    && __$__.Testize.storedCallArguments[callLabel][contextID];
                const serializedArgs = Array.isArray(test.arguments) && test.arguments.length > 0
                    ? test.arguments
                    : (runtimeCallArgs && Array.isArray(runtimeCallArgs.arguments) ? runtimeCallArgs.arguments : []);
                const serializedArgTypes = Array.isArray(test.argumentTypes) && test.argumentTypes.length > 0
                    ? test.argumentTypes
                    : (runtimeCallArgs && Array.isArray(runtimeCallArgs.argumentTypes) ? runtimeCallArgs.argumentTypes : []);
                const serializedArgNames = Array.isArray(test.argumentNames) && test.argumentNames.length > 0
                    ? test.argumentNames
                    : (runtimeCallArgs && Array.isArray(runtimeCallArgs.argumentNames) ? runtimeCallArgs.argumentNames : []);
                const actualGraphSource = __$__.Testize.storedActualGraph[callLabel]
                    && __$__.Testize.storedActualGraph[callLabel][contextID];
                const actualGraphPayload = actualGraphSource
                    ? __$__.Testize.toPlainVisGraph(actualGraphSource)
                    : null;
                const precondGraphPayload = test.precond
                    ? __$__.Testize.toPlainVisGraph(test.precond)
                    : null;
                const expectedGraphPayload = test.testData
                    ? __$__.Testize.toPlainVisGraph(test.testData)
                    : null;
                const runtimeAlias = (actualGraphPayload && precondGraphPayload)
                    ? __$__.Testize.buildRuntimeAliasMapping(actualGraphPayload, precondGraphPayload)
                    : null;
                if (runtimeAlias && Object.keys(runtimeAlias).length > 0) {
                    __$__.Testize.mergeRuntimeAliasMapping(runtimeAliasMap, runtimeAlias);
                }
                let idMapping = null;
                if (actualGraphPayload) {
                    const mappingCandidates = [];
                    if (precondGraphPayload) {
                        mappingCandidates.push(
                            __$__.Testize.buildTempToActualIdMapping(actualGraphPayload, precondGraphPayload)
                        );
                    }
                    if (expectedGraphPayload) {
                        mappingCandidates.push(
                            __$__.Testize.buildTempToActualIdMapping(actualGraphPayload, expectedGraphPayload)
                        );
                    }
                    let bestScore = -1;
                    mappingCandidates.forEach((candidate) => {
                        if (!candidate) return;
                        const score = Object.keys(candidate).filter((key) => key.slice(0, 6) === '__temp').length;
                        if (score > bestScore) {
                            bestScore = score;
                            idMapping = candidate;
                        }
                    });
                }
                idMapping = __$__.Testize.sanitizeIdMapping(idMapping);
                if (idMapping && Object.keys(idMapping).length > 0) {
                    __$__.Testize.mergeRuntimeIdMapping(runtimeToTempMap, idMapping);
                }
                const normalizedReceiverObject = __$__.Testize.normalizeIdWithRuntimeMap(
                    receiverObject,
                    runtimeToTempMap,
                    runtimeAliasMap
                );
                const normalizedOperations = __$__.Testize.normalizeOperationsWithRuntimeMap(
                    test.operations,
                    runtimeToTempMap,
                    runtimeAliasMap
                );
                const receiverClassName = __$__.Testize.resolveReceiverClassName(
                    normalizedReceiverObject,
                    actualGraphPayload,
                    visGraphPayload
                );
                const methodInfo = __$__.Testize.findMethodDefinitionInfo(
                    methodName,
                    serializedArgs.length,
                    receiverClassName
                );
                const methodParamNames = methodInfo
                    ? methodInfo.paramNames
                    : [];

                const methodCallEntry = {
                    callLabel: callLabel,
                    contextSensitiveID: contextID,
                    receiverObject: normalizedReceiverObject,
                    methodName: methodName,
                    operations: normalizedOperations,
                    arguments: serializedArgs
                };
                if (serializedArgTypes.length > 0) {
                    methodCallEntry.argumentTypes = serializedArgTypes;
                }
                if (serializedArgNames.length > 0) {
                    methodCallEntry.argumentNames = serializedArgNames;
                }
                if (receiverClassName) {
                    methodCallEntry.receiverClassName = receiverClassName;
                }
                if (methodParamNames.length > 0) {
                    methodCallEntry.methodParamNames = methodParamNames;
                }
                if (precondGraphPayload) {
                    methodCallEntry.precondGraph = precondGraphPayload;
                }
                if (actualGraphPayload) {
                    methodCallEntry.actualGraph = actualGraphPayload;
                    if (idMapping && Object.keys(idMapping).length > 0) {
                        methodCallEntry.idMapping = idMapping;
                    } else {
                        methodCallEntry.idMapping = {};
                        console.warn(`[Testize] idMapping generation failed for ${callLabel}/${contextID}; empty idMapping is sent`);
                    }
                }

                methodCalls.push(methodCallEntry);
            }
        }

        // vis_graph が未設定の場合は、現在のテストグラフを直接取得
        if (!visGraphPayload && __$__.Testize.network && __$__.Testize.network.network) {
            const networkData = __$__.Testize.network.network.body && __$__.Testize.network.network.body.data;
            if (networkData && networkData.nodes && networkData.edges) {
                visGraphPayload = __$__.Testize.toPlainVisGraph({
                    nodes: networkData.nodes,
                    edges: networkData.edges
                });
            }
        }

        if (!visGraphPayload) {
            visGraphPayload = { nodes: [], edges: [] };
        }

        // transport は差し替え可能に保ち、payload 形は固定する
        __$__.Testize.dispatchSynthesisRequest({
            method_calls: methodCalls,
            vis_graph: visGraphPayload
        })
        .then(data => {
            if (!data) {
                console.warn("合成結果なし");
                return;
            }

            if (data.code) {
                console.log("合成結果:", data.code);
            }

            // メソッド呼び出しごとのコードも表示
            if (data.individual_codes) {
                console.log("個別メソッド呼び出しのコード:");
                data.individual_codes.forEach((code, index) => {
                    const methodCall = methodCalls[index];
                    if (!methodCall) return;
                    console.log(`--- ${methodCall.callLabel} (${methodCall.contextSensitiveID}) ---`);
                    console.log(code);
                });
            }

            let replacedMethod = false;
            if (typeof data.composed_method_code === 'string' && methodCalls.length > 0) {
                const primaryCall = methodCalls[0];
                const arityHint = Array.isArray(primaryCall.methodParamNames)
                    ? primaryCall.methodParamNames.length
                    : (Array.isArray(primaryCall.arguments) ? primaryCall.arguments.length : undefined);
                const classNameHint = typeof primaryCall.receiverClassName === 'string'
                    ? primaryCall.receiverClassName
                    : undefined;
                const auxMethods = Array.isArray(data.code)
                    ? data.code.filter(code => typeof code === 'string' && code.trim().length > 0)
                    : [];
                const seenAuxMethods = new Set();
                const auxMethodEntries = auxMethods
                    .map((source) => {
                        const name = __$__.Testize.extractMethodNameFromMethodSource(source);
                        const arity = __$__.Testize.extractMethodArityFromMethodSource(source);
                        return { source, name, arity };
                    })
                    .filter((entry) => {
                        if (!entry.name) return false;
                        const key = `${entry.name}:${entry.arity}`;
                        if (seenAuxMethods.has(key)) return false;
                        seenAuxMethods.add(key);
                        return true;
                    });
                const missingAuxMethods = [];
                const existingAuxMethods = [];
                auxMethodEntries.forEach((entry) => {
                    const existing = __$__.Testize.findMethodDefinitionInfo(entry.name, entry.arity, classNameHint);
                    if (existing) {
                        existingAuxMethods.push(entry);
                    } else {
                        missingAuxMethods.push(entry.source);
                    }
                });
                const replacementSource = missingAuxMethods
                    .concat([data.composed_method_code])
                    .join("\n\n");
                replacedMethod = __$__.Testize.replaceMethodDefinitionSource(
                    primaryCall.methodName,
                    arityHint,
                    replacementSource,
                    classNameHint
                );
                if (!replacedMethod) {
                    console.warn(`メソッド定義の置換に失敗: ${primaryCall.methodName}`);
                } else {
                    existingAuxMethods.forEach((entry) => {
                        const replacedAux = __$__.Testize.replaceMethodDefinitionSource(
                            entry.name,
                            entry.arity,
                            entry.source,
                            classNameHint
                        );
                        if (!replacedAux) {
                            console.warn(`補助メソッド定義の置換に失敗: ${entry.name}`);
                        }
                    });
                }
            }

            if (!replacedMethod) {
                // 結果をエディタに挿入（フォールバック）
                let resultText = "";

                // 個別のコードを先に表示
                if (data.individual_codes) {
                    data.individual_codes.forEach((line) => {
                        if (typeof line === 'string') {
                            resultText += `// ${line}\n`;
                        }
                    });
                    resultText += "\n";
                }

                if (typeof data.composed_method_code === 'string') {
                    resultText += "// composed_method_code (preview only; replacement failed)\n";
                    resultText += __$__.Testize.toLineComments(data.composed_method_code) + "\n\n";
                }

                // 共通パターンとホール情報も表示
                if (data.common_pattern) {
                    resultText += "// 共通パターン (ホール表現):\n";
                    resultText += __$__.Testize.toLineComments(data.common_pattern) + "\n\n";
                }

                if (data.hole_information) {
                    resultText += "// ホール情報:\n";
                    for (const [holeKey, values] of Object.entries(data.hole_information)) {
                        resultText += `// ${holeKey}: ${JSON.stringify(values)}\n`;
                    }
                }

                __$__.editor.session.insert(__$__.editor.getCursorPosition(), resultText);
            }
        })
        .catch(err => {
            console.error("合成中にエラー:", err);
        });
    },


    /**
     * @param {string} editType
     * @param {Object} data
     *
     * // information to be store
     * - add    Node       : id, label, isLiteral, (optional) type
     * - edit   Node(Label): id, label, isLiteral, (optional) type
     * - delete Node       : id
     * - add    Edge       : from, to, label
     * - edit   Edge(Refer): from, oldTo, newTo, label
     * - edit   Edge(Label): from, to, oldLabel, newLabel
     * - delete Edge       : from, to, label
     * - add    Variable       : to, label
     * - edit   Variable(Refer): oldTo, newTo, label
     * - edit   Variable(Label): to, oldLabel, newLabel
     * - delete Variable       : to, label
     */
    saveMouseOperation(editType, data) {
        let ope;
        switch (editType) {
            case 'addNode': {
                ope = {
                    editType: editType,
                    id: data.id,
                    label: data.label,
                    isLiteral: data.isLiteral,
                    type: data.type
                };
                __$__.Testize.focusedTestOperations.push(ope);
                if(ope.isLiteral){
                    console.log('var ' + ope.id + ' = ' + ope.label + ';');
                    __$__.Testize.storedtext.push('var ' + ope.id + ' = ' + ope.label + ';');
                }else{
                    console.log('var ' + ope.id + ' = new ' + ope.label + '();');
                    __$__.Testize.storedtext.push('var ' + ope.id + ' = new ' + ope.label + '();');
                }
                break;
            }
            case 'editNode': {
                ope = {
                    editType: editType,
                    id: data.id,
                    label: data.label,
                    isLiteral: data.isLiteral,
                    type: data.type
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'deleteNode': {
                ope = {
                    editType: editType,
                    id: data.id
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'addEdge': {
                ope = {
                    editType: editType,
                    from: data.from,
                    to: data.to,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                console.log(ope.from + '.' + ope.label + ' = ' + ope.to + ';');
                __$__.Testize.storedtext.push(ope.from + '.' + ope.label + ' = ' + ope.to + ';');
                break;
            }
            case 'editEdgeReference': {
                ope = {
                    editType: editType,
                    from: data.from,
                    // to: data.to,
                    oldTo: data.oldTo,
                    newTo: data.newTo,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                console.log(ope.from + '.' + ope.label + ' = ' + ope.newTo + ';');
                __$__.Testize.storedtext.push(ope.from + '.' + ope.label + ' = ' + ope.newTo + ';');
                break;
            }
            case 'editEdgeLabel': {
                ope = {
                    editType: editType,
                    from: data.from,
                    to: data.to,
                    oldLabel: data.oldLabel,
                    newLabel: data.newLabel
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'deleteEdge': {
                ope = {
                    editType: editType,
                    from: data.from,
                    to: data.to,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'addVariable': {
                ope = {
                    editType: editType,
                    to: data.to,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'editVariableReference': {
                ope = {
                    editType: editType,
                    oldTo: data.oldTo,
                    newTo: data.newTo,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'editVariableLabel': {
                ope = {
                    editType: editType,
                    to: data.to,
                    oldLabel: data.oldLabel,
                    newLabel: data.newLabel
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'deleteVariable': {
                ope = {
                    editType: editType,
                    to: data.to,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
        }
        console.log(...__$__.Testize.focusedTestOperations);
        console.log(__$__.Testize.storedtext);
    },


    // ==================================================================================
    // ====================================== end =======================================
    // ==================================================================================
    // ================== start: invoked by __$__.Update.CodeWithCP =====================
    // ==================================================================================


    matching(actualGraph, expectedGraph, returnObjectID = undefined, idMapping = undefined) {
        let objectDuplication_actual = __$__.Testize.constructObjectForTraverse(actualGraph.nodes, actualGraph.edges, returnObjectID);

        let objectDuplication_expected = __$__.Testize.constructObjectForTraverse(expectedGraph.nodes, expectedGraph.edges);

        let referencedObjects_runtime = Object.keys(objectDuplication_actual);

        return referencedObjects_runtime.length !== 0 && referencedObjects_runtime.every(function (variableName, idx, arr) {
            let obj_actual   = objectDuplication_actual[variableName];
            let obj_expected = objectDuplication_expected[variableName];

            if (obj_expected) {
                let result = __$__.Testize.traverseSimultaneously(obj_actual, obj_expected, idMapping);

                if (!result) return false;

                delete objectDuplication_actual[variableName];
                delete objectDuplication_expected[variableName];
            } else {
                return false;
            }

            return idx !== arr.length - 1 || Object.keys(objectDuplication_expected).length === 0;
        });
    },


    buildTempToActualIdMapping(actualGraph, expectedGraph, returnObjectID = undefined) {
        if (!actualGraph || !expectedGraph) return null;
        const idMapping = {};
        const matched = __$__.Testize.matchingForIdMapping(actualGraph, expectedGraph, returnObjectID, idMapping);
        if (!matched && Object.keys(idMapping).length === 0) return null;
        return idMapping;
    },


    buildRuntimeAliasMapping(actualGraph, expectedGraph, returnObjectID = undefined) {
        if (!actualGraph || !expectedGraph) return null;
        const aliasMapping = {};
        const matched = __$__.Testize.matchingForRuntimeAlias(
            actualGraph,
            expectedGraph,
            returnObjectID,
            aliasMapping
        );
        if (!matched && Object.keys(aliasMapping).length === 0) return null;
        return aliasMapping;
    },


    matchingForIdMapping(actualGraph, expectedGraph, returnObjectID = undefined, idMapping = undefined) {
        const objectDuplication_actual = __$__.Testize.constructObjectForTraverse(actualGraph.nodes, actualGraph.edges, returnObjectID);
        const objectDuplication_expected = __$__.Testize.constructObjectForTraverse(expectedGraph.nodes, expectedGraph.edges);
        const expectedRoots = Object.keys(objectDuplication_expected);
        if (expectedRoots.length === 0) return false;

        return expectedRoots.every((variableName) => {
            const obj_expected = objectDuplication_expected[variableName];
            const obj_actual = objectDuplication_actual[variableName];
            if (!obj_expected || !obj_actual) return false;
            return __$__.Testize.traverseForIdMapping(obj_actual, obj_expected, idMapping);
        });
    },


    matchingForRuntimeAlias(actualGraph, expectedGraph, returnObjectID = undefined, aliasMapping = undefined) {
        const objectDuplication_actual = __$__.Testize.constructObjectForTraverse(actualGraph.nodes, actualGraph.edges, returnObjectID);
        const objectDuplication_expected = __$__.Testize.constructObjectForTraverse(expectedGraph.nodes, expectedGraph.edges);
        const expectedRoots = Object.keys(objectDuplication_expected);
        if (expectedRoots.length === 0) return false;

        return expectedRoots.every((variableName) => {
            const obj_expected = objectDuplication_expected[variableName];
            const obj_actual = objectDuplication_actual[variableName];
            if (!obj_expected || !obj_actual) return false;
            return __$__.Testize.traverseForRuntimeAlias(obj_actual, obj_expected, aliasMapping);
        });
    },


    traverseForIdMapping(obj_actual, obj_expected, idMapping = undefined) {
        const info_actual = obj_actual.__info;
        const info_expected = obj_expected.__info;

        if (info_expected.id.slice(0, 6) === '__temp') {
            if (idMapping) idMapping[info_expected.id] = info_actual.id;
            info_expected.id = info_actual.id;
        } else if (__$__.Testize.isRuntimeScopedId(info_expected.id)) {
            // Runtime scoped IDs are unstable across re-synthesis; compare by structure instead.
            info_expected.id = info_actual.id;
        }

        const sameLiteralKind = (!info_actual.literal === !info_expected.literal);
        const samePropCount = info_actual.prop.length === info_expected.prop.length;
        const idCompatible = info_expected.id.slice(0, 6) === '__temp'
            ? true
            : info_actual.id === info_expected.id;
        // ID mapping extraction should be robust against literal representation differences
        // such as "25" vs 25 in expected/runtime graphs.
        const labelCompatible = info_actual.literal || info_expected.literal
            ? true
            : info_actual.label === info_expected.label;
        const isMatching = sameLiteralKind && samePropCount && idCompatible && labelCompatible;

        if (!isMatching) return false;

        if (info_actual.checked) return true;
        info_actual.checked = true;
        info_expected.checked = true;

        return info_actual.prop.every((prop) => {
            const nextObj_actual = obj_actual[prop];
            const nextObj_expected = obj_expected[prop];
            if (!nextObj_expected) return false;
            return __$__.Testize.traverseForIdMapping(nextObj_actual, nextObj_expected, idMapping);
        });
    },


    traverseForRuntimeAlias(obj_actual, obj_expected, aliasMapping = undefined) {
        const info_actual = obj_actual.__info;
        const info_expected = obj_expected.__info;
        const expectedId = info_expected.id;
        const expectedIsTemp = expectedId.slice(0, 6) === '__temp';
        const expectedIsRuntime = __$__.Testize.isRuntimeScopedId(expectedId);

        if (expectedIsRuntime) {
            if (aliasMapping) aliasMapping[expectedId] = info_actual.id;
            info_expected.id = info_actual.id;
        } else if (expectedIsTemp) {
            info_expected.id = info_actual.id;
        }

        const sameLiteralKind = (!info_actual.literal === !info_expected.literal);
        const samePropCount = info_actual.prop.length === info_expected.prop.length;
        const idCompatible = (expectedIsTemp || expectedIsRuntime)
            ? true
            : info_actual.id === info_expected.id;
        const labelCompatible = info_actual.literal || info_expected.literal
            ? true
            : info_actual.label === info_expected.label;
        const isMatching = sameLiteralKind && samePropCount && idCompatible && labelCompatible;

        if (!isMatching) return false;

        if (info_actual.checked) return true;
        info_actual.checked = true;
        info_expected.checked = true;

        return info_actual.prop.every((prop) => {
            const nextObj_actual = obj_actual[prop];
            const nextObj_expected = obj_expected[prop];
            if (!nextObj_expected) return false;
            return __$__.Testize.traverseForRuntimeAlias(nextObj_actual, nextObj_expected, aliasMapping);
        });
    },


    /**
     * @param {Array} objects
     * @param {Object} probe
     * @param {Object} retObj
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     *
     * @return {boolean} result
     */
    checkActualGraph(objects, probe, retObj, callLabel, context_sensitiveID) {
        if (!__$__.Testize.hasTest(callLabel, context_sensitiveID))
            return true;


        let actualGraph = jQuery.extend(true, {}, __$__.Testize.storedActualGraph[callLabel][context_sensitiveID]);
        let testInfo = __$__.Testize.storedTest[callLabel][context_sensitiveID];
        let expectedGraph = {
            nodes: Object.values(testInfo.testData.nodes._data),
            edges: Object.values(testInfo.testData.edges._data)
        };
        let returnObjectID = (retObj && typeof retObj === 'object' && retObj.__id) ? retObj.__id : undefined;

        let result = __$__.Testize.matching(actualGraph, expectedGraph, returnObjectID);

        __$__.Testize.storedTest[callLabel][context_sensitiveID].passed = result;
        return result;
    },


    /**
     * @param {Array} objects
     * @param {Object} probe
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     */
    storeActualGraph(objects, probe, callLabel, context_sensitiveID) {
        if (!__$__.Testize.storedActualGraph[callLabel]) __$__.Testize.storedActualGraph[callLabel] = {};
        if (objects) {
            __$__.Testize.storedActualGraph[callLabel][context_sensitiveID] = __$__.Traverse.traverse(objects, probe).generateVisjsGraph(true);
        } else {
            __$__.Testize.storedActualGraph[callLabel][context_sensitiveID] = undefined;
        }
    },


    /**
     * @param {Array} objects
     * @param {Object} probe
     * @param {Object} retObj
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     * @param {Array} classes
     *
     * @return {Object} result
     */
    override(objects, probe, retObj, callLabel, context_sensitiveID, classes) {
        let variableReferences = {};
        let newObjects = [];
        let testData = __$__.Testize.storedTest[callLabel][context_sensitiveID].testData;

        // make edge information
        let edgeDir = {};
        let varInfo = {};
        let runtimeObjects = {};
        Object.values(testData.edges._data).forEach(edge => {
            let from = edge.from;
            if (from.slice(0, 11) === '__Variable-') {
                let variableName = edge.label;
                let node = testData.nodes.get(edge.to);
                varInfo[variableName] = {
                    to: edge.to,
                    label: variableName, // variable name
                    isLiteral: node.isLiteral,
                    type: node.type
                };

                // create newly constructed object
                if (edge.to.slice(0, 6) === '__temp' && !node.isLiteral) {
                    let className = testData.nodes.get(edge.to).label;
                    let newObject = Object.create(classes[className].prototype);
                    Object.setProperty(newObject, '__id', edge.to);
                    Object.setProperty(newObject, '__ClassName__', className);
                    runtimeObjects[edge.to] = newObject;
                    newObjects.push(newObject);
                }
            } else {
                if (!edgeDir[from]) edgeDir[from] = [];
                edgeDir[from].push({
                    to: edge.to,
                    label: edge.label
                });
            }
        });

        // to grasp all objects which are constructed at runtime.
        //   key: object id
        // value: runtime object
        // here, collect runtimeObjects and delete all properties of all objects
        objects.concat(Object.values(probe)).forEach(obj => {
            if (!obj || runtimeObjects[obj.__id] || obj === null || obj === undefined || obj === __$__.Update)
                return;

            __$__.Testize.traverse(obj, runtimeObjects);
        });


        // remove objects which this test does not include from __objs.
        let i = 0;
        while (i < objects.length) {
            let obj = objects[i];
            if (testData.nodes._data[obj.__id]) {
                i++;
            } else {
                objects.splice(i, 1);
            }
        }


        let queueForSetProp = Object.values(runtimeObjects);
        while (queueForSetProp.length > 0) {
            let obj = queueForSetProp.shift();
            let objectID = obj.__id;

            if (edgeDir[objectID]) {
                edgeDir[objectID].forEach(edge => {
                    let nextObject;
                    if (!runtimeObjects[edge.to]) {
                        let newlyConstructedNode = testData.nodes.get(edge.to);
                        if (!newlyConstructedNode.isLiteral) {
                            nextObject = Object.create(classes[newlyConstructedNode.label].prototype);
                            if (edge.to.slice(0, 6) !== '__temp') {
                                // update the test
                                let newID, i = 1;
                                while (!newID) {
                                    let candidate = '__temp' + i;
                                    if (!testData.nodes.get(candidate)) newID = candidate;
                                    i++;
                                }
                                let nodeInfo = testData.nodes.get(newlyConstructedNode.id);
                                nodeInfo.id = newID;
                                testData.nodes.add(nodeInfo);
                                testData.nodes.remove(newlyConstructedNode.id);
                                Object.values(testData.edges._data).forEach(edge => {
                                    if (edge.from === newlyConstructedNode.id)
                                        testData.edges.update({
                                            id: edge.id,
                                            from: newID
                                        });
                                    if (edge.to === newlyConstructedNode.id)
                                        testData.edges.update({
                                            id: edge.id,
                                            to: newID
                                        });
                                });
                                newlyConstructedNode = nodeInfo;
                            }
                            Object.setProperty(nextObject, '__id', newlyConstructedNode.id);
                            Object.setProperty(nextObject, '__ClassName__', newlyConstructedNode.label);
                            queueForSetProp.push(nextObject);
                            runtimeObjects[nextObject.__id] = nextObject;
                            newObjects.push(nextObject);
                        } else {
                            // case of literal
                            let literalNode = testData.nodes.get(edge.to);
                            __$__.StorePositions.updateIDForExpectedStructure(edge.to, obj.__id + '-' + edge.label);
                            if (literalNode.type === 'number') {
                                nextObject = Number(literalNode.label);
                            } else {
                                nextObject = literalNode.label;
                            }
                        }
                    } else {
                        nextObject = runtimeObjects[edge.to];

                        if (!nextObject) {
                            // case of literal
                            let literalNode = testData.nodes.get(edge.to);
                            __$__.StorePositions.updateIDForExpectedStructure(edge.to, obj.__id + '-' + edge.label);
                            if (literalNode.type === 'number') {
                                nextObject = Number(literalNode.label);
                            } else {
                                nextObject = literalNode.label;
                            }
                        }
                    }
                    obj[edge.label] = nextObject;
                });
            }
        }


        // use varInfo to make return object which is used to change the variable references
        Object.keys(probe).forEach(v => {
            if (v === 'this') return;
            let object = probe[v];
            if (!object || __$__.Traverse.literals[typeof object] ||  object.__id === varInfo[v].to) {
                // do nothing
            } else {
                variableReferences[v] = runtimeObjects[varInfo[v].to];
            }
        });


        Object.keys(varInfo).forEach(v => {
            if (v === 'this') return;
            else if (v === 'return') {
                if (varInfo[v].isLiteral)
                    if (varInfo[v].type === 'number')
                        variableReferences.__retObj = parseFloat(testData.nodes.get(varInfo[v].to).label);
                    else
                        variableReferences.__retObj = testData.nodes.get(varInfo[v].to).label;
                else
                    variableReferences.__retObj = runtimeObjects[varInfo[v].to];
            } else if (!variableReferences[v]) {
                if (varInfo[v].isLiteral)
                    if (varInfo[v].type === 'number')
                        variableReferences[v] = parseFloat(testData.nodes.get(varInfo[v].to).label);
                    else
                        variableReferences[v] = testData.nodes.get(varInfo[v].to).label;
                else
                    variableReferences[v] = runtimeObjects[varInfo[v].to];
            }
        });

        // if there is no "return" arrow in the test graph
        if (!variableReferences.__retObj) {
            // if the function inserted this test returns an object at runtime
            if (typeof retObj !== "function" && retObj !== null && retObj !== undefined && !__$__.Traverse.literals[typeof retObj]) {
                variableReferences.__retObj = undefined;
            }
        }

        return {
            newObjects: newObjects,
            variableReferences: variableReferences
        };
    },


    traverse: function(obj, referableObjects, literals) {
        if (obj.__id && !referableObjects[obj.__id]) {
            referableObjects[obj.__id] = obj;
        } else {
            return;
        }

        Object.keys(obj).forEach(prop => {
            // Don't search if the head of property name is "__"
            if (prop.slice(0, 2) === '__')
                return;

            // "to" is destination of edge
            let to = obj[prop];

            if (typeof to !== "function" && to !== null && to !== undefined) {
                if (!__$__.Traverse.literals[typeof to]) { // if "to" is object
                    __$__.Testize.traverse(to, referableObjects);
                }
            }

            delete obj[prop];
        });
    },


    /**
     * @param {Array} objects
     * @param {Object} probe
     * @param {Object} retObj
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     * @param {boolean} errorOccurred
     * @param {Array} classes
     *
     * @return {Object}
     *
     * This function checks whether the runtime structure matches the test structure
     * and overrides the runtime objects if the test failed
     * This function returns Object {variableName: Object} which represents variable reference information we want to override.
     * If the test passed, this function returns an empty object.
     */
    testAndOverride(objects, probe, retObj, callLabel, context_sensitiveID, errorOccurred, classes) {
        let passed = !errorOccurred && __$__.Testize.checkActualGraph(objects, probe, retObj, callLabel, context_sensitiveID);

        __$__.Testize.storedTest[callLabel][context_sensitiveID].passed = passed;

        if (passed) {
            // if passed
            return {
                newObjects: [],
                variableReferences: {}
            };
        } else {
            // if failed
            return __$__.Testize.override(objects, probe, retObj, callLabel, context_sensitiveID, classes);
        }
    },


    traverseSimultaneously(obj_actual, obj_expected, idMapping = undefined) {
        let info_actual = obj_actual.__info;
        let info_expected = obj_expected.__info;

        if (info_expected.id.slice(0, 6) === '__temp') {
            if (idMapping) idMapping[info_expected.id] = info_actual.id;
            info_expected.id = info_actual.id;
        } else if (__$__.Testize.isRuntimeScopedId(info_expected.id)) {
            // Runtime scoped IDs are unstable across re-synthesis; compare by structure instead.
            info_expected.id = info_actual.id;
        }
        let isMatching = (info_actual.prop.length === info_expected.prop.length)
                      && (info_actual.id          === info_expected.id)
                      && (info_actual.label       === info_expected.label)
                      && (!info_actual.literal    === !info_expected.literal);

        if (isMatching) {
            // check recursively
            if (!info_actual.checked) {
                info_actual.checked = true;
                info_expected.checked = true;

                let result = info_actual.prop.every(prop => {
                    let nextObj_actual   = obj_actual[prop];
                    let nextObj_expected = obj_expected[prop];
                    if (!nextObj_expected) return false;

                    let result = __$__.Testize.traverseSimultaneously(nextObj_actual, nextObj_expected, idMapping);

                    return result;
                });
                if (!result) return false;
            }

            return true;
        } else {
            return false;
        }
    },


    constructObjectForTraverse(nodes, edges, returnObjectID = null) {
        let variables = {};
        let objects = {};
        nodes.forEach(node => {
            objects[node.id] = {
                __info: {
                    id: node.id,
                    label: node.label,
                    literal: node.color && node.color.background === 'white',
                    prop: [],
                    propObj: {}
                }
            };
            if (node.id === returnObjectID) {
                variables.return = objects[node.id];
            }
        });
        edges.forEach(edge => {
            if (edge.from.slice(0, 11) === '__Variable-') {
                variables[edge.label] = objects[edge.to];
            } else {
                let prop = edge.label;
                objects[edge.from][prop] = objects[edge.to];
                objects[edge.from].__info.propObj[prop] = objects[edge.from].__info.prop.length;
                objects[edge.from].__info.prop.push(prop);
            }
        });

        return variables;
    },


    hasTest(callLabel, context_sensitiveID) {
        return __$__.Testize.storedTest[callLabel] && __$__.Testize.storedTest[callLabel][context_sensitiveID];
    },


    extractUsedClassNames(callLabel, context_sensitiveID) {
        let testData = __$__.Testize.storedTest[callLabel][context_sensitiveID].testData;
        let retObj = {};
        Object.values(testData.nodes._data).forEach(node => {
            let id = node.id;
            let label = node.label;
            if (id.slice(0, 11) === '__Variable-') {
                return;
            } else if (id === '__RectForVariable__') {
                return;
            } else {
                if (id.slice(0, 6) === '__temp' && !node.isLiteral) {
                    retObj[label] = true;
                }
            }
        });
        return Object.keys(retObj);
    },


    /**
     * @param {Array} objects
     * @param {Object} probe
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     *
     * This function is called before executing a function call which has a test.
     * First, check whether the runtime graph matches the stored precondition graph.
     * Second, if doesn't match, execute the following two steps.
     *   - update the precondition graph of this function call
     *   - reconstruct the test of this function call by using operations when the test is constructed by mouse operation
     */
    checkPrecondGraph(objects, probe, callLabel, context_sensitiveID) {
        if (__$__.Testize.storedTest[callLabel] && __$__.Testize.storedTest[callLabel][context_sensitiveID]) {
            let testInfo = __$__.Testize.storedTest[callLabel][context_sensitiveID];
            let newPrecond = __$__.Traverse.traverse(objects, probe).generateVisjsGraph();
            if (testInfo.precond) {
                if (!__$__.Testize.matching(newPrecond, testInfo.precond)) {
                    testInfo.precond = newPrecond;
                    let newTestGraph = __$__.Testize.tryReconstructingTest(newPrecond, callLabel, context_sensitiveID);
                    if (newTestGraph) {
                        testInfo.testData = {
                            nodes: new vis.DataSet(newTestGraph.nodes),
                            edges: new vis.DataSet(newTestGraph.edges)
                        };
                        testInfo.testReconstructionFailed = false;
                    } else {
                        testInfo.testReconstructionFailed = true;
                    }
                }
            } else {
                testInfo.precond = newPrecond;
            }
        }
    },


    /**
     * @param {Object} precond (graph formatted to vis.js)
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     */
    tryReconstructingTest(precond, callLabel, context_sensitiveID) {
        let testInfo = __$__.Testize.storedTest[callLabel][context_sensitiveID];
        let testGraph = jQuery.extend(true, {}, precond);
        let operations = testInfo.operations;
        try {
            for (let i = 0; i < operations.length; i++) {
                __$__.Testize.applyOperation(testGraph, operations[i]);
            }
        } catch (e) {
            return;
        }
        return testGraph;
    },


    /**
     * @param {Object} visGraph
     * @param {Object} ope
     */
    applyOperation(visGraph, ope) {
        switch (ope.editType) {
            case 'addNode': {
                // id, label, isLiteral (optional) type
                let newNode = {
                    id: ope.id,
                    label: ope.label,
                    isLiteral: ope.isLiteral,
                    type: ope.type,
                    fixed: true,
                    color: ope.isLiteral ? __$__.Testize.makeLiteralColor() : null
                };
                if (!visGraph.nodes.find(node => node.id === ope.id)) {
                    visGraph.nodes.push(newNode);
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'editNode': {
                // id, label, isLiteral (optional) type
                let nodeToEdit = visGraph.nodes.find(node => node.id === ope.id);
                if (nodeToEdit) {
                    nodeToEdit.label = ope.label;
                    nodeToEdit.isLiteral = ope.isLiteral;
                    nodeToEdit.type = ope.type;
                    nodeToEdit.color = ope.isLiteral ? __$__.Testize.makeLiteralColor() : null;
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'deleteNode': {
                // id
                let i = 0;
                while (i < visGraph.nodes.length) {
                    let node = visGraph.nodes[i];
                    if (node.id === ope.id) {
                        visGraph.nodes.splice(i, 1);
                        i = -1;
                        break;
                    } else {
                        i++;
                    }
                }
                if (i === -1) {
                    i = 0;
                    while (i < visGraph.edges.length) {
                        let edge = visGraph.edges[i];

                        if (edge.from === ope.id || edge.to === ope.id) visGraph.edges.splice(i, 1);
                        else i++;
                    }
                }

                break;
            }
            case 'addEdge': {
                // from, to, label
                // memo: How should Kanon do when the from-node already has the property?
                let checked = {from: false, to: false};
                visGraph.nodes.forEach(node => {
                    checked.from = checked.from || node.id === ope.from;
                    checked.to = checked.to || node.id === ope.to;
                });
                if (checked.from && checked.to) {
                    let alreadyDefined = visGraph.edges.some(edge => {
                        if (edge.from === ope.from && edge.label === ope.label) {
                            edge.to = ope.to;
                            return true;
                        }
                    });
                    if (!alreadyDefined) {
                        visGraph.edges.push({
                            from: ope.from,
                            to: ope.to,
                            label: ope.label
                        });
                    }
                } else {
                    // error(?)
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'editEdgeReference': {
                // from, oldTo, newTo, label
                let edgeToEdit = visGraph.edges.find(edge => edge.from === ope.from && edge.to === ope.oldTo && edge.label === ope.label);
                if (edgeToEdit) {
                    edgeToEdit.to = ope.newTo;
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'editEdgeLabel': {
                // from, to, oldLabel, newLabel
                let edgeToEdit = visGraph.edges.find(edge => edge.from === ope.from && edge.to === ope.to && edge.label === ope.oldLabel);
                if (edgeToEdit) {
                    edgeToEdit.label = ope.newLabel;
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'deleteEdge': {
                // from, to, label
                let i = 0;
                while (i < visGraph.edges.length) {
                    let edge = visGraph.edges[i];
                    if (edge.from === ope.from && edge.to === ope.to && edge.label === ope.label) {
                        visGraph.edges.splice(i, 1);
                        break;
                    } else {
                        i++;
                    }
                }
                break;
            }
            case 'addVariable': {
                // to, label
                // memo: How should Kanon do when the from-node already has the property?
                let hiddenNodeID = '__Variable-' + ope.label;
                let referredNode = visGraph.nodes.find(node => node.id === ope.to);
                let variableEdge = visGraph.edges.find(edge => edge.from === hiddenNodeID);
                if (referredNode) {
                    if (variableEdge) {
                        variableEdge.to = ope.to;
                    } else {
                        visGraph.nodes.push({
                            id: hiddenNodeID,
                            label: ope.label,
                            hidden: true
                        });
                        visGraph.edges.push({
                            from: hiddenNodeID,
                            to: ope.to,
                            label: ope.label,
                            color: (ope.label === 'return') ? 'black' : 'seagreen'
                        });
                    }
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'editVariableReference': {
                // oldTo, newTo, label
                let variableNodeID = '__Variable-' + ope.label;
                let edgeToEdit = visGraph.edges.find(edge => edge.from === variableNodeID);
                if (edgeToEdit) {
                    edgeToEdit.to = ope.newTo;
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'editVariableLabel': {
                // to, oldLabel, newLabel
                let variableNodeID = '__Variable-' + ope.oldLabel;
                let edgeToEdit = visGraph.edges.find(edge => edge.from === variableNodeID && edge.to === ope.to && edge.label === ope.oldLabel);
                if (edgeToEdit) {
                    edgeToEdit.label = ope.newLabel;
                    let variableNode = visGraph.nodes.find(node => node.id === variableNodeID);
                    variableNode.label = ope.newLabel;
                    variableNode.id = '__Variable-' + ope.newLabel;
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'deleteVariable': {
                // to, label
                let variableNodeID = '__Variable-' + ope.label;
                let i = 0;
                while (i < visGraph.nodes.length) {
                    let node = visGraph.nodes[i];
                    if (node.id === variableNodeID) {
                        visGraph.nodes.splice(i, 1);
                        i = -1;
                        break;
                    }
                    else i++;
                }
                if (i === -1) {
                    i = 0;
                    while (i < visGraph.edges.length) {
                        let edge = visGraph.edges[i];
                        if (edge.from === variableNodeID && edge.label === ope.label) {
                            visGraph.edges.splice(i, 1);
                            i === -1;
                            break;
                        }
                        else i++;
                    }
                }
                break;
            }
        }
    },


    // ==================================================================================
    // ====================================== end =======================================
    // ==================================================================================


    cancelEdit(callback) {
        __$__.Testize.clearPopUp();
        callback(null);
    },


    clearPopUp() {
        document.getElementById('saveButtonForTestize').onclick = null;
        document.getElementById('cancelButtonForTestize').onclick = null;
        document.getElementById('network-popUp').style.display = 'none';
    },


    createWindow(width, height, title) {
        // To be checked
        // __$__.Testize.window.testGraph = new Window({className: 'mac_os_x', width: width, height: height, zIndex: 300, title: title});
        // __$__.Testize.window.runtimeGraph = new Window({className: 'mac_os_x', width: width, height: height, zIndex: 500, title: 'actual object graph'});
        __$__.Testize.window.testGraph = new jBox('Modal', {
            attach: '.show_testGraph',
            width: width,
            height: height,
            position: { x: 'center', y: 'center' },
            title: 'Set a new test',
            overlay: false,
            content: '',
            draggable: 'title',
            animation: 'pulse',
            zIndex: 300,
            reposition: true,
            repositionOnOpen: false,
            repositionOnContent: false
          });
        __$__.Testize.window.runtimeGraph = new jBox('Modal', {
            attach: '#actualGraphButton',
            width: width,
            height: height,
            position: { x: 'center', y: 'center' },
            title: 'Actual Graph',
            overlay: false,
            content: '',
            draggable: 'title',
            animation: 'pulse',
            zIndex: 500,
            reposition: true,
            repositionOnOpen: false,
            repositionOnContent: false
          });
        // To be checked
        // __$__.Testize.window.testGraph.getContent().update('<div id="window-for-manipulation"></div>');
        // __$__.Testize.window.runtimeGraph.getContent().update('<div id="window-for-actualGraph"></div>');
        __$__.Testize.window.testGraph.setContent('<div id="window-for-manipulation"></div>');
        __$__.Testize.window.runtimeGraph.setContent('<div id="window-for-actualGraph"></div>');
        let windowSelection = __$__.d3.select('#window-for-manipulation');

        let header = windowSelection.append('div')
            .attr('id', 'window-header');

        header.append('text')
            .attr('id', 'acceptButton')
            .text('accept')
            .on('click', function (e) {
                // this function is invoked when this button is clicked.
                __$__.Testize.setTest();
                // To be checked - このままでOK
                // __$__.Testize.window.testGraph.close();
                __$__.Testize.window.testGraph.close();
                __$__.StorePositions.registerPositionsOfExpectedStructure();
                __$__.Update.PositionUpdate([{
                    start: {row: 0, column: 0},
                    end: {row: 0, column: 0},
                    lines: [""],
                    action: 'insert'
                }]);
            })
            .on('mouseover', function (e) {
                this.style.cursor = 'pointer';
            })
            .on('mouseout', function (e) {
                this.style.cursor = 'default';
            });

        header.append('text')
            .attr('id', 'actualGraphButton')
            .text('actual graph')
            .on('click', function (e) {
                __$__.Testize.openRuntimeGraphWin();
            })
            .on('mouseover', function (e) {
                this.style.cursor = 'pointer';
            })
            .on('mouseout', function (e) {
                this.style.cursor = 'default';
            });

        windowSelection.append('div')
            .attr('id', 'window-body');

        jQuery('#network-popUp').appendTo('#window-for-manipulation');

        let networkInfo = __$__.Testize.network;
        networkInfo.container = document.getElementById('window-body');
        networkInfo.network = new vis.Network(
            networkInfo.container,
            {nodes: new vis.DataSet({}), edges: new vis.DataSet({})},
            networkInfo.options
        );

        let actualGraphNetworkInfo = __$__.Testize.actualGraphNetwork;
        actualGraphNetworkInfo.container = document.getElementById('window-for-actualGraph');
        actualGraphNetworkInfo.network = new vis.Network(
            actualGraphNetworkInfo.container,
            {nodes: new vis.DataSet({}), edges: new vis.DataSet({})},
            actualGraphNetworkInfo.options
        );

        // set event handlers
        (() => {
            let holding = false;
            let clicked = false;
            networkInfo.network.on('hold', function(param) {
                holding = true;
                // holding event
                __$__.Testize.holdingEvent(param);
            });
            networkInfo.network.on('release', function(param) {
                if (holding) {
                    holding = false;
                    clicked = false;
                } else {
                    if (clicked) {
                        // double click event
                        __$__.Testize.doubleClickEvent(param);
                        clicked = false;
                        return
                    }

                    clicked = true;
                    setTimeout(function click() {
                        // single click event
                        if (clicked) {
                            __$__.Testize.clickEvent(param);
                        }
                        clicked = false;
                    }, 300);
                }
            });
            networkInfo.network.on('dragStart', params => {
                if (params.nodes.length > 0) {
                    let nodeId = params.nodes[0];
                    networkInfo.network.body.data.nodes.update({id: nodeId, fixed: false});
                }
            });
            networkInfo.network.on('dragEnd', params => {
                if (params.nodes.length > 0) {
                    let nodeId = params.nodes[0];
                    networkInfo.network.body.data.nodes.update({
                        id: nodeId,
                        x: networkInfo.network.getPositions(nodeId).x,
                        y: networkInfo.network.getPositions(nodeId).y,
                        fixed: true
                    });
                }
            });
            actualGraphNetworkInfo.network.on('dragStart', params => {
                if (params.nodes.length > 0) {
                    let nodeId = params.nodes[0];
                    actualGraphNetworkInfo.network.body.data.nodes.update({id: nodeId, fixed: false});
                }
            });
            actualGraphNetworkInfo.network.on('dragEnd', params => {
                if (params.nodes.length > 0) {
                    let nodeId = params.nodes[0];
                    actualGraphNetworkInfo.network.body.data.nodes.update({
                        id: nodeId,
                        x: actualGraphNetworkInfo.network.getPositions(nodeId).x,
                        y: actualGraphNetworkInfo.network.getPositions(nodeId).y,
                        fixed: true
                    });
                }
            });
        })();

        // Observerにウィンドウがリサイズ・閉じたときのtestGraph/runtimeGraph挙動を登録
        // -> 当ファイルのredraw()に統合し、ecentHundler.jsからリサイズ時に呼ぶ
        // 1. Resize時はそれぞれ再描画（ウィンドウサイズを再計算）
        // 2. testGraphはClose時にruntimeGraphにフォーカスを移す
        // Windows.addObserver({
        //     onResize(eventName, win) {
        //         if (win === __$__.Testize.window.testGraph) {
        //             __$__.Testize.network.network.redraw();
        //         } else if (win === __$__.Testize.window.runtimeGraph) {
        //             __$__.Testize.actualGraphNetwork.network.redraw();
        //         }
        //     },
        //     onClose(eventName, win) {
        //         if (win === __$__.Testize.window.testGraph) {
        //             __$__.Testize.focusedTestOperations = undefined;
        //             __$__.Testize.window.runtimeGraph.close();
        //         } else if (win === __$__.Testize.window.runtimeGraph) {
        //         }
        //     }
        // });
    },


    displayTooltip(div, label) {
        div.style.display = 'inline';
        if (div === __$__.Testize.popup_addTest) {
            __$__.Testize.popup_removeTest.style.display = 'none';
        } else {
            __$__.Testize.popup_addTest.style.display = 'none';
        }
        __$__.Testize.hoveringCallInfo.label = label;
        __$__.Testize.hoveringCallInfo.div = div;
    },


    divOfPopup(callLabel, context_sensitiveID) {
        if (!context_sensitiveID) {
            let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[callLabel].start).loop;
            context_sensitiveID = __$__.Context.SpecifiedContext[loopLabelAroundCall];
        }
        if (__$__.Testize.storedTest[callLabel] && __$__.Testize.storedTest[callLabel][context_sensitiveID]) {
            return __$__.Testize.popup_removeTest;
        } else {
            return __$__.Testize.popup_addTest;
        }
    },


    /**
     * @param e
     *
     * this function is callback when the mouse moves over the editor.
     */
    mousemove(e) {
        let position = e.getDocumentPosition();
        let cursorPos = {line: position.row + 1, column: position.column};
        let compare = __$__.UpdateLabelPos.ComparePosition;
        if (cursorPos) {
            let label = Object.keys(__$__.Testize.callParenthesisPos).reduceNative((accLabel, currentLabel) => {
                let callPos = __$__.Testize.callParenthesisPos[currentLabel];
                if (compare(callPos.start, '<=', cursorPos) && compare(cursorPos, '<', callPos.end)) {
                    if (!currentLabel || compare(__$__.Testize.callParenthesisPos[currentLabel].start, '<=', callPos.start)) {
                        return currentLabel;
                    }
                }
                return accLabel;
            }, undefined);

            // if the popup is already displayed.
            if (__$__.Testize.hoveringCallInfo.label) {
                // check whether Kanon should remove the popup
                let div = __$__.Testize.hoveringCallInfo.div;
                let divRect = div.getBoundingClientRect();
                let pixelPosition = __$__.editor.renderer.textToScreenCoordinates({
                    row: __$__.Testize.callParenthesisPos[__$__.Testize.hoveringCallInfo.label].start.line - 1,
                    column: __$__.Testize.callParenthesisPos[__$__.Testize.hoveringCallInfo.label].start.column
                });
                let lineHeight = __$__.editor.renderer.lineHeight;

                // if Kanon should continue to display the same popup
                if (Math.abs((__$__.mouse.pageX - pixelPosition.pageX) * 2) <= divRect.width
                    && pixelPosition.pageY - divRect.height - lineHeight/2 <= __$__.mouse.pageY
                    && __$__.mouse.pageY <= pixelPosition.pageY + lineHeight) {
                    // do nothing
                } else { // if Kanon should display newly popup
                    if (label) {
                        let newDiv = __$__.Testize.divOfPopup(label);
                        __$__.Testize.updateTooltipPos(__$__.editor.renderer.textToScreenCoordinates({
                            row: __$__.Testize.callParenthesisPos[label].start.line - 1,
                            column: __$__.Testize.callParenthesisPos[label].start.column
                        }), newDiv);
                        __$__.Testize.displayTooltip(newDiv, label);
                    } else {
                        __$__.Testize.removeTooltip(div);
                    }
                }
            } else { // any popups aren't displayed
                // if Kanon should display newly popup
                if (label) {
                    let newDiv = __$__.Testize.divOfPopup(label);
                    __$__.Testize.updateTooltipPos(__$__.editor.renderer.textToScreenCoordinates({
                        row: __$__.Testize.callParenthesisPos[label].start.line - 1,
                        column: __$__.Testize.callParenthesisPos[label].start.column
                    }), newDiv);
                    __$__.Testize.displayTooltip(newDiv, label);
                }
            }
        }
    },


    setPositions(graph) {
        Object.keys(graph.nodes._data).forEach(nodeID => {
            if (__$__.StorePositions.oldNetwork.nodes[nodeID]) {
                graph.nodes.update({
                    id: nodeID,
                    x: __$__.StorePositions.oldNetwork.nodes[nodeID].x,
                    y: __$__.StorePositions.oldNetwork.nodes[nodeID].y,
                    fixed: true
                });
            }
        });
    },


    openWin(modified = false) {
        // To be checked
        // let split_pane_size = document.getElementById('split-pane-frame').getBoundingClientRect();
        // if (!__$__.Testize.window.testGraph) {
        //     __$__.Testize.createWindow(split_pane_size.width/1.5, split_pane_size.height/1.5, '');
        //     console.log("testGraphが空");
        // } else {
        //     // __$__.Testize.window.testGraph.setSize(split_pane_size.width / 1.5, split_pane_size.height / 1.5);
        //     __$__.Testize.window.testGraph.setWidth(split_pane_size.width / 1.5);
        //     __$__.Testize.window.testGraph.setHeight(split_pane_size.height / 1.5);
        // }

        // duplicate an object graph stored just before the focusing function call
        let graph, visGraph;
        try {
            let callLabel = __$__.Testize.selectedCallInfo.label;
            let checkpointIDs = __$__.Context.CheckPointIDAroundFuncCall[callLabel];
            let context_sensitiveID = __$__.Testize.selectedCallInfo.context_sensitiveID;
            if (modified) {
                let testInfo = __$__.Testize.storedTest[callLabel][context_sensitiveID];
                let testData = testInfo.testData;
                __$__.Testize.focusedTestOperations = testInfo.operations;
                visGraph = {
                    nodes: new vis.DataSet(Object.values(testData.nodes._data).map(node => jQuery.extend(true, {}, node))),
                    edges: new vis.DataSet(Object.values(testData.edges._data).map(edge => jQuery.extend(true, {}, edge)))
                };
            } else {
                try {
                    graph = __$__.Context.StoredGraph[checkpointIDs.before][context_sensitiveID];
                    visGraph = graph.generateVisjsGraph();
                } catch (e)  {
                    visGraph = {
                        nodes: [],
                        edges: []
                    };
                }
                // push a special node so that the user can add green arrows which represent variable references.
                visGraph.nodes.push({
                    id: '__RectForVariable__',
                    label: 'def var',
                    color: {
                        border: 'lightsalmon',
                        background: 'lightsalmon',
                        highlight: {
                            border: 'lightsalmon',
                            background: 'lightsalmon'
                        },
                        hover: {
                            border: 'lightsalmon',
                            background: 'lightsalmon'
                        }
                    },
                    shape: 'box',
                    physics: false
                });
                visGraph.nodes = new vis.DataSet(visGraph.nodes);
                visGraph.edges = new vis.DataSet(visGraph.edges);
                __$__.Testize.focusedTestOperations = [];
            }
        } catch (e) {
            visGraph = {
                nodes: new vis.DataSet([]),
                edges: new vis.DataSet([])
            };
        }

        __$__.Testize.setPositions(visGraph);
        __$__.Testize.network.network.setData(visGraph);
        __$__.Testize.network.network.redraw();
        // To be checked
        // __$__.Testize.window.testGraph.showCenter();
        // __$__.Testize.window.testGraph.open();
        __$__.Testize.window.runtimeGraph.close();
        __$__.Testize.network.network.once('stabilized', param => {
            Object.values(__$__.Testize.network.network.body.data.nodes._data).forEach(node => {
                if (node.id.slice(0, 11) !== '__Variable-' && node.id !== '__RectForVariable__')
                    __$__.Testize.network.network.body.data.nodes.update({id: node.id, fixed: true});
            });
        });
    },


    openRuntimeGraphWin() {
        let split_pane_size = document.getElementById('split-pane-frame').getBoundingClientRect();
        // To be checked
        // __$__.Testize.window.runtimeGraph.setSize(split_pane_size.width / 2, split_pane_size.height / 2);
        __$__.Testize.window.runtimeGraph.setWidth(split_pane_size.width / 1.75);
        __$__.Testize.window.runtimeGraph.setHeight(split_pane_size.height / 1.75);
        let selectedCallInfo = __$__.Testize.selectedCallInfo;
        let graph = __$__.Testize.storedActualGraph[selectedCallInfo.label][selectedCallInfo.context_sensitiveID] || {nodes: [], edges: []};

        let positions = __$__.Testize.network.network.getPositions();

        // set positions
        graph.nodes.forEach(node => {
            if (positions[node.id]) {
                let pos = positions[node.id];
                node.x = pos.x;
                node.y = pos.y;
                node.fixed = true;
            } else {
                delete node.x;
                delete node.y;
                delete node.fixed;
            }
        });

        __$__.Testize.actualGraphNetwork.network.setData({
            nodes: new vis.DataSet(graph.nodes),
            edges: new vis.DataSet(graph.edges)
        });
        __$__.Testize.actualGraphNetwork.network.redraw();
        // To be checked - z-Indexは常にruntimeGraph > testGraphなのでtoFrontは不要
        // __$__.Testize.window.runtimeGraph.show();
        // __$__.Testize.window.runtimeGraph.toFront();
        __$__.Testize.window.runtimeGraph.open();

        __$__.Testize.actualGraphNetwork.network.once('stabilized', param => {
            Object.values(__$__.Testize.actualGraphNetwork.network.body.data.nodes._data).forEach(node => {
                if (node.id.slice(0, 11) !== '__Variable-')
                    __$__.Testize.actualGraphNetwork.network.body.data.nodes.update({id: node.id, fixed: true});
            });
        });
    },


    /**
     * @param node: this has 'label' property and this node's type is CallExpression
     *
     * If the function call which the node represents is written by the following style,
     * f ( a )
     *
     * the registered position is as follows.
     * start => {line: 1, column: 1}
     * end   => {line: 1, column: 7}
     */
    registerParenthesisPos(node) {
        try {
            if (node.label) {
                let arrayOfTextContainsParenthesis = __$__.editor.session.getTextRange(new __$__.Range(
                    node.callee.loc.end.line-1,
                    node.callee.loc.end.column,
                    node.loc.end.line-1,
                    node.loc.end.column
                )).split('\n');

                let registerPos = {
                    start: {
                        line: node.callee.loc.end.line,
                        column: node.callee.loc.end.column
                    },
                    end: {
                        line: node.loc.end.line,
                        column: node.loc.end.column
                    }
                };
                const methodName = __$__.Testize.extractMethodNameFromCallNode(node);
                if (methodName) {
                    registerPos.methodName = methodName;
                    __$__.Testize.callMethodNameByLabel[node.label] = methodName;
                }

                // find first open parenthesis
                for (let i = 0; i < arrayOfTextContainsParenthesis.length; i++) {
                    let text = arrayOfTextContainsParenthesis[i];
                    let idx = text.indexOf('(');
                    if (idx === -1) {
                        registerPos.start.line += 1;
                        registerPos.start.column = 0;
                    } else {
                        registerPos.start.column += idx;
                        break;
                    }
                }

                // find last close parenthesis
                for (let i = arrayOfTextContainsParenthesis.length-1; i >= 0; i--) {
                    let text = arrayOfTextContainsParenthesis[i];
                    let idx = text.lastIndexOf(')');
                    if (idx === -1) {
                        registerPos.end.line -= 1;
                        registerPos.end.column = arrayOfTextContainsParenthesis[i-1].length;
                    } else {
                        registerPos.end.column -= text.length-idx-1;
                        break;
                    }
                }

                __$__.Testize.callParenthesisPos[node.label] = registerPos;
                if (__$__.Testize.storedTest[node.label] && __$__.Testize.storedTest[node.label].markerInfo) {
                    let markerRange = __$__.Testize.storedTest[node.label].markerInfo.range;
                    let markerClazz = __$__.Testize.storedTest[node.label].markerInfo.clazz;
                    if (registerPos.start.line-1 === markerRange.start.row
                        && registerPos.start.column === markerRange.start.column
                        && registerPos.end.line-1 === markerRange.end.row
                        && registerPos.end.column === markerRange.end.column) {
                        // if the position of the marker is the same as the parenthesis position,
                        // do nothing
                    } else {
                        let newMarkerRange = new __$__.Range(
                            registerPos.start.line-1,
                            registerPos.start.column,
                            registerPos.end.line-1,
                            registerPos.end.column
                        );
                        let newMarkerID = __$__.editor.session.addMarker(newMarkerRange, markerClazz, 'text');
                        __$__.Testize.removeMarker(__$__.Testize.storedTest[node.label], newMarkerID, newMarkerRange, markerClazz);
                    }
                }
            }
        } catch (e) {
            console.log(node, e);
        }
    },


    removeMarker(testInfo, newMarkerID, newMarkerRange, clazz) {
        if (testInfo.markerInfo)
            __$__.editor.session.removeMarker(testInfo.markerInfo.ID);

        testInfo.markerInfo = (newMarkerID) ? {
                ID: newMarkerID,
                range: newMarkerRange,
                clazz: clazz
            } : undefined;
    },


    removeTest(callLabel) {
        let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[callLabel].start).loop;
        let context_sensitiveID = __$__.Context.SpecifiedContext[loopLabelAroundCall];
        __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel]);
        delete __$__.Testize.storedTest[callLabel][context_sensitiveID];
        if (__$__.Testize.storedCallArguments[callLabel]) {
            delete __$__.Testize.storedCallArguments[callLabel][context_sensitiveID];
            if (Object.keys(__$__.Testize.storedCallArguments[callLabel]).length === 0) {
                delete __$__.Testize.storedCallArguments[callLabel];
            }
        }
        __$__.Testize.hoveringCallInfo = {};
    },


    removeTooltip(div) {
        div.style.display = 'none';
        __$__.Testize.hoveringCallInfo.label = undefined;
        __$__.Testize.hoveringCallInfo.div = undefined;
    },


    setTest() {
        let expectedGraphData = {};
        jQuery.extend(true, expectedGraphData, __$__.Testize.network.network.body.data);
        let callLabel = __$__.Testize.selectedCallInfo.label;
        let context_sensitiveID = __$__.Testize.selectedCallInfo.context_sensitiveID;
        let callPos = __$__.Testize.callParenthesisPos[callLabel];
        let markerRange = new __$__.Range(
            callPos.start.line - 1,
            callPos.start.column,
            callPos.end.line - 1,
            callPos.end.column
        );
        let clazz = 'testFailed';
        let markerID = __$__.editor.session.addMarker(markerRange, clazz, 'text');

        if (!__$__.Testize.storedTest[callLabel]) {
            __$__.Testize.storedTest[callLabel] = {};
        }

        __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel], markerID, markerRange, clazz);

        let callArguments = __$__.Testize.storedCallArguments[callLabel]
            && __$__.Testize.storedCallArguments[callLabel][context_sensitiveID];
        if (!callArguments) {
            callArguments = {
                arguments: [],
                argumentTypes: [],
                argumentNames: []
            };
        }

        __$__.Testize.storedTest[callLabel][context_sensitiveID] = {
            testData: expectedGraphData,
            passed: false,
            operations: __$__.Testize.focusedTestOperations,
            arguments: callArguments.arguments.slice(),
            argumentTypes: callArguments.argumentTypes.slice(),
            argumentNames: callArguments.argumentNames.slice(),
            methodName: __$__.Testize.normalizeMethodName(
                (__$__.Testize.callParenthesisPos[callLabel] && __$__.Testize.callParenthesisPos[callLabel].methodName)
                || __$__.Testize.callMethodNameByLabel[callLabel]
                || callLabel.split('.').pop()
                || "unknown"
            )
        };

        __$__.Testize.focusedTestOperations = undefined;
        __$__.Testize.selectedCallInfo = {label: undefined, context_sensitiveID: undefined};
    },


    updateMarker() {
        Object.keys(__$__.Testize.storedTest).forEach(callLabel => {
            if (!__$__.Context.LabelPos.Call[callLabel]) return;
            let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[callLabel].start).loop;
            let specifiedContext = __$__.Context.SpecifiedContext[loopLabelAroundCall];
            if (__$__.Testize.storedTest[callLabel].markerInfo && !__$__.Testize.storedTest[callLabel][specifiedContext]) {
                __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel]);
            } else if (__$__.Testize.storedTest[callLabel][specifiedContext]) {
                let callPos = __$__.Testize.callParenthesisPos[callLabel];
                let markerRange = new __$__.Range(
                    callPos.start.line - 1,
                    callPos.start.column,
                    callPos.end.line - 1,
                    callPos.end.column
                );
                let clazz = (__$__.Testize.storedTest[callLabel][specifiedContext].testReconstructionFailed)
                    ? 'testWarning'
                    : (__$__.Testize.storedTest[callLabel][specifiedContext].passed)
                        ? 'testPassed'
                        : 'testFailed';

                let markerInfo = __$__.Testize.storedTest[callLabel].markerInfo;

                if (!markerInfo) {
                    let markerID = __$__.editor.session.addMarker(markerRange, clazz, 'text');
                    __$__.Testize.storedTest[callLabel].markerInfo = {
                        ID: markerID,
                        range: markerRange,
                        clazz: clazz
                    };
                } else if (!(markerInfo.clazz === clazz
                        && markerRange.start.row === callPos.start.row
                        && markerRange.start.column === callPos.start.column
                        && markerRange.end.row === callPos.end.row
                        && markerRange.end.column === callPos.end.column)) {
                    let markerID = __$__.editor.session.addMarker(markerRange, clazz, 'text');
                    __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel], markerID, markerRange, clazz);
                }
            }
        });
    },


    updateMarkerPosition(editEvent) {
        let start = {line: editEvent.start.row + 1, column: editEvent.start.column};
        let end = {line: editEvent.end.row + 1, column: editEvent.end.column};
        let compare = __$__.UpdateLabelPos.ComparePosition;

        if (editEvent.action === 'insert') {
            Object.keys(__$__.Testize.storedTest).forEach(callLabel => {
                let markerInfo = __$__.Testize.storedTest[callLabel].markerInfo;
                if (markerInfo) {
                    let markerID = markerInfo.ID;
                    let marker = __$__.editor.session.getMarkers()[markerID];
                    let markerRange = markerInfo.range;
                    let pos = {
                        start: {
                            line: markerRange.start.row + 1,
                            column: markerRange.start.column
                        },
                        end: {
                            line: markerRange.end.row + 1,
                            column: markerRange.end.column
                        }
                    };

                    // update
                    let changed = __$__.UpdateLabelPos.modify_by_insert(editEvent, pos);
                    if (changed) {
                        let newMarkerRange = new __$__.Range(
                            pos.start.line-1,
                            pos.start.column,
                            pos.end.line-1,
                            pos.end.column
                        );
                        let newMarkerID = __$__.editor.session.addMarker(newMarkerRange, marker.clazz, marker.type);
                        __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel], newMarkerID, newMarkerRange, marker.clazz);
                    }
                }
            });
        } else { // editEvent.action == 'remove'
            Object.keys(__$__.Testize.storedTest).forEach(callLabel => {
                let markerInfo = __$__.Testize.storedTest[callLabel].markerInfo;
                if (markerInfo) {
                    let markerID = markerInfo.ID;
                    let marker = __$__.editor.session.getMarkers()[markerID];
                    let pos = {
                        start: {
                            line: marker.range.start.row + 1,
                            column: marker.range.start.column
                        },
                        end: {
                            line: marker.range.end.row + 1,
                            column: marker.range.end.column
                        }
                    };

                    if (compare(start, '<=', pos.start) && compare(pos.end, '<=', end)) {
                        __$__.editor.session.removeMarker(markerID);
                        delete __$__.Testize.storedTest[callLabel];
                        delete __$__.Testize.storedCallArguments[callLabel];
                    } else {
                        let changed = __$__.UpdateLabelPos.modify_by_remove(editEvent, pos);
                        if (changed) {
                            let newMarkerRange = new __$__.Range(
                                pos.start.line-1,
                                pos.start.column,
                                pos.end.line-1,
                                pos.end.column
                            );
                            let newMarkerID = __$__.editor.session.addMarker(newMarkerRange, marker.clazz, marker.type);
                            __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel], newMarkerID, newMarkerRange, marker.clazz);
                        }
                    }
                }
            });
        }
    },


    updateTooltipPos(position, div) {
        if (div) {
            div.style.left = position.pageX + 'px';
            div.style.top = position.pageY + 'px';
        }
    }
};
