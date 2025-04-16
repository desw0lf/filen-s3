"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = void 0;
function validateQuery(query, allowedValues = {}, isMissingRuleValid = false) {
    const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
    const allowedEntries = Object.entries(allowedValues);
    for (const [key, rule] of allowedEntries) {
        if (isObject(rule)) {
            if (rule.required && !(key in query))
                return false;
            // if (typeof rule.minLength === "number" && typeof query[key] === "string" && (query[key] as string).length < rule.minLength) return false
        }
    }
    const queryEntries = Object.entries(query);
    const toLowerCase = (v, exact) => (typeof v === "string" && !exact ? v.toLowerCase() : v);
    for (const [key, value] of queryEntries) {
        const found = allowedValues[key];
        if (!found && isMissingRuleValid === true)
            continue; // no rule found & valid to have unaccounted for params
        const rule = isObject(found) ? found : { value: found };
        if (rule.anyValue)
            continue;
        if (toLowerCase(rule.value, rule.exact) !== toLowerCase(value, rule.exact))
            return false;
    }
    return true;
}
exports.validateQuery = validateQuery;
//# sourceMappingURL=validate-query.js.map