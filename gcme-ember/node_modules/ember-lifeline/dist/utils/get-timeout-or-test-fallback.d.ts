import { TestTimeoutOptions } from "../types/index";
/**
 * @function getTimeoutOrTestFallback
 * @param {number} timeout The timeout value that gets scaled down in case of the test environment.
 * @param {TestTimeoutOptions} [options]
 * @param {number} [options.timeout] The timeout value that needs to be set in the test environment if passed
 * @param {number} [options.scaling] The amount by which the timeout needs to be scaled down
 * @return {number} The adjusted timeout value depending on the environment and scaling factor.
 */
declare function getTimeoutOrTestFallback(timeout: number, { timeout: testTimeout, scaling }?: TestTimeoutOptions): number;
export { getTimeoutOrTestFallback };
