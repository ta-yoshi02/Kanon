import { runRefsynTasks } from "@refsyn/escher";

const defaultOptions = {
    maxCost: 20,
    timeoutMs: 2000,
    searchSizeFactor: 3
};

const cloneResponse = (response) => JSON.parse(JSON.stringify(response));

const appendWarnings = (response, warnings = []) => {
    if (!Array.isArray(warnings) || warnings.length === 0) {
        return;
    }

    const text = warnings.join("\n");
    response.list_environment_info = response.list_environment_info
        ? `${response.list_environment_info}\n${text}`
        : text;
};

const applyTaskOutcomes = (response, outcomes) => {
    const existing = Array.isArray(response.escher_results) ? response.escher_results : [];
    const merged = existing.slice();

    for (const outcome of outcomes) {
        merged.push({
            name: outcome.name,
            success: outcome.success,
            rendered: outcome.rendered,
            error: outcome.error
        });

        if (typeof outcome.compiled_js === "string" && outcome.compiled_js.length > 0) {
            response.code.push(outcome.compiled_js);
            response.individual_codes.push(`${outcome.name}: ${outcome.compiled_js}`);
            continue;
        }

        if (typeof outcome.error === "string" && outcome.error.length > 0) {
            response.individual_codes.push(`${outcome.name}: ERROR ${outcome.error}`);
            continue;
        }

        if (typeof outcome.rendered === "string" && outcome.rendered.length > 0) {
            response.individual_codes.push(
                `${outcome.name}: ERROR compiled_js missing for rendered term ${outcome.rendered}`,
            );
            continue;
        }

        response.individual_codes.push(`${outcome.name}: no output`);
    }

    response.escher_results = merged;
};

export const completeBrowserSynthesis = async (artifacts, options = {}) => {
    const response = cloneResponse(artifacts.response);
    appendWarnings(response, artifacts.warnings);

    if (!artifacts.task_json) {
        return response;
    }

    const tasks = JSON.parse(artifacts.task_json);
    const outcomes = runRefsynTasks(tasks, {
        quiet: true,
        maxCost: options.maxCost ?? defaultOptions.maxCost,
        timeoutMs: options.timeoutMs ?? defaultOptions.timeoutMs,
        searchSizeFactor: options.searchSizeFactor ?? defaultOptions.searchSizeFactor
    });
    applyTaskOutcomes(response, outcomes);
    return response;
};

export const handleSynthesisMessage = async (runCore, request, options = {}) => {
    const artifacts = await runCore(request, options);
    return completeBrowserSynthesis(artifacts, options);
};
