__$__.Traverse = {
    literals: {
        boolean: true,
        number: true,
        string: true,
        symbol: true
    },
    
    
    traverse: function(objs, variables = {}) {
        let retGraph = new __$__.StoredGraphFormat.Graph();
        let graphNodes = {};

        for (let i = 0; i < objs.length; i++) {
            let obj = objs[i];
    
            if (graphNodes[obj.__id] || obj === null || obj === undefined)
                continue;
    
            __$__.Traverse.dfs(retGraph, obj, graphNodes, objs);
        }

        Object.keys(variables).forEach(key => {
            let value = variables[key];
            if (value === undefined || value === null)
                return;

            if (value.__id) {
                let variableNode = new __$__.StoredGraphFormat.VariableNode(key);
                let variableEdge = new __$__.StoredGraphFormat.Edge(variableNode.id, value.__id, key);

                retGraph.pushNode(variableNode);
                retGraph.pushEdge(variableEdge);
            } else if (__$__.Traverse.literals[typeof value]) {
                let variableNode = new __$__.StoredGraphFormat.VariableNode(key);
                let literalNodeID = '__VariableLiteral-' + key;
                let literalNode = new __$__.StoredGraphFormat.Node(
                    literalNodeID,
                    value,
                    true,
                    typeof value
                );

                retGraph.pushNode(literalNode);
                retGraph.pushNode(variableNode);
                retGraph.pushEdge(new __$__.StoredGraphFormat.Edge(
                    variableNode.id,
                    literalNodeID,
                    key
                ));
            }
        });


        return retGraph;
    },
    
    dfs: function(graph, obj, graphNodes, objs) {
        let node;
        if (obj.__id && !graphNodes[obj.__id]) {
            node = new __$__.StoredGraphFormat.Node(
                obj.__id,
                obj.__ClassName__ || obj.constructor.name,
                false,
                typeof obj
            );
            graph.pushNode(node);
            graphNodes[obj.__id] = obj;
        } else {
            return;
        }
    
        Object.keys(obj).forEach(key => {
            // Don't search if the head of property name is "__"
            if (key.slice(0, 2) === '__')
                return;

            // "to" is destination of edge
            let to = obj[key];
    
            if (typeof to !== "function" && to !== null && to !== undefined) {
                if (__$__.Traverse.literals[typeof to]) { // if "to" is literal
                    let literalNodeID = obj.__id + '-' + key;
                    let literalNode = new __$__.StoredGraphFormat.Node(
                        literalNodeID,
                        to,
                        true,
                        typeof to
                    );

                    graph.pushNode(literalNode);
                    graph.pushEdge(new __$__.StoredGraphFormat.Edge(
                        obj.__id,
                        literalNodeID,
                        key
                    ));
                } else {
                    if (!to.__id) Object.setProperty(to, '__id' , obj.__id + '-' + key);
                    __$__.Traverse.dfs(graph, to, graphNodes, objs);

                    graph.pushEdge(new __$__.StoredGraphFormat.Edge(
                        obj.__id,
                        to.__id,
                        key
                    ));
                }
            }
        });
    }
};
