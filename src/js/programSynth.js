__$__.ProgramSynth = {
    overlay: undefined,
    network: undefined,
    networkContainer: undefined,
    emptyMessage: undefined,
    titleLabel: undefined,
    infoLabel: undefined,
    runtimeGraphs: {},
    currentContext: undefined,
    lastResult: undefined,
    nodeCounter: 0,
    editForm: {},
    savedEdits: {},
    currentOperations: [],

    saveOperation(editType, data) {
        let ope;
        switch (editType) {
            case 'addNode':
                ope = {
                    editType: editType,
                    id: data.id,
                    label: data.label,
                    isLiteral: data.isLiteral,
                    type: data.type
                };
                break;
            case 'editNode':
                ope = {
                    editType: editType,
                    id: data.id,
                    label: data.label,
                    isLiteral: data.isLiteral,
                    type: data.type
                };
                break;
            case 'deleteNode':
                ope = {
                    editType: editType,
                    id: data.id
                };
                break;
            case 'addEdge':
                ope = {
                    editType: editType,
                    from: data.from,
                    to: data.to,
                    label: data.label
                };
                break;
            case 'editEdgeReference':
                ope = {
                    editType: editType,
                    from: data.from,
                    oldTo: data.oldTo,
                    newTo: data.newTo,
                    label: data.label
                };
                break;
            case 'editEdgeLabel':
                ope = {
                    editType: editType,
                    from: data.from,
                    to: data.to,
                    oldLabel: data.oldLabel,
                    newLabel: data.newLabel
                };
                break;
            case 'deleteEdge':
                ope = {
                    editType: editType,
                    from: data.from,
                    to: data.to,
                    label: data.label
                };
                break;
            case 'addVariable':
                ope = {
                    editType: editType,
                    to: data.to,
                    label: data.label
                };
                break;
            case 'editVariableReference':
                ope = {
                    editType: editType,
                    oldTo: data.oldTo,
                    newTo: data.newTo,
                    label: data.label
                };
                break;
            case 'editVariableLabel':
                ope = {
                    editType: editType,
                    to: data.to,
                    oldLabel: data.oldLabel,
                    newLabel: data.newLabel
                };
                break;
            case 'deleteVariable':
                ope = {
                    editType: editType,
                    to: data.to,
                    label: data.label
                };
                break;
        }


        if (ope) {
            if (!this.currentOperations) this.currentOperations = [];
            this.currentOperations.push(ope);
            console.log('[ProgramSynth] Operation saved:', ope);
        }
    },

    init() {
        if (!this.runtimeGraphs) this.runtimeGraphs = {};
    },

    ensureWindow() {
        if (this.overlay) return;

        let overlay = document.createElement('div');
        overlay.id = 'runtimeGraphOverlay';
        overlay.className = 'call-tree-editor-overlay';
        overlay.style.display = 'none';

        let closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'call-tree-editor-close';
        closeButton.textContent = 'close';
        closeButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            __$__.ProgramSynth.hideWindow();
        });

        let content = document.createElement('div');
        content.className = 'call-tree-editor-content';

        let title = document.createElement('h3');
        content.appendChild(title);

        let info = document.createElement('p');
        content.appendChild(info);

        let actionBar = document.createElement('div');
        actionBar.className = 'program-synth-header';

        let applyButton = document.createElement('button');
        applyButton.type = 'button';
        applyButton.className = 'program-synth-btn';
        applyButton.textContent = 'apply';
        actionBar.appendChild(applyButton);
        content.appendChild(actionBar);

        let body = document.createElement('div');
        body.className = 'call-tree-editor-body program-synth-body';

        let emptyMessage = document.createElement('div');
        emptyMessage.className = 'call-tree-editor-empty';
        emptyMessage.textContent = 'No runtime graph data for this context.';
        emptyMessage.style.display = 'flex';
        body.appendChild(emptyMessage);

        let networkContainer = document.createElement('div');
        networkContainer.id = 'runtimeGraphNetwork';
        networkContainer.className = 'call-tree-editor-network';
        body.appendChild(networkContainer);

        let popup = document.createElement('div');
        popup.id = 'programSynth-popUp';
        popup.className = 'program-synth-popup';
        popup.style.display = 'none';

        let operationLabel = document.createElement('span');
        operationLabel.id = 'programSynth-operation';
        operationLabel.textContent = 'node';
        popup.appendChild(operationLabel);
        popup.appendChild(document.createElement('br'));

        let table = document.createElement('table');
        table.style.margin = 'auto';
        let row = document.createElement('tr');
        let cellLabel = document.createElement('td');
        cellLabel.textContent = 'label';
        let cellInput = document.createElement('td');
        let labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.id = 'programSynth-node-label';
        labelInput.value = '';
        cellInput.appendChild(labelInput);
        row.appendChild(cellLabel);
        row.appendChild(cellInput);
        table.appendChild(row);
        popup.appendChild(table);

        let literalContainer = document.createElement('div');
        literalContainer.id = 'programSynth-isLiteral';
        let literalCheckbox = document.createElement('input');
        literalCheckbox.type = 'checkbox';
        literalCheckbox.id = 'programSynth-checkboxForLiteral';
        literalCheckbox.value = 'true';
        literalContainer.appendChild(literalCheckbox);
        let literalLabel = document.createElement('span');
        literalLabel.textContent = 'Literal';
        literalContainer.appendChild(literalLabel);
        popup.appendChild(literalContainer);

        let saveButton = document.createElement('input');
        saveButton.type = 'button';
        saveButton.value = 'save';
        saveButton.id = 'programSynth-saveButton';
        popup.appendChild(saveButton);

        let cancelButton = document.createElement('input');
        cancelButton.type = 'button';
        cancelButton.value = 'cancel';
        cancelButton.id = 'programSynth-cancelButton';
        popup.appendChild(cancelButton);

        content.appendChild(popup);

        content.appendChild(body);

        overlay.appendChild(closeButton);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.titleLabel = title;
        this.infoLabel = info;
        this.emptyMessage = emptyMessage;
        this.networkContainer = networkContainer;
        this.editForm = {
            popup: popup,
            operationLabel: operationLabel,
            labelInput: labelInput,
            literalContainer: literalContainer,
            literalCheckbox: literalCheckbox,
            saveButton: saveButton,
            cancelButton: cancelButton,
            onSave: undefined,
            onCancel: undefined
        };

        if (this.networkContainer) {
            this.networkContainer.style.width = '100%';
            this.networkContainer.style.height = '100%';
            this.networkContainer.style.display = 'none';
        }

        const options = {
            autoResize: true,
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
            interaction: {
                hover: true,
                dragView: true,
                dragNodes: true,
                zoomView: true
            },
            physics: {
                enabled: false,
                stabilization: {
                    iterations: 200
                }
            },
            manipulation: {
                enabled: true,
                addNode: (data, callback) => __$__.ProgramSynth.handleAddNode(data, callback),
                addEdge: (data, callback) => __$__.ProgramSynth.handleAddEdge(data, callback),
                editEdge: (data, callback) => __$__.ProgramSynth.handleEditEdge(data, callback),
                deleteNode: (data, callback) => __$__.ProgramSynth.handleDeleteNode(data, callback),
                deleteEdge: (data, callback) => __$__.ProgramSynth.handleDeleteEdge(data, callback)
            }
        };

        this.networkOptions = options;

        applyButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            __$__.ProgramSynth.applyEdits();
        });

        this.attachNetworkEvents();

        overlay.addEventListener('click', event => {
            if (event.target === overlay)
                __$__.ProgramSynth.hideWindow();
        });

        content.addEventListener('click', event => {
            event.stopPropagation();
        });
    },

    showWindow() {
        if (this.overlay)
            this.overlay.style.display = 'block';
    },

    hideWindow() {
        if (this.overlay)
            this.overlay.style.display = 'none';
        this.hideEditPopup();
    },

    openRuntimeWindowFromCallTree(datum) {
        if (!datum || !datum.data) return;

        let contextSensitiveID = datum.data.contextSensitiveID;
        if (!contextSensitiveID) return;

        let parentContext = datum.parent && datum.parent.data ? datum.parent.data.contextSensitiveID : undefined;
        let callLabel = datum.data.callLabel ||
            (__$__.CallTreeNetwork && typeof __$__.CallTreeNetwork.resolveCallLabel === 'function'
                ? __$__.CallTreeNetwork.resolveCallLabel(parentContext, contextSensitiveID)
                : undefined);
        let loopLabel = datum.data.loopLabel;

        console.log('[ProgramSynth] click context info', {
            loopLabel: loopLabel,
            contextSensitiveID: contextSensitiveID,
            parentContext: parentContext,
            callLabel: callLabel
        });

        window.setTimeout(() => {
            console.log('[ProgramSynth] openRuntimeWindow queued');
            __$__.ProgramSynth.openRuntimeWindow({
                callLabel: callLabel,
                loopLabel: loopLabel,
                contextSensitiveID: contextSensitiveID
            });
        }, 0);
    },

    openRuntimeWindow({ callLabel, loopLabel, contextSensitiveID }) {
        if (!contextSensitiveID) return;

        this.ensureWindow();

        let cursorResolved = this.resolveCursorCheckpoint(contextSensitiveID, loopLabel);
        let snapshotResolved = this.resolveSnapshotStoredGraph(contextSensitiveID);
        let checkpointId = (cursorResolved && cursorResolved.checkpointId)
            ? cursorResolved.checkpointId
            : (snapshotResolved && snapshotResolved.checkpointId)
                ? snapshotResolved.checkpointId
                : this.resolveInitialCheckpointId(callLabel, contextSensitiveID);

        this.currentContext = {
            callLabel: callLabel,
            loopLabel: loopLabel,
            contextSensitiveID: contextSensitiveID,
            checkpointId: checkpointId
        };
        this.currentOperations = [];

        console.log('[ProgramSynth] openRuntimeWindow start', this.currentContext);

        this.updateTitle();
        this.updateInfoLabel();

        let initialCacheKey = this.makeContextKey(this.currentContext);
        let runtimeGraph = this.runtimeGraphs[initialCacheKey];
        let existedBefore = !!runtimeGraph;
        let graphCandidates = [];
        if (snapshotResolved && snapshotResolved.graph)
            graphCandidates.push({ source: 'snapshot', checkpointId: snapshotResolved.checkpointId, graph: snapshotResolved.graph });
        if (cursorResolved && cursorResolved.graph)
            graphCandidates.push({ source: 'cursor', checkpointId: cursorResolved.checkpointId, graph: cursorResolved.graph });

        if (!runtimeGraph) {
            for (let i = 0; i < graphCandidates.length; i++) {
                let candidate = this.buildGraphFromStoredGraph(graphCandidates[i].graph);
                if (candidate && candidate.nodes && candidate.nodes.length > 0) {
                    runtimeGraph = candidate;
                    this.currentContext.checkpointId = graphCandidates[i].checkpointId || this.currentContext.checkpointId;
                    break;
                }
            }
        }

        if (!runtimeGraph) {
            runtimeGraph = this.buildGraphFromContext(callLabel, contextSensitiveID, checkpointId);
            if (runtimeGraph) {
                let normalizedKey = this.makeContextKey(this.currentContext);
                this.runtimeGraphs[normalizedKey] = runtimeGraph;
                if (normalizedKey !== initialCacheKey)
                    delete this.runtimeGraphs[initialCacheKey];
            }
        }

        console.log('[ProgramSynth] runtimeGraph snapshot', {
            cacheKey: this.makeContextKey(this.currentContext),
            existedBefore: existedBefore,
            builtFromStoredGraph: !!runtimeGraph
        });

        let graphData = this.buildGraphData(runtimeGraph);
        this.showWindow();
        if (graphData) {
            this.updateNodeCounter(graphData);
            let nodeCount = (graphData.nodes && typeof graphData.nodes.get === 'function') ? graphData.nodes.get().length : (graphData.nodes ? graphData.nodes.length : 0);
            let edgeCount = (graphData.edges && typeof graphData.edges.get === 'function') ? graphData.edges.get().length : (graphData.edges ? graphData.edges.length : 0);
            console.log('[ProgramSynth] graphData ready', {
                nodeCount: nodeCount,
                edgeCount: edgeCount
            });
            setTimeout(() => {
                this.showGraphState(graphData);
            }, 100);
        } else {
            console.log('[ProgramSynth] no graphData after build');
            this.showEmptyState();
        }
    },

    buildGraphFromContext(callLabel, contextSensitiveID, checkpointId) {
        let resolvedGraph = this.resolveStoredGraph(callLabel, contextSensitiveID, checkpointId);
        if (!resolvedGraph || !resolvedGraph.graph) {
            console.log('[ProgramSynth] buildGraphFromContext: stored graph not found', {
                callLabel: callLabel,
                contextSensitiveID: contextSensitiveID,
                checkpointId: checkpointId
            });
            return undefined;
        }

        if (resolvedGraph.checkpointId && this.currentContext)
            this.currentContext.checkpointId = resolvedGraph.checkpointId;

        let visGraph;
        try {
            visGraph = resolvedGraph.graph.generateVisjsGraph(true);
        } catch (e) {
            console.log('[ProgramSynth] buildGraphFromContext: failed to generate vis graph', e);
            return undefined;
        }

        let nodes = this.cloneVisItems(visGraph && visGraph.nodes ? visGraph.nodes : []);
        let edges = this.cloneVisItems(visGraph && visGraph.edges ? visGraph.edges : []);

        this.ensureVariablePlaceholder(nodes);
        this.applyReferencePositions(nodes);

        return {
            nodes: nodes,
            edges: edges
        };
    },

    makeContextKey(context) {
        if (!context) return '';
        let parts = [
            context.callLabel || '',
            context.contextSensitiveID || '',
            context.checkpointId || ''
        ];
        return parts.join('::');
    },

    resolveStoredGraph(callLabel, contextSensitiveID, checkpointId) {
        if (!contextSensitiveID || !__$__.Context || !__$__.Context.StoredGraph)
            return undefined;

        let attempted = {};
        let tryResolve = cpId => {
            if (!cpId || attempted[cpId]) return undefined;
            attempted[cpId] = true;
            let graph = this.lookupGraph(cpId, contextSensitiveID);
            if (graph)
                return {
                    graph: graph,
                    checkpointId: cpId
                };
            return undefined;
        };

        let resolved = tryResolve(checkpointId);
        if (resolved) return resolved;

        resolved = tryResolve(this.resolveCallLabelCheckpoint(callLabel));
        if (resolved) return resolved;

        resolved = tryResolve(this.resolveSnapshotCheckpoint(contextSensitiveID));
        if (resolved) return resolved;

        let checkpointIds = Object.keys(__$__.Context.StoredGraph);
        for (let i = 0; i < checkpointIds.length; i++) {
            let cpId = checkpointIds[i];
            resolved = tryResolve(cpId);
            if (resolved) return resolved;
        }

        return undefined;
    },

    resolveInitialCheckpointId(callLabel, contextSensitiveID) {
        let snapshot = this.getSnapshotContext(contextSensitiveID);
        if (snapshot) return snapshot.cpID;
        return this.resolveCallLabelCheckpoint(callLabel);
    },

    resolveSnapshotCheckpoint(contextSensitiveID) {
        let snapshot = this.getSnapshotContext(contextSensitiveID);
        return snapshot ? snapshot.cpID : undefined;
    },

    resolveSnapshotStoredGraph(contextSensitiveID) {
        let snapshot = this.getSnapshotContext(contextSensitiveID);
        if (!snapshot || !snapshot.cpID) return undefined;
        let cpId = snapshot.cpID;
        let graph = this.lookupGraph(cpId, contextSensitiveID);
        if (!graph) return undefined;
        return {
            checkpointId: cpId,
            graph: graph
        };
    },

    getSnapshotContext(contextSensitiveID) {
        if (!__$__.Context || !__$__.Context.SnapshotContext)
            return undefined;
        let snapshot = __$__.Context.SnapshotContext;
        if (!snapshot || !snapshot.cpID)
            return undefined;
        if (contextSensitiveID && snapshot.contextSensitiveID && snapshot.contextSensitiveID !== contextSensitiveID)
            return undefined;
        return snapshot;
    },

    resolveCursorCheckpoint(contextSensitiveID, loopLabel) {
        try {
            if (!__$__.Context || !__$__.Context.FindCPIDNearCursorPosition || !__$__.editor)
                return undefined;

            let pos = __$__.editor.getCursorPosition && __$__.editor.getCursorPosition();
            if (!pos) return undefined;

            let cps = __$__.Context.FindCPIDNearCursorPosition(pos);
            if (!cps) return undefined;

            let beforeIds = cps.beforeIds || [];
            let afterIds = cps.afterIds || [];
            let beforeId = beforeIds.length ? beforeIds[beforeIds.length - 1] : undefined;
            let afterId = afterIds.length ? afterIds[afterIds.length - 1] : undefined;

            let candidateIds = [];
            if (afterId) {
                let afterPos = __$__.Context.CheckPointTable && __$__.Context.CheckPointTable[afterId];
                if (afterPos && afterPos.line === pos.row + 1 && afterPos.column === pos.column)
                    candidateIds.push(afterId);
            }
            if (beforeId) candidateIds.push(beforeId);
            if (afterId && candidateIds.indexOf(afterId) === -1) candidateIds.push(afterId);

            let seen = {};
            let ordered = [];
            candidateIds.forEach(id => {
                if (id && !seen[id]) {
                    seen[id] = true;
                    ordered.push(id);
                }
            });

            let tryFetch = cpId => {
                if (!cpId) return undefined;
                let loop = __$__.Context.CheckPointID2LoopLabel && __$__.Context.CheckPointID2LoopLabel[cpId];
                if (!loop) return undefined;
                let graph = __$__.Context.StoredGraph &&
                    __$__.Context.StoredGraph[cpId] &&
                    __$__.Context.StoredGraph[cpId][contextSensitiveID];
                if (graph)
                    return { checkpointId: cpId, graph: graph, loopLabel: loop };
                return undefined;
            };

            let candidatesWithPair = [];
            ordered.forEach(cpId => {
                candidatesWithPair.push(cpId);
                let pair = __$__.ASTTransforms && __$__.ASTTransforms.pairCPID && __$__.ASTTransforms.pairCPID[cpId];
                if (pair && candidatesWithPair.indexOf(pair) === -1)
                    candidatesWithPair.push(pair);
            });

            for (let i = 0; i < candidatesWithPair.length; i++) {
                let res = tryFetch(candidatesWithPair[i]);
                if (res) return res;
            }
        } catch (e) {
        }
        return undefined;
    },

    resolveCallLabelCheckpoint(callLabel) {
        if (!callLabel || !__$__.Context || !__$__.Context.CheckPointIDAroundFuncCall)
            return undefined;
        let checkpointInfo = __$__.Context.CheckPointIDAroundFuncCall[callLabel];
        return checkpointInfo && checkpointInfo.before;
    },

    lookupGraph(checkpointId, contextSensitiveID) {
        if (!checkpointId || !__$__.Context || !__$__.Context.StoredGraph)
            return undefined;
        let storedGraphs = __$__.Context.StoredGraph[checkpointId];
        if (!storedGraphs)
            return undefined;
        return storedGraphs[contextSensitiveID];
    },

    ensureVariablePlaceholder(nodes) {
        if (!nodes) return;
        let exists = nodes.some(node => node && node.id === '__RectForVariable__');
        if (exists) return;
        nodes.push({
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
    },

    applyReferencePositions(nodes) {
        if (!nodes || !nodes.length) return;
        let positions = this.collectReferencePositions();
        if (!positions) return;

        nodes.forEach(node => {
            if (!node || !node.id) return;
            let pos = positions[node.id];
            if (pos) {
                node.x = pos.x;
                node.y = pos.y;
            } else if (node.x === undefined || node.y === undefined) {
                delete node.x;
                delete node.y;
            }
            node.fixed = false;
        });
    },

    collectReferencePositions() {
        let networks = [];
        if (__$__.ObjectGraphNetwork && __$__.ObjectGraphNetwork.network)
            networks.push(__$__.ObjectGraphNetwork.network);
        if (__$__.Testize && __$__.Testize.network && __$__.Testize.network.network)
            networks.push(__$__.Testize.network.network);
        if (__$__.Testize && __$__.Testize.actualGraphNetwork && __$__.Testize.actualGraphNetwork.network)
            networks.push(__$__.Testize.actualGraphNetwork.network);

        for (let i = 0; i < networks.length; i++) {
            let network = networks[i];
            if (!network || !network.body || !network.body.data) continue;
            let nodesData = network.body.data.nodes;
            if (!nodesData) continue;
            let count = 0;
            if (typeof nodesData.getIds === 'function') {
                count = nodesData.getIds().length;
            } else if (typeof nodesData.get === 'function') {
                let allNodes = nodesData.get();
                count = allNodes ? allNodes.length : 0;
            } else if (nodesData._data) {
                count = Object.keys(nodesData._data).length;
            }
            if (count > 0) {
                try {
                    return network.getPositions();
                } catch (e) {
                }
            }
        }
        return undefined;
    },

    logStoredGraph(contextSensitiveID, loopLabel) {
        try {
            let snapshot = this.getSnapshotContext(contextSensitiveID);
            let cpId = snapshot && snapshot.cpID;
            if (!cpId && __$__.Context && __$__.Context.CheckPointID2LoopLabel) {
                let lastCP = __$__.Context.LastInfo && __$__.Context.LastInfo.CPID;
                if (lastCP && __$__.Context.CheckPointID2LoopLabel[lastCP] === loopLabel)
                    cpId = lastCP;
            }
            if (!cpId && __$__.Context && typeof __$__.Context.FindCPIDNearCursorPosition === 'function' && __$__.editor) {
                let pos = __$__.editor.getCursorPosition && __$__.editor.getCursorPosition();
                if (pos) {
                    let cps = __$__.Context.FindCPIDNearCursorPosition(pos);
                    if (cps && cps.beforeIds && cps.beforeIds.length)
                        cpId = cps.beforeIds[cps.beforeIds.length - 1];
                }
            }
            if (!cpId) {
                console.log('[ProgramSynth][debug] storedGraph not found (no cpId)', { contextSensitiveID, loopLabel });
                return;
            }
            let graph = __$__.Context &&
                __$__.Context.StoredGraph &&
                __$__.Context.StoredGraph[cpId] &&
                __$__.Context.StoredGraph[cpId][contextSensitiveID];
            if (!graph) {
                console.log('[ProgramSynth][debug] storedGraph missing for cpId', { cpId, contextSensitiveID, loopLabel });
                return;
            }
            let vis = graph.generateVisjsGraph(true);
            let nodeCount = vis.nodes ? vis.nodes.length : 0;
            let edgeCount = vis.edges ? vis.edges.length : 0;
            console.log('[ProgramSynth][debug] storedGraph snapshot', { cpId, contextSensitiveID, loopLabel, nodeCount, edgeCount, graph });
        } catch (e) {
            console.log('[ProgramSynth][debug] storedGraph log failed', e);
        }
    },

    buildGraphData(graph) {
        if (!graph) return undefined;

        let nodes = this.cloneVisItems(graph.nodes || []);
        let edges = this.cloneVisItems(graph.edges || []);
        this.normalizeNodesForDisplay(nodes);

        console.log('[ProgramSynth] buildGraphData input', {
            nodes: nodes.length,
            edges: edges.length
        });

        if (!nodes.length && !edges.length) return undefined;
        if (nodes.length === 0) return undefined;

        let allHavePositions = true;

        nodes.forEach(node => {
            let hasPos = (typeof node.x === 'number' && typeof node.y === 'number');
            if (!hasPos) {
                allHavePositions = false;
                delete node.x;
                delete node.y;
            }
            node.fixed = false;
        });

        return {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges),
            allHavePositions: allHavePositions
        };
    },

    normalizeNodesForDisplay(nodes) {
        if (!nodes) return;
        nodes.forEach(node => {
            if (!node || !node.id) return;
            let isVariableNode = (typeof node.id === 'string' && /^__Variable-(?!Literal)/.test(node.id)) || node.id === '__RectForVariable__';
            if (isVariableNode) {
                if (node.hidden === undefined) node.hidden = true;
                return;
            }
            node.hidden = false;
            // if (!node.shape) node.shape = 'dot';
            if (node.isLiteral) {
                node.color = node.color || '#fffae6';
            } else {
                if (!node.color) node.color = 'skyblue';
            }
            // if (node.size === undefined) node.size = 20;
            // if (node.value === undefined) node.value = node.size;
            if (!node.font) {
                node.font = {
                    size: 14,
                    color: '#000000'
                };
            }
        });
    },

    buildGraphFromStoredGraph(graph) {
        if (!graph) return undefined;
        let duplicated;
        try {
            duplicated = (graph.duplicate && typeof graph.duplicate === 'function') ? graph.duplicate() : graph;
        } catch (e) {
            duplicated = graph;
        }
        let visGraph;
        try {
            visGraph = duplicated.generateVisjsGraph(true);
        } catch (e) {
            return undefined;
        }
        let nodes = this.cloneVisItems(visGraph && visGraph.nodes ? visGraph.nodes : []);
        let edges = this.cloneVisItems(visGraph && visGraph.edges ? visGraph.edges : []);
        this.normalizeNodesForDisplay(nodes);
        this.ensureVariablePlaceholder(nodes);
        this.applyReferencePositions(nodes);
        return { nodes, edges };
    },

    showGraphState(graphData) {
        if (typeof vis === 'undefined' || !vis.Network || !this.networkContainer) return;
        if (this.emptyMessage) this.emptyMessage.style.display = 'none';
        if (this.networkContainer) this.networkContainer.style.display = 'block';

        if (this.network) {
            this.network.destroy();
            this.network = null;
        }

        this.network = new vis.Network(
            this.networkContainer,
            {
                nodes: graphData.nodes,
                edges: graphData.edges
            },
            this.networkOptions || {}
        );
        this.attachNetworkEvents();

        this.configurePhysics(graphData.allHavePositions);

        try {
            let allNodes = graphData.nodes && typeof graphData.nodes.get === 'function' ? graphData.nodes.get() : [];
            let allEdges = graphData.edges && typeof graphData.edges.get === 'function' ? graphData.edges.get() : [];
            console.log('[ProgramSynth] showGraphState applied', {
                allHavePositions: graphData.allHavePositions,
                nodeCount: allNodes ? allNodes.length : 0,
                edgeCount: allEdges ? allEdges.length : 0,
                sampleNodes: allNodes ? allNodes.slice(0, 5) : [],
                sampleEdges: allEdges ? allEdges.slice(0, 5) : []
            });
        } catch (e) {
            console.log('[ProgramSynth] showGraphState applied (log failed)', e);
        }

        try {
            if (!graphData.allHavePositions)
                this.network.stabilize();
            this.network.fit({
                animation: {
                    duration: 300,
                    easingFunction: 'easeInOutQuad'
                },
                padding: 40
            });
        } catch (e) {
        }
    },

    showEmptyState() {
        if (this.networkContainer) this.networkContainer.style.display = 'none';
        if (this.emptyMessage) this.emptyMessage.style.display = 'flex';
        console.log('[ProgramSynth] showEmptyState');
    },

    configurePhysics(allHavePositions) {
        if (!this.network) return;
        this.network.setOptions({
            physics: {
                enabled: !allHavePositions,
                stabilization: allHavePositions ? false : {
                    iterations: 200
                }
            }
        });
    },

    applyEdits() {
        if (!this.network || !this.currentContext) return;

        let nodes = this.cloneVisItems(this.network.body.data.nodes.get());
        let edges = this.cloneVisItems(this.network.body.data.edges.get());

        let cacheKey = this.makeContextKey(this.currentContext);

        this.runtimeGraphs[cacheKey] = {
            nodes: nodes,
            edges: edges
        };

        if (!this.savedEdits[this.currentContext.callLabel])
            this.savedEdits[this.currentContext.callLabel] = {};
        if (!this.savedEdits[this.currentContext.callLabel][this.currentContext.contextSensitiveID])
            this.savedEdits[this.currentContext.callLabel][this.currentContext.contextSensitiveID] = {};
        this.savedEdits[this.currentContext.callLabel][this.currentContext.contextSensitiveID][this.currentContext.checkpointId || ''] = {
            nodes: nodes,
            edges: edges,
            operations: (this.currentOperations || []).slice()
        };

        this.lastResult = {
            cacheKey: cacheKey,
            callLabel: this.currentContext.callLabel,
            loopLabel: this.currentContext.loopLabel,
            contextSensitiveID: this.currentContext.contextSensitiveID,
            nodes: nodes,
            edges: edges
        };

        console.log('[ProgramSynth] saved runtime graph', this.lastResult);
    },

    updateNodeCounter(graphData) {
        if (!graphData || !graphData.nodes) return;
        let nodes = [];
        if (typeof graphData.nodes.get === 'function') {
            nodes = graphData.nodes.get();
        } else if (Array.isArray(graphData.nodes)) {
            nodes = graphData.nodes;
        }
        nodes.forEach(node => {
            if (!node || !node.id || typeof node.id !== 'string') return;
            if (node.id.indexOf('__temp') === 0) {
                let num = parseInt(node.id.replace('__temp', ''), 10);
                if (!isNaN(num) && num > this.nodeCounter)
                    this.nodeCounter = num;
            }
        });
    },

    attachNetworkEvents() {
        if (!this.network) return;

        this.network.on('doubleClick', params => {
            __$__.ProgramSynth.onDoubleClick(params);
        });

        this.network.on('dragStart', params => {
            if (params.nodes && params.nodes.length > 0) {
                let nodeId = params.nodes[0];
                __$__.ProgramSynth.network.body.data.nodes.update({ id: nodeId, fixed: false });
            }
        });

        this.network.on('dragEnd', params => {
            if (params.nodes && params.nodes.length > 0) {
                let nodeId = params.nodes[0];
                let pos = __$__.ProgramSynth.network.getPositions(nodeId);
                let resolvedPos = pos && pos[nodeId] ? pos[nodeId] : pos;
                if (!resolvedPos) return;
                __$__.ProgramSynth.network.body.data.nodes.update({
                    id: nodeId,
                    x: resolvedPos.x,
                    y: resolvedPos.y,
                    fixed: true
                });
            }
        });

        this.network.on('hold', param => {
            if (!param) return;
            if (param.nodes && param.nodes.length) {
                __$__.ProgramSynth.network.addEdgeMode();
            } else if (param.edges && param.edges.length) {
                __$__.ProgramSynth.network.editEdgeMode();
            }
        });
    },

    onDoubleClick(param) {
        if (!this.network || !param) return;

        if (param.nodes && param.nodes.length) {
            let nodeId = param.nodes[0];
            let node = this.network.body.data.nodes.get(nodeId);
            this.showEditPopup({
                operation: 'Edit Node',
                defaultLabel: node && node.label ? node.label : '',
                showLiteral: true,
                literalChecked: node && node.isLiteral,
                onSave: ({ label, isLiteral }) => {
                    let update = {
                        id: nodeId,
                        label: label,
                        isLiteral: isLiteral,
                        type: isLiteral ? 'string' : node.type,
                        color: isLiteral ? this.makeLiteralColor() : null,
                        fixed: false
                    };
                    this.network.body.data.nodes.update(update);
                    this.saveOperation('editNode', update);
                }
            });
        } else if (param.edges && param.edges.length) {
            let edgeId = param.edges[0];
            let edge = this.network.body.data.edges.get(edgeId);
            this.showEditPopup({
                operation: 'Edit Edge',
                defaultLabel: edge && edge.label ? edge.label : '',
                showLiteral: false,
                onSave: ({ label }) => {
                    if (!edge) return;
                    if (edge.from && edge.from.slice && edge.from.slice(0, 11) === '__Variable-') {
                        let nodes = this.network.body.data.nodes;
                        let newNodeId = '__Variable-' + label;
                        if (edge.from !== newNodeId) {
                            let node = nodes.get(edge.from);
                            nodes.update({
                                id: newNodeId,
                                label: label,
                                hidden: true
                            });
                            this.network.body.data.edges.update({
                                id: edgeId,
                                from: newNodeId,
                                label: label,
                                color: (label === 'return') ? 'black' : 'seagreen'
                            });
                            nodes.remove(edge.from);
                            this.saveOperation('editVariableLabel', {
                                to: edge.to,
                                oldLabel: edge.label,
                                newLabel: label
                            });
                        } else {
                            this.network.body.data.edges.update({
                                id: edgeId,
                                label: label,
                                color: (label === 'return') ? 'black' : 'seagreen'
                            });
                            this.saveOperation('editVariableLabel', {
                                to: edge.to,
                                oldLabel: edge.label,
                                newLabel: label
                            });
                        }
                    } else {
                        this.network.body.data.edges.update({
                            id: edgeId,
                            label: label
                        });
                        this.saveOperation('editEdgeLabel', {
                            from: edge.from,
                            to: edge.to,
                            oldLabel: edge.label,
                            newLabel: label
                        });
                    }
                }
            });
        } else {
            let canvasPos = param.pointer && param.pointer.canvas ? param.pointer.canvas : { x: 0, y: 0 };
            this.showEditPopup({
                operation: 'Add Node',
                defaultLabel: '',
                showLiteral: true,
                literalChecked: false,
                onSave: ({ label, isLiteral }) => {
                    let nodeId = 'manual_dbl_' + Date.now();
                    let node = {
                        id: nodeId,
                        label: label,
                        isLiteral: isLiteral,
                        type: isLiteral ? 'string' : undefined,
                        color: isLiteral ? this.makeLiteralColor() : 'skyblue',
                        // shape: 'dot',
                        x: canvasPos.x,
                        y: canvasPos.y,
                        fixed: true // Match Testize
                    };
                    try {
                        this.network.body.data.nodes.update(node);
                        this.saveOperation('addNode', node);
                    } catch (e) {
                        console.error('[ProgramSynth] Add Node (DoubleClick) failed', e);
                    }
                }
            });
        }
    },

    handleAddNode(data, callback) {
        this.showEditPopup({
            operation: 'Add Node',
            defaultLabel: '',
            showLiteral: true,
            literalChecked: false,
            onSave: ({ label, isLiteral }) => {
                data.id = data.id || 'manual_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                data.label = label;
                data.isLiteral = isLiteral;
                data.type = isLiteral ? 'string' : undefined;
                data.color = isLiteral ? this.makeLiteralColor() : 'skyblue';
                // data.shape = 'dot';
                data.fixed = true;

                this.saveOperation('addNode', data);
                callback(data);
            },
            onCancel: () => callback(null)
        });
    },

    handleAddEdge(data, callback) {
        if (!this.network || !this.network.body || !this.network.body.data) {
            callback(null);
            return;
        }

        let nodes = this.network.body.data.nodes;
        let edges = this.network.body.data.edges;
        let fromNode = nodes.get(data.from);
        if (fromNode && fromNode.type) {
            callback(null);
            return;
        }
        if (data.to === '__RectForVariable__') {
            callback(null);
            return;
        }

        if (data.from === '__RectForVariable__') {
            this.showEditPopup({
                operation: 'Add Variable',
                defaultLabel: '',
                showLiteral: false,
                onSave: ({ label }) => {
                    let variableNodeId = '__Variable-' + label;
                    let invisibleNode = nodes.get(variableNodeId);
                    let variableEdge = Object.values(edges._data || {}).find(edge => edge.from === variableNodeId);

                    if (!invisibleNode) {
                        nodes.add({
                            id: variableNodeId,
                            label: label,
                            hidden: true
                        });
                    }

                    if (variableEdge) {
                        edges.update({
                            id: variableEdge.id,
                            to: data.to,
                            label: label,
                            color: (label === 'return') ? 'black' : 'seagreen'
                        });
                        this.saveOperation('editVariableReference', {
                            oldTo: variableEdge.to,
                            newTo: data.to,
                            label: label
                        });
                    } else {
                        edges.add({
                            from: variableNodeId,
                            to: data.to,
                            color: (label === 'return') ? 'black' : 'seagreen',
                            label: label,
                            length: 30
                        });
                        this.saveOperation('addVariable', {
                            to: data.to,
                            label: label
                        });
                    }
                    callback(null);
                },
                onCancel: () => callback(null)
            });
            return;
        }

        this.showEditPopup({
            operation: 'Add Edge',
            defaultLabel: '',
            showLiteral: false,
            onSave: ({ label }) => {
                let sameEdge = Object.values(edges._data || {}).find(edge => edge.from === data.from && edge.label === label);
                if (sameEdge) {
                    edges.remove(sameEdge.id);
                    edges.add({
                        label: label,
                        from: data.from,
                        to: data.to
                    });
                    this.saveOperation('editEdgeReference', {
                        from: data.from,
                        oldTo: sameEdge.to,
                        newTo: data.to,
                        label: label
                    });
                    callback(null);
                } else {
                    data.label = label;
                    this.saveOperation('addEdge', {
                        from: data.from,
                        to: data.to,
                        label: label
                    });
                    callback(data);
                }
            },
            onCancel: () => callback(null)
        });
    },

    handleEditEdge(data, callback) {
        if (!this.network || !this.network.body || !this.network.body.data) {
            callback(null);
            return;
        }
        let edges = this.network.body.data.edges;
        let origEdge = edges.get(data.id);
        if (!origEdge) {
            callback(null);
            return;
        }
        if (data.from.slice(0, 11) === '__Variable-') {
            data.label = origEdge.label || data.label;
            data.color = (data.label === 'return') ? 'black' : 'seagreen';
            this.saveOperation('editVariableReference', {
                oldTo: origEdge.to,
                newTo: data.to,
                label: origEdge.label
            });
        } else {
            this.saveOperation('editEdgeReference', {
                from: data.from,
                oldTo: origEdge.to,
                newTo: data.to,
                label: origEdge.label || data.label
            });
        }
        callback(data);
    },

    handleDeleteNode(data, callback) {
        if (!data || !data.nodes || data.nodes.indexOf('__RectForVariable__') >= 0) {
            callback(null);
            return;
        }
        this.saveOperation('deleteNode', { id: data.nodes[0] });
        callback(data);
    },

    handleDeleteEdge(data, callback) {
        if (!this.network || !this.network.body || !this.network.body.data || !data.edges || !data.edges.length) {
            callback(null);
            return;
        }
        let edges = this.network.body.data.edges;
        let edgeInfo = edges.get(data.edges[0]);
        if (edgeInfo && edgeInfo.from && edgeInfo.from.slice(0, 11) === '__Variable-') {
            this.saveOperation('deleteVariable', {
                label: edgeInfo.label,
                to: edgeInfo.to
            });
            this.network.body.data.nodes.remove(edgeInfo.from);
            callback(data);
        } else if (edgeInfo) {
            this.saveOperation('deleteEdge', {
                label: edgeInfo.label,
                from: edgeInfo.from,
                to: edgeInfo.to
            });
            callback(data);
        } else {
            callback(null);
        }
    },

    showEditPopup({ operation, defaultLabel = '', showLiteral = true, literalChecked = false, onSave, onCancel }) {
        let form = this.editForm;
        if (!form || !form.popup) return;

        form.operationLabel.textContent = operation || '';
        form.labelInput.value = defaultLabel || '';
        form.literalContainer.style.display = showLiteral ? 'block' : 'none';
        form.literalCheckbox.checked = !!literalChecked;

        form.onSave = onSave;
        form.onCancel = onCancel;

        form.saveButton.onclick = () => {
            let payload = {
                label: form.labelInput.value,
                isLiteral: form.literalCheckbox.checked
            };
            let handler = form.onSave;
            this.hideEditPopup();
            if (typeof handler === 'function') handler(payload);
        };
        form.cancelButton.onclick = () => {
            let handler = form.onCancel;
            this.hideEditPopup();
            if (typeof handler === 'function') handler();
        };

        form.popup.style.display = 'block';
        form.labelInput.focus();
    },

    hideEditPopup() {
        let form = this.editForm;
        if (!form || !form.popup) return;
        form.popup.style.display = 'none';
        form.onSave = undefined;
        form.onCancel = undefined;
        form.saveButton.onclick = null;
        form.cancelButton.onclick = null;
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
        };
    },

    updateTitle() {
        if (!this.titleLabel) return;
        if (!this.currentContext || !this.currentContext.loopLabel) {
            this.titleLabel.textContent = 'Runtime Graph Editor';
            return;
        }
        this.titleLabel.textContent = this.currentContext.loopLabel + ' runtime graph';
    },

    updateInfoLabel() {
        if (!this.infoLabel) return;
        if (!this.currentContext) {
            this.infoLabel.textContent = '';
            return;
        }

        let parts = [];
        if (this.currentContext.contextSensitiveID)
            parts.push('contextSensitiveID: ' + this.currentContext.contextSensitiveID);
        if (this.currentContext.callLabel)
            parts.push('callLabel: ' + this.currentContext.callLabel);
        if (this.currentContext.checkpointId)
            parts.push('checkpointId: ' + this.currentContext.checkpointId);

        this.infoLabel.textContent = parts.join(' / ');
    },

    cloneVisItems(items) {
        let normalized = this.normalizeVisItems(items);
        if (!normalized.length) return [];
        return normalized.map(item => {
            if (typeof jQuery !== 'undefined' && typeof jQuery.extend === 'function')
                return jQuery.extend(true, {}, item);
            return JSON.parse(JSON.stringify(item));
        });
    },

    normalizeVisItems(items) {
        if (!items) return [];
        if (Array.isArray(items))
            return items;
        if (typeof vis !== 'undefined' && vis.DataSet && items instanceof vis.DataSet)
            return items.get();
        if (typeof items.get === 'function') {
            try {
                let values = items.get();
                if (Array.isArray(values))
                    return values;
            } catch (e) {
            }
        }
        if (typeof items === 'object') {
            try {
                return Object.keys(items).map(key => items[key]);
            } catch (e) {
            }
        }
        return [];
    }
};

__$__.ProgramSynth.init();
