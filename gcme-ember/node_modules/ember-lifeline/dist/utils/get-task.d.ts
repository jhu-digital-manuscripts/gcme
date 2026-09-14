import { TaskOrName, Destroyable } from "../types/index";
/**
 * @function getTask
 * @param obj
 * @param taskOrName
 * @param taskName
 */
declare function getTask(obj: Destroyable, taskOrName: TaskOrName, taskName: string): Function;
export { getTask as default };
