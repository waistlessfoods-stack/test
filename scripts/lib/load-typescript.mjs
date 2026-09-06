import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Compile the actual TS/TSX sources with only external side effects replaced.
export function sourceLoader(overrides = {}) {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const compiledModule = { exports: {} };
    cache.set(filename, compiledModule);
    const nativeRequire = createRequire(filename);
    const localRequire = (specifier) => {
      if (Object.hasOwn(overrides, specifier)) return overrides[specifier];
      if (specifier.startsWith('@/')) {
        const base = specifier.slice(2);
        const resolved = [base + '.ts', base + '.tsx', base + '/index.ts']
          .find((candidate) => existsSync(path.join(root, candidate)));
        if (!resolved) throw new Error(`Unresolved source: ${specifier}`);
        return load(resolved);
      }
      return nativeRequire(specifier);
    };
    const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    });
    const execute = vm.runInThisContext(
      `(function(require, module, exports) { ${outputText}\n})`, { filename },
    );
    execute(localRequire, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  return load;
}
