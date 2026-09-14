export class GeneratorStepResult {
    constructor(value: any, done: any, errored: any);
    value: any;
    done: any;
    errored: any;
}
export class GeneratorState {
    constructor(generatorFactory: any);
    done: boolean;
    generatorFactory: any;
    iterator: any;
    step(resolvedValue: any, iteratorMethod: any): GeneratorStepResult;
    getIterator(): any;
    finalize(value: any, errored: any): GeneratorStepResult;
}
//# sourceMappingURL=generator-state.d.ts.map