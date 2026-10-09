import { applyValidationResult } from "@refsyn/whole-method-validation";
import { validateInWorker } from "@refsyn/whole-method-validator-client";
import { applyRefsynTaskOutcomes, runRefsynTasks } from "@refsyn/escher-adapter";

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

export const completeBrowserSynthesis = async (artifacts, options = {}, request) => {
    const response = cloneResponse(artifacts.response);
    appendWarnings(response, artifacts.warnings);

    const tasks = artifacts.task_json ? JSON.parse(artifacts.task_json) : [];
    const outcomes = runRefsynTasks(tasks, {
        quiet: true,
        maxCost: options.maxCost ?? defaultOptions.maxCost,
        timeoutMs: options.timeoutMs ?? defaultOptions.timeoutMs,
        searchSizeFactor: options.searchSizeFactor ?? defaultOptions.searchSizeFactor
    });
    applyRefsynTaskOutcomes(response, outcomes);
    const result = await validateInWorker({ request, response, taskNames: tasks.map(task => task.name) });
    return applyValidationResult(response, result);
};

export const handleSynthesisMessage = async (runCore, request, options = {}) => {
    const artifacts = await runCore(request, options);
    return completeBrowserSynthesis(artifacts, options, request);
};
