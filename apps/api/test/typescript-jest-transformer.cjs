const ts = require('typescript');

module.exports = {
  process(sourceText, sourcePath) {
    const result = ts.transpileModule(sourceText, {
      compilerOptions: {
        allowSyntheticDefaultImports: true,
        emitDecoratorMetadata: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2023,
      },
      fileName: sourcePath,
    });

    return {
      code: result.outputText,
    };
  },
};
