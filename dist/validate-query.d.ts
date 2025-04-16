import { type Request } from "express";
/**
 * Validate query parameters against allowed values.
 * @date 4/16/2024 - 11:10:34 AM
 * @export
 * @param {Request["query"]} query - The Express request query object.
 * @param {Record<string, string | AllowedValue | AllowedValueAny>} [allowedValues={}] - Allowed values for each query key.
 * @param {boolean isMissingRuleValid} [isMissingRuleValid=false] - If true, allows query keys not present in allowedValues.
 * @returns {boolean} - True if all query parameters are valid, false otherwise.
 */
type AllowedValue = {
    value: unknown;
    required?: boolean;
    exact?: boolean;
};
type AllowedValueAny = {
    anyValue: true;
    required?: boolean;
};
export declare function validateQuery(query: Request["query"], allowedValues?: Record<string, string | AllowedValue | AllowedValueAny>, isMissingRuleValid?: boolean): boolean;
export {};
