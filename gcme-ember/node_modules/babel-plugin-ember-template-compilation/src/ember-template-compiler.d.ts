import type { ASTv1, PreprocessOptions } from '@glimmer/syntax';
export interface EmberTemplateCompiler {
    precompile(templateString: string, options: PreprocessOptions): string;
    _buildCompileOptions(options: PreprocessOptions): PreprocessOptions;
    _print(ast: ASTv1.Template, options?: {
        entityEncoding?: 'transformed' | 'raw';
    }): string;
    _preprocess(src: string, options?: PreprocessOptions): ASTv1.Template;
}
export { PreprocessOptions };
export declare function assertTemplateCompiler(emberTemplateCompiler: any): asserts emberTemplateCompiler is EmberTemplateCompiler;
