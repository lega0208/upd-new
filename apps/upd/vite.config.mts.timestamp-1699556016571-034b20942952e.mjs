// apps/upd/vite.config.mts
import { resolve as resolve3 } from "path";
import { defineConfig, splitVendorChunkPlugin } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/vite/dist/node/index.js";

// apps/upd/vite-plugin/plugin/node/dir-importer.ts
import { stat } from "fs/promises";
import { relative, resolve } from "path";
import { cwd } from "process";
import { normalizePath } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/vite/dist/node/index.js";
var DirImporterPlugin = {
  name: "vite-plugin-angular/dir-importer",
  enforce: "pre",
  async resolveId(source, importer, options) {
    if (!importer || !options.ssr) {
      return;
    }
    try {
      const packageName = normalizePath(relative(cwd(), source));
      const relativePath = resolve(cwd(), "node_modules", source);
      const stats = await stat(relativePath);
      if (stats.isDirectory()) {
        const lastPathSegment = source.split("/").pop();
        const candidates = [
          "index.js",
          "index.mjs",
          lastPathSegment + ".js",
          lastPathSegment + ".mjs"
        ];
        for (const candidate of candidates) {
          try {
            const stats2 = await stat(resolve(relativePath, candidate));
            if (stats2.isFile()) {
              return this.resolve(`${packageName}/${candidate}`, importer, {
                ...options,
                skipSelf: true
              });
            }
          } catch {
          }
        }
      }
    } catch {
    }
  },
  config(config, env) {
    return {
      ssr: {
        noExternal: /apollo-angular/
      }
    };
  }
};

// apps/upd/vite-plugin/plugin/plugins/config.ts
import { existsSync, statSync } from "fs";
import { join } from "path";
import { cwd as cwd2 } from "process";
var findNodeModules = () => {
  const candidates = [
    join(cwd2(), "..", "..", "..", "node_modules", "@angular"),
    join(cwd2(), "..", "..", "node_modules", "@angular"),
    join(cwd2(), "..", "node_modules", "@angular"),
    join(cwd2(), "node_modules", "@angular")
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isDirectory()) {
      return candidate.replace("@angular", "");
    }
  }
};
var nodeModulesDir = findNodeModules();
var CommonPlugin = {
  name: "vite-plugin-angular-common",
  enforce: "pre",
  config(config, env) {
    return {
      ssr: {
        external: ["reflect-metadata", "xhr2"],
        noExternal: [
          /@nitedani\/vite-plugin-angular/,
          /@nitedani\/vite-plugin-ssr-adapter/,
          /@nitedani\/angular-renderer-core/,
          /@nitedani\/angular-renderer-express/,
          /@nitedani\/angular-renderer-nestjs/
        ]
      },
      build: {
        outDir: env.ssrBuild ? "dist/server" : "dist/client",
        rollupOptions: {
          external: ["xhr2"],
          output: {
            manualChunks: (id) => {
              const runtime1 = [
                "@nitedani/angular-renderer-core",
                "@nitedani/vite-plugin-angular/client"
                // '@angular',
                // 'zone.js',
              ];
              if (runtime1.some((s) => id.includes(s))) {
                return "runtime1";
              }
            }
          }
        }
      },
      optimizeDeps: {
        exclude: ["@angular/compiler"]
      },
      resolve: {
        alias: [
          {
            find: /~/,
            //@ts-ignore
            replacement: nodeModulesDir
          }
        ]
      }
    };
  }
};

// apps/upd/vite-plugin/plugin/swc/transform.ts
import {
  minify,
  plugins,
  transform
} from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@swc/core/index.js";

// apps/upd/vite-plugin/plugin/swc/visitors/compiler.ts
import { Visitor } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@swc/core/Visitor.js";
import {
  createSpan,
  createStringLiteral,
  isImportDeclaration
} from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/swc-ast-helpers/swc-ast-helpers.js";

// apps/upd/vite-plugin/plugin/swc/visitors/components.ts
import { Visitor as Visitor2 } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@swc/core/Visitor.js";
import { dirname, extname, join as join2 } from "path";
import {
  createArrayExpression,
  createExpressionStatement,
  createIdentifer,
  createImportDefaultSpecifier,
  createKeyValueProperty,
  createSpan as createSpan2,
  createStringLiteral as createStringLiteral2
} from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/swc-ast-helpers/swc-ast-helpers.js";
var randomIdentifier = () => Math.random().toString(36).substring(2, 15).replace(/\d/g, "");
var isComponentDecorator = (decorator) => {
  var _a;
  return decorator.expression.type === "CallExpression" && ((_a = decorator.expression) == null ? void 0 : _a.callee).value === "Component";
};
var AngularComponents = class extends Visitor2 {
  constructor(options) {
    super();
    this.options = options;
    this.importFiles = [];
  }
  visitTsTypes(nodes) {
    return nodes;
  }
  visitTsType(nodes) {
    return nodes;
  }
  visitModuleItems(items) {
    const files = [...items.flatMap((item) => this.visitModuleItem(item))];
    if (this.importFiles.length) {
      for (const { url, identifier } of this.importFiles) {
        files.unshift({
          type: "ImportDeclaration",
          span: createSpan2(),
          typeOnly: false,
          specifiers: [createImportDefaultSpecifier(identifier)],
          source: createStringLiteral2(url)
        });
      }
    }
    return files;
  }
  visitDecorator(decorator) {
    if (!isComponentDecorator(decorator))
      return decorator;
    const componentOptions = decorator.expression.arguments[0].expression;
    decorator.expression.arguments = [
      {
        expression: {
          ...componentOptions,
          properties: componentOptions.properties.map((prop) => {
            switch (prop.key.value) {
              case "styleUrls": {
                return this.transformStyleUrls(prop);
              }
              case "templateUrl": {
                return this.transformTemplateUrl(prop);
              }
              default:
                return prop;
            }
          })
        }
      }
    ];
    return decorator;
  }
  transformTemplateUrl(prop) {
    const templateUrl = prop.value.value;
    const actualImportPath = join2(dirname(this.options.sourceUrl), templateUrl);
    if (extname(actualImportPath) !== ".html") {
      throw new Error(
        `HTML type ${extname(actualImportPath)} is not supported.`
      );
    }
    const identifier = randomIdentifier();
    this.importFiles.push({
      identifier,
      url: templateUrl + "?raw"
    });
    return createKeyValueProperty(
      createIdentifer("template"),
      createIdentifer(identifier)
    );
  }
  transformStyleUrls(prop) {
    const styleUrls = prop.value;
    const styles = styleUrls.elements.map((e) => {
      const styleUrl = e.expression.value;
      const identifier = randomIdentifier();
      this.importFiles.push({
        url: styleUrl + "?inline",
        identifier
      });
      return identifier;
    });
    return {
      ...prop,
      key: createIdentifer("styles"),
      value: createArrayExpression(
        styles.map((c) => createExpressionStatement(createIdentifer(c)))
      )
    };
  }
};

// apps/upd/vite-plugin/plugin/swc/visitors/injector.ts
import { Visitor as Visitor3 } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@swc/core/Visitor.js";
import {
  createIdentifer as createIdentifer2,
  createImportSpecifier,
  createSpan as createSpan3,
  isCallExpression,
  isIdentifer,
  isImportDeclaration as isImportDeclaration2,
  isTsTypeAnnotation,
  isTsTypeReference
} from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/swc-ast-helpers/swc-ast-helpers.js";
var hasInjectDecorator = (node) => {
  var _a;
  return ((_a = node.decorators) == null ? void 0 : _a.length) && node.decorators.some(
    (dec) => isCallExpression(dec.expression) && isIdentifer(dec.expression.callee) && dec.expression.callee.value === "Inject"
  );
};
function createCallExpression(callee, args = []) {
  const object = {
    type: "CallExpression",
    span: createSpan3(),
    callee,
    arguments: args
  };
  return object;
}
var AngularInjector = class extends Visitor3 {
  constructor() {
    super(...arguments);
    this.hasInjectorImport = false;
    this.hasInjectedConstructor = false;
    this.isAngularClass = false;
  }
  visitClassDeclaration(decl) {
    var _a;
    this.isAngularClass = !!((_a = decl.decorators) == null ? void 0 : _a.some(
      (dec) => isCallExpression(dec.expression) && isIdentifer(dec.expression.callee) && ["NgModule", "Component", "Injectable", "Directive"].includes(
        dec.expression.callee.value
      )
    ));
    return super.visitClassDeclaration(decl);
  }
  visitModuleItems(items) {
    const result = items.flatMap((item) => this.visitModuleItem(item));
    if (!this.hasInjectorImport && this.hasInjectedConstructor) {
      return result.map((res) => {
        if (isImportDeclaration2(res)) {
          if (!this.hasInjectorImport && res.source.value === "@angular/core") {
            res.specifiers.push(createImportSpecifier("Inject"));
            this.hasInjectorImport = true;
          }
        }
        return res;
      });
    }
    return result;
  }
  visitConstructorParameter(node) {
    if (hasInjectDecorator(node) || !node.param || !node.param.typeAnnotation) {
      return node;
    } else {
      if (this.isAngularClass && isTsTypeAnnotation(node.param.typeAnnotation) && isTsTypeReference(node.param.typeAnnotation.typeAnnotation) && isIdentifer(node.param.typeAnnotation.typeAnnotation.typeName)) {
        node.decorators = node.decorators ?? [];
        node.decorators.push({
          type: "Decorator",
          span: createSpan3(),
          expression: createCallExpression(createIdentifer2("Inject"), [
            {
              expression: createIdentifer2(
                node.param.typeAnnotation.typeAnnotation.typeName.value
              )
            }
          ])
        });
        this.hasInjectedConstructor = true;
        return node;
      } else {
        return node;
      }
    }
  }
  visitNamedImportSpecifier(node) {
    if (!this.hasInjectorImport && node.local.value === "Inject") {
      this.hasInjectorImport = true;
    }
    return node;
  }
  visitTsTypes(nodes) {
    return nodes;
  }
  visitTsType(nodes) {
    return nodes;
  }
};

// apps/upd/vite-plugin/plugin/swc/visitors/swap-dynamic-import.ts
import { Visitor as Visitor4 } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@swc/core/Visitor.js";
import {
  createImportSpecifier as createImportSpecifier2,
  createStringLiteral as createStringLiteral3,
  isCallExpression as isCallExpression2,
  isImportDeclaration as isImportDeclaration3,
  updateImportDeclaration,
  isExpressionStatement,
  isMemberExpression,
  isIdentifer as isIdentifer2,
  createIdentifer as createIdentifer3
} from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/swc-ast-helpers/swc-ast-helpers.js";

// apps/upd/vite-plugin/plugin/swc/transform.ts
var fileExtensionRE = /\.[^/\s?]+$/;
var swcTransform = async ({ code, id, isSsr, isProduction }) => {
  const minifyOptions = {
    compress: !isSsr && isProduction,
    mangle: !isSsr && isProduction,
    ecma: "2020",
    module: true,
    format: {
      comments: false
    }
  };
  if (id.includes("node_modules")) {
    if (isProduction) {
      return minify(code, minifyOptions);
    }
    return;
  }
  const [filepath, querystring = ""] = id.split("?");
  const [extension = ""] = querystring.match(fileExtensionRE) || filepath.match(fileExtensionRE) || [];
  if (!/\.(js|ts|tsx|jsx?)$/.test(extension)) {
    return;
  }
  return transform(code, {
    sourceMaps: !isProduction,
    jsc: {
      target: "es2020",
      parser: {
        syntax: "typescript",
        tsx: false,
        decorators: true,
        dynamicImport: true
      },
      transform: {
        decoratorMetadata: true,
        legacyDecorator: true
      },
      minify: minifyOptions
    },
    minify: !isSsr && isProduction,
    plugin: plugins([
      (m) => {
        const angularComponentPlugin = new AngularComponents({
          sourceUrl: id
        });
        return angularComponentPlugin.visitProgram(m);
      },
      (m) => {
        const angularInjectorPlugin = new AngularInjector();
        return angularInjectorPlugin.visitProgram(m);
      }
      // (m: Program) => {
      //   return new AngularImportCompilerComponents().visitProgram(m);
      // },
      // ...(isProduction
      //   ? [
      //       (m: Program) =>
      //         new AngularSwapPlatformDynamic().visitProgram(m),
      //     ]
      //   : []),
    ])
  });
};

// apps/upd/vite-plugin/plugin/plugins/dev.plugin.ts
var hmrCode = `
import {
  createInputTransfer,
  createNewHosts,
  removeNgStyles,
} from '@nitedani/vite-plugin-angular/hmr';

// @ts-ignore
const __bootstrapApplication = async (...args) => {
  removeNgStyles();
  // @ts-ignore
  return bootstrapApplication(...args).then((appRef) => {
    if (import.meta.hot) {
      import.meta.hot.accept();
      import.meta.hot.dispose(() => {
        const cmpLocation = appRef.components.map(
          (cmp) => cmp.location.nativeElement
        );

        //@ts-ignore
        import.meta.hot.data.store = {
          disposeOldHosts: createNewHosts(cmpLocation),
          restoreInputValues: createInputTransfer(),
        };
      });

      const store = import.meta.hot.data.store;
      if (store) {
        store.disposeOldHosts();
        store.restoreInputValues();
        appRef.tick();
        delete import.meta.hot.data.store;
      }
    }
    return appRef;
  });
};
`;
var DevelopmentPlugin = {
  name: "vite-plugin-angular-dev",
  enforce: "pre",
  apply(config, env) {
    const isBuild = env.command === "build";
    const isSsrBuild = env.ssrBuild === true;
    return !isBuild || isSsrBuild;
  },
  config(_userConfig, env) {
    return {
      esbuild: false
    };
  },
  resolveId(id) {
    if (id === "/@angular/compiler") {
      return this.resolve("@angular/compiler");
    }
  },
  transformIndexHtml(html) {
    const compilerScript = `<script type="module" src="/@angular/compiler"></script>`;
    return html.replace("</head>", `${compilerScript}</head>`);
  },
  transform(code, id) {
    const isEntry = id.endsWith("main.ts");
    if (isEntry) {
      let t = 0;
      let found = false;
      code = code.replace(/bootstrapApplication/g, (match) => {
        if (++t === 2) {
          found = true;
          return "__bootstrapApplication";
        }
        return match;
      });
      if (found) {
        code = hmrCode + code;
      }
    }
    return swcTransform({
      code,
      id,
      isSsr: false,
      isProduction: false
    });
  }
};

// apps/upd/vite-plugin/plugin/plugins/prod.plugin.ts
import angularApplicationPreset2 from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@angular-devkit/build-angular/src/tools/babel/presets/application.js";
import { createCompilerPlugin } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@angular-devkit/build-angular/src/tools/esbuild/angular/compiler-plugin.js";
import {
  NgtscProgram,
  readConfiguration
} from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@angular/compiler-cli/bundles/index.js";
import { transformAsync as transformAsync2 } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@babel/core/lib/index.js";
import {
  mergeTransformers,
  replaceBootstrap
} from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@ngtools/webpack/src/ivy/transformation.js";
import { resolve as resolve2 } from "path";
import { cwd as cwd3 } from "process";
import ts from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/typescript/lib/typescript.js";

// apps/upd/vite-plugin/plugin/utils.ts
import { mergeConfig } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/vite/dist/node/index.js";
var isObject = (val) => Object.prototype.toString.call(val).slice(8, -1) === "Object";
function clone(input) {
  const output = Array.isArray(input) ? Array(input.length) : {};
  if (input == null ? void 0 : input.getTime)
    return new Date(input.getTime());
  for (const key in input) {
    const val = input[key];
    output[key] = typeof val === "object" && val !== null ? clone(val) : val;
  }
  return output;
}
function mergeDeep(target, source) {
  const output = clone(target);
  for (const key of Object.keys(source)) {
    if (isObject(source[key]) && isObject(target[key])) {
      output[key] = mergeDeep(target[key], source[key]);
      continue;
    }
    output[key] = source[key];
  }
  return output;
}

// apps/upd/vite-plugin/plugin/plugins/optimizer.plugin.ts
import angularApplicationPreset from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@angular-devkit/build-angular/src/tools/babel/presets/application.js";
import { loadEsmModule } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@angular-devkit/build-angular/src/utils/load-esm.js";
import { transformAsync } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@babel/core/lib/index.js";

// apps/upd/vite-plugin/plugin/plugins/utils.ts
import * as wbl from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@angular-devkit/build-angular/src/tools/babel/webpack-loader.js";
import * as app from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/@angular-devkit/build-angular/src/tools/babel/presets/application.js";
var requiresLinking3;
if (typeof wbl["requiresLinking"] !== "undefined") {
  requiresLinking3 = wbl.requiresLinking;
} else if (typeof app["requiresLinking"] !== "undefined") {
  requiresLinking3 = app["requiresLinking"];
}

// apps/upd/vite-plugin/plugin/plugins/optimizer.plugin.ts
var OptimizerPlugin = {
  name: "vite-plugin-angular-optimizer",
  apply(config, env) {
    const isBuild = env.command === "build";
    const isSsrBuild = env.ssrBuild;
    return isBuild && !isSsrBuild;
  },
  enforce: "post",
  config() {
    return {
      esbuild: {
        legalComments: "none",
        keepNames: false,
        define: {
          ngDevMode: "false",
          ngJitMode: "false",
          ngI18nClosureMode: "false"
        },
        supported: {
          // Native async/await is not supported with Zone.js. Disabling support here will cause
          // esbuild to downlevel async/await to a Zone.js supported form.
          "async-await": false,
          // Zone.js also does not support async generators or async iterators. However, esbuild does
          // not currently support downleveling either of them. Instead babel is used within the JS/TS
          // loader to perform the downlevel transformation. They are both disabled here to allow
          // esbuild to handle them in the future if support is ever added.
          // NOTE: If esbuild adds support in the future, the babel support for these can be disabled.
          "async-generator": false,
          "for-await": false
        }
      }
    };
  },
  async transform(code, id) {
    if (/\.[cm]?js$/.test(id)) {
      const angularPackage = /[\\/]node_modules[\\/]@angular[\\/]/.test(id);
      const linkerPluginCreator = (await loadEsmModule("@angular/compiler-cli/linker/babel")).createEs2015LinkerPlugin;
      const forceAsyncTransformation = !/[\\/][_f]?esm2015[\\/]/.test(id) && /for\s+await\s*\(|async\s+function\s*\*/.test(code);
      const shouldLink = await requiresLinking3(id, code);
      const result = await transformAsync(code, {
        filename: id,
        sourceMaps: false,
        compact: false,
        configFile: false,
        babelrc: false,
        browserslistConfigFile: false,
        plugins: [],
        presets: [
          [
            angularApplicationPreset,
            {
              angularLinker: {
                shouldLink,
                jitMode: false,
                linkerPluginCreator
              },
              forceAsyncTransformation,
              optimize: {
                looseEnums: angularPackage,
                pureTopLevel: angularPackage
              }
            }
          ]
        ]
      });
      return {
        code: (result == null ? void 0 : result.code) || "",
        map: result == null ? void 0 : result.map
      };
    }
    return;
  }
};

// apps/upd/vite-plugin/plugin/plugins/prod.plugin.ts
var ProductionPlugin = (options) => {
  const workspaceRoot2 = (options == null ? void 0 : options.workspaceRoot) || cwd3();
  const tsconfigPath = resolve2(cwd3(), "tsconfig.json");
  let rootNames = [];
  let compilerOptions = {};
  let host;
  let fileEmitter;
  async function buildAndAnalyze() {
    const angularProgram = new NgtscProgram(
      rootNames,
      compilerOptions,
      host
    );
    const angularCompiler = angularProgram.compiler;
    const typeScriptProgram = angularProgram.getTsProgram();
    const builder = ts.createAbstractBuilder(typeScriptProgram, host);
    await angularCompiler.analyzeAsync();
    const diagnostics = angularCompiler.getDiagnostics();
    const msg = ts.formatDiagnosticsWithColorAndContext(diagnostics, host);
    if (msg) {
      console.log(msg);
      process.exit(1);
    }
    fileEmitter = createFileEmitter(
      builder,
      mergeTransformers(angularCompiler.prepareEmit().transformers, {
        before: [replaceBootstrap(() => builder.getProgram().getTypeChecker())]
      }),
      () => []
    );
  }
  return [
    {
      name: "vite-plugin-angular-prod",
      enforce: "pre",
      apply(config, env) {
        const isBuild = env.command === "build";
        const isSsrBuild = env.ssrBuild;
        return isBuild && !isSsrBuild;
      },
      //TODO: fix this
      //@ts-ignore
      config(_userConfig, env) {
        const viteConfig = mergeDeep(_userConfig, {
          optimizeDeps: {
            esbuildOptions: {
              plugins: [
                createCompilerPlugin(
                  {
                    tsconfig: tsconfigPath,
                    sourcemap: false,
                    advancedOptimizations: true
                  },
                  {
                    workspaceRoot: workspaceRoot2,
                    outputNames: {
                      bundles: "[name]",
                      media: ""
                    },
                    sourcemap: false,
                    optimization: true,
                    target: ["es2020"],
                    inlineStyleLanguage: "scss"
                  }
                )
              ],
              define: {
                ngDevMode: "false",
                ngJitMode: "false",
                ngI18nClosureMode: "false"
              }
            }
          }
        });
        return viteConfig;
      },
      async buildStart(options2) {
        const { options: tsCompilerOptions, rootNames: rn } = readConfiguration(
          tsconfigPath,
          {
            enableIvy: true,
            compilationMode: "full",
            noEmitOnError: false,
            suppressOutputPathCheck: true,
            outDir: void 0,
            inlineSources: false,
            inlineSourceMap: false,
            sourceMap: false,
            mapRoot: void 0,
            sourceRoot: void 0,
            declaration: false,
            declarationMap: false,
            allowEmptyCodegenFiles: false,
            annotationsAs: "decorators",
            enableResourceInlining: false
          }
        );
        rootNames = rn;
        compilerOptions = tsCompilerOptions;
        host = ts.createIncrementalCompilerHost(compilerOptions);
        await buildAndAnalyze();
      },
      async transform(code, id) {
        if (id.includes("node_modules") || //TODO: why is this needed? vite-plugin-ssr throws an error if this is not here
        // debug and remove this if possible
        code.includes("@nitedani/vite-plugin-angular/client")) {
          return;
        }
        if (/\.[cm]?tsx?$/.test(id)) {
          const result = await fileEmitter(id);
          const data = (result == null ? void 0 : result.code) ?? "";
          const forceAsyncTransformation = /for\s+await\s*\(|async\s+function\s*\*/.test(data);
          const babelResult = await transformAsync2(data, {
            filename: id,
            sourceMaps: false,
            compact: false,
            configFile: false,
            babelrc: false,
            browserslistConfigFile: false,
            plugins: [],
            presets: [
              [
                angularApplicationPreset2,
                {
                  forceAsyncTransformation,
                  optimize: {}
                }
              ]
            ]
          });
          return {
            code: (babelResult == null ? void 0 : babelResult.code) ?? "",
            map: babelResult == null ? void 0 : babelResult.map
          };
        }
        return void 0;
      }
    },
    OptimizerPlugin
  ];
};
function createFileEmitter(program, transformers = {}, onAfterEmit) {
  return async (file) => {
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) {
      return void 0;
    }
    let code = "";
    program.emit(
      sourceFile,
      (filename, data) => {
        if (/\.[cm]?js$/.test(filename)) {
          if (data) {
            code = data;
          }
        }
      },
      void 0,
      void 0,
      transformers
    );
    onAfterEmit == null ? void 0 : onAfterEmit(sourceFile);
    return { code, dependencies: [] };
  };
}

// apps/upd/vite-plugin/plugin/index.ts
import { checker } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/vite-plugin-checker/dist/esm/main.js";
import defu from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/defu/dist/defu.mjs";
function angular(options) {
  const { typecheck } = defu(options, {
    typecheck: true
  });
  const plugins2 = [
    CommonPlugin,
    DirImporterPlugin,
    DevelopmentPlugin,
    ...ProductionPlugin(options)
  ];
  if (typecheck) {
    plugins2.push(checker({ typescript: { root: options == null ? void 0 : options.workspaceRoot, tsconfigPath: options == null ? void 0 : options.tsConfigPath } }));
  }
  return plugins2;
}

// apps/upd/vite.config.mts
import tsconfigPaths from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { visualizer } from "file:///C:/Users/MarcLegault/projects/upd-new/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "C:\\Users\\MarcLegault\\projects\\upd-new\\apps\\upd";
var workspaceRoot = resolve3(__vite_injected_original_dirname, "../..");
var projectRoot = resolve3(workspaceRoot, "apps/upd");
var vite_config_default = defineConfig(({ mode }) => {
  const prod = mode === "production";
  return {
    base: "/",
    root: projectRoot,
    mode,
    esbuild: {
      logLevel: "info",
      format: "esm",
      treeShaking: prod,
      platform: "browser",
      color: true
    },
    build: {
      sourcemap: prod ? "hidden" : "inline",
      outDir: resolve3(workspaceRoot, "dist/apps/upd"),
      assetsDir: "./",
      reportCompressedSize: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          dir: resolve3(workspaceRoot, "dist/apps/upd")
        },
        logLevel: "info",
        treeshake: prod,
        cache: true,
        plugins: !prod && [visualizer()],
        external: prod && [
          "core-js",
          "html2canvas",
          "canvg",
          "dompurify"
        ]
      },
      minify: prod,
      cssMinify: prod
    },
    optimizeDeps: {
      include: [
        "@angular/common",
        "@angular/common/http",
        "@angular/core/rxjs-interop",
        "dayjs",
        "zone.js"
      ]
    },
    server: {
      proxy: {
        "/api": `http://localhost:${process.env["PORT"] || 9e3}`
      }
    },
    logLevel: "info",
    json: {
      stringify: true
    },
    plugins: [
      tsconfigPaths({
        root: workspaceRoot
      }),
      angular({
        typecheck: true,
        workspaceRoot: projectRoot,
        tsConfigPath: "tsconfig.json"
      }),
      splitVendorChunkPlugin()
    ],
    preview: {
      proxy: {
        "/api": `http://localhost:${process.env["PORT"] || 9e3}`
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBwcy91cGQvdml0ZS5jb25maWcubXRzIiwgImFwcHMvdXBkL3ZpdGUtcGx1Z2luL3BsdWdpbi9ub2RlL2Rpci1pbXBvcnRlci50cyIsICJhcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vcGx1Z2lucy9jb25maWcudHMiLCAiYXBwcy91cGQvdml0ZS1wbHVnaW4vcGx1Z2luL3N3Yy90cmFuc2Zvcm0udHMiLCAiYXBwcy91cGQvdml0ZS1wbHVnaW4vcGx1Z2luL3N3Yy92aXNpdG9ycy9jb21waWxlci50cyIsICJhcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vc3djL3Zpc2l0b3JzL2NvbXBvbmVudHMudHMiLCAiYXBwcy91cGQvdml0ZS1wbHVnaW4vcGx1Z2luL3N3Yy92aXNpdG9ycy9pbmplY3Rvci50cyIsICJhcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vc3djL3Zpc2l0b3JzL3N3YXAtZHluYW1pYy1pbXBvcnQudHMiLCAiYXBwcy91cGQvdml0ZS1wbHVnaW4vcGx1Z2luL3BsdWdpbnMvZGV2LnBsdWdpbi50cyIsICJhcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vcGx1Z2lucy9wcm9kLnBsdWdpbi50cyIsICJhcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vdXRpbHMudHMiLCAiYXBwcy91cGQvdml0ZS1wbHVnaW4vcGx1Z2luL3BsdWdpbnMvb3B0aW1pemVyLnBsdWdpbi50cyIsICJhcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vcGx1Z2lucy91dGlscy50cyIsICJhcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTWFyY0xlZ2F1bHQvcHJvamVjdHMvdXBkLW5ldy9hcHBzL3VwZC92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgc3BsaXRWZW5kb3JDaHVua1BsdWdpbiwgdHlwZSBBbGlhc09wdGlvbnMgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHsgYW5ndWxhciB9IGZyb20gJy4vdml0ZS1wbHVnaW4vcGx1Z2luJztcclxuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XHJcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInO1xyXG5cclxuaW1wb3J0IHB1cmdlY3NzIGZyb20gJ0BmdWxsaHVtYW4vcG9zdGNzcy1wdXJnZWNzcyc7XHJcblxyXG5jb25zdCB3b3Jrc3BhY2VSb290ID0gcmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLicpO1xyXG5jb25zdCBwcm9qZWN0Um9vdCA9IHJlc29sdmUod29ya3NwYWNlUm9vdCwgJ2FwcHMvdXBkJyk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgY29uc3QgcHJvZCA9IG1vZGUgPT09ICdwcm9kdWN0aW9uJztcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6ICcvJyxcclxuICAgIHJvb3Q6IHByb2plY3RSb290LFxyXG4gICAgbW9kZSxcclxuICAgIGVzYnVpbGQ6IHtcclxuICAgICAgbG9nTGV2ZWw6ICdpbmZvJyxcclxuICAgICAgZm9ybWF0OiAnZXNtJyxcclxuICAgICAgdHJlZVNoYWtpbmc6IHByb2QsXHJcbiAgICAgIHBsYXRmb3JtOiAnYnJvd3NlcicsXHJcbiAgICAgIGNvbG9yOiB0cnVlLFxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIHNvdXJjZW1hcDogcHJvZCA/ICdoaWRkZW4nIDogJ2lubGluZScsXHJcbiAgICAgIG91dERpcjogcmVzb2x2ZSh3b3Jrc3BhY2VSb290LCAnZGlzdC9hcHBzL3VwZCcpLFxyXG4gICAgICBhc3NldHNEaXI6ICcuLycsXHJcbiAgICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxyXG4gICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIGRpcjogcmVzb2x2ZSh3b3Jrc3BhY2VSb290LCAnZGlzdC9hcHBzL3VwZCcpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbG9nTGV2ZWw6ICdpbmZvJyxcclxuICAgICAgICB0cmVlc2hha2U6IHByb2QsXHJcbiAgICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgICAgcGx1Z2luczogIXByb2QgJiYgW3Zpc3VhbGl6ZXIoKSBhcyBhbnldLFxyXG4gICAgICAgIGV4dGVybmFsOiBwcm9kICYmIFtcclxuICAgICAgICAgICdjb3JlLWpzJyxcclxuICAgICAgICAgICdodG1sMmNhbnZhcycsXHJcbiAgICAgICAgICAnY2FudmcnLFxyXG4gICAgICAgICAgJ2RvbXB1cmlmeScsXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgICAgbWluaWZ5OiBwcm9kLFxyXG4gICAgICBjc3NNaW5pZnk6IHByb2QsXHJcbiAgICB9LFxyXG4gICAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICAgIGluY2x1ZGU6IFtcclxuICAgICAgICAnQGFuZ3VsYXIvY29tbW9uJyxcclxuICAgICAgICAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnLFxyXG4gICAgICAgICdAYW5ndWxhci9jb3JlL3J4anMtaW50ZXJvcCcsXHJcbiAgICAgICAgJ2RheWpzJyxcclxuICAgICAgICAnem9uZS5qcycsXHJcbiAgICAgIF0sXHJcbiAgICB9LFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgJy9hcGknOiBgaHR0cDovL2xvY2FsaG9zdDoke3Byb2Nlc3MuZW52WydQT1JUJ10gfHwgOTAwMH1gLFxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgbG9nTGV2ZWw6ICdpbmZvJyxcclxuICAgIGpzb246IHtcclxuICAgICAgc3RyaW5naWZ5OiB0cnVlLFxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgdHNjb25maWdQYXRocyh7XHJcbiAgICAgICAgcm9vdDogd29ya3NwYWNlUm9vdCxcclxuICAgICAgfSksXHJcbiAgICAgIGFuZ3VsYXIoe1xyXG4gICAgICAgIHR5cGVjaGVjazogdHJ1ZSxcclxuICAgICAgICB3b3Jrc3BhY2VSb290OiBwcm9qZWN0Um9vdCxcclxuICAgICAgICB0c0NvbmZpZ1BhdGg6ICd0c2NvbmZpZy5qc29uJyxcclxuICAgICAgfSksXHJcbiAgICAgIHNwbGl0VmVuZG9yQ2h1bmtQbHVnaW4oKSxcclxuICAgIF0sXHJcbiAgICBwcmV2aWV3OiB7XHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgJy9hcGknOiBgaHR0cDovL2xvY2FsaG9zdDoke3Byb2Nlc3MuZW52WydQT1JUJ10gfHwgOTAwMH1gLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9O1xyXG59KTtcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxub2RlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxub2RlXFxcXGRpci1pbXBvcnRlci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTWFyY0xlZ2F1bHQvcHJvamVjdHMvdXBkLW5ldy9hcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vbm9kZS9kaXItaW1wb3J0ZXIudHNcIjtpbXBvcnQgeyBzdGF0IH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xyXG5pbXBvcnQgeyByZWxhdGl2ZSwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBjd2QgfSBmcm9tICdwcm9jZXNzJztcclxuaW1wb3J0IHsgbm9ybWFsaXplUGF0aCwgUGx1Z2luIH0gZnJvbSAndml0ZSc7XHJcblxyXG5leHBvcnQgY29uc3QgRGlySW1wb3J0ZXJQbHVnaW46IFBsdWdpbiA9IHtcclxuICBuYW1lOiAndml0ZS1wbHVnaW4tYW5ndWxhci9kaXItaW1wb3J0ZXInLFxyXG4gIGVuZm9yY2U6ICdwcmUnLFxyXG4gIGFzeW5jIHJlc29sdmVJZChzb3VyY2UsIGltcG9ydGVyLCBvcHRpb25zKSB7XHJcbiAgICBpZiAoIWltcG9ydGVyIHx8ICFvcHRpb25zLnNzcikge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBwYWNrYWdlTmFtZSA9IG5vcm1hbGl6ZVBhdGgocmVsYXRpdmUoY3dkKCksIHNvdXJjZSkpO1xyXG4gICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSByZXNvbHZlKGN3ZCgpLCAnbm9kZV9tb2R1bGVzJywgc291cmNlKTtcclxuICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBzdGF0KHJlbGF0aXZlUGF0aCk7XHJcbiAgICAgIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgICAgY29uc3QgbGFzdFBhdGhTZWdtZW50ID0gc291cmNlLnNwbGl0KCcvJykucG9wKCk7XHJcbiAgICAgICAgY29uc3QgY2FuZGlkYXRlcyA9IFtcclxuICAgICAgICAgICdpbmRleC5qcycsXHJcbiAgICAgICAgICAnaW5kZXgubWpzJyxcclxuICAgICAgICAgIGxhc3RQYXRoU2VnbWVudCArICcuanMnLFxyXG4gICAgICAgICAgbGFzdFBhdGhTZWdtZW50ICsgJy5tanMnLFxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgc3RhdChyZXNvbHZlKHJlbGF0aXZlUGF0aCwgY2FuZGlkYXRlKSk7XHJcbiAgICAgICAgICAgIGlmIChzdGF0cy5pc0ZpbGUoKSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc29sdmUoYCR7cGFja2FnZU5hbWV9LyR7Y2FuZGlkYXRlfWAsIGltcG9ydGVyLCB7XHJcbiAgICAgICAgICAgICAgICAuLi5vcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgc2tpcFNlbGY6IHRydWUsXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gY2F0Y2gge31cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2gge31cclxuICB9LFxyXG4gIGNvbmZpZyhjb25maWcsIGVudikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3NyOiB7XHJcbiAgICAgICAgbm9FeHRlcm5hbDogL2Fwb2xsby1hbmd1bGFyLyxcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfSxcclxufTtcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxwbHVnaW5zXFxcXGNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTWFyY0xlZ2F1bHQvcHJvamVjdHMvdXBkLW5ldy9hcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vcGx1Z2lucy9jb25maWcudHNcIjtpbXBvcnQgeyBleGlzdHNTeW5jLCBzdGF0U3luYyB9IGZyb20gJ2ZzJztcclxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBjd2QgfSBmcm9tICdwcm9jZXNzJztcclxuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAndml0ZSc7XHJcblxyXG4vLyBhIGhhY2sgdG8gc3VwcG9ydCB+IGFuZ3VsYXIgc2NzcyBpbXBvcnRzXHJcbmNvbnN0IGZpbmROb2RlTW9kdWxlcyA9ICgpID0+IHtcclxuICBjb25zdCBjYW5kaWRhdGVzID0gW1xyXG4gICAgam9pbihjd2QoKSwgJy4uJywgJy4uJywgJy4uJywgJ25vZGVfbW9kdWxlcycsICdAYW5ndWxhcicpLFxyXG4gICAgam9pbihjd2QoKSwgJy4uJywgJy4uJywgJ25vZGVfbW9kdWxlcycsICdAYW5ndWxhcicpLFxyXG4gICAgam9pbihjd2QoKSwgJy4uJywgJ25vZGVfbW9kdWxlcycsICdAYW5ndWxhcicpLFxyXG4gICAgam9pbihjd2QoKSwgJ25vZGVfbW9kdWxlcycsICdAYW5ndWxhcicpLFxyXG4gIF07XHJcbiAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xyXG4gICAgaWYgKGV4aXN0c1N5bmMoY2FuZGlkYXRlKSAmJiBzdGF0U3luYyhjYW5kaWRhdGUpLmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgcmV0dXJuIGNhbmRpZGF0ZS5yZXBsYWNlKCdAYW5ndWxhcicsICcnKTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5jb25zdCBub2RlTW9kdWxlc0RpciA9IGZpbmROb2RlTW9kdWxlcygpITtcclxuXHJcbmV4cG9ydCBjb25zdCBDb21tb25QbHVnaW46IFBsdWdpbiA9IHtcclxuICBuYW1lOiAndml0ZS1wbHVnaW4tYW5ndWxhci1jb21tb24nLFxyXG4gIGVuZm9yY2U6ICdwcmUnLFxyXG4gIGNvbmZpZyhjb25maWcsIGVudikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3NyOiB7XHJcbiAgICAgICAgZXh0ZXJuYWw6IFsncmVmbGVjdC1tZXRhZGF0YScsICd4aHIyJ10sXHJcbiAgICAgICAgbm9FeHRlcm5hbDogW1xyXG4gICAgICAgICAgL0BuaXRlZGFuaVxcL3ZpdGUtcGx1Z2luLWFuZ3VsYXIvLFxyXG4gICAgICAgICAgL0BuaXRlZGFuaVxcL3ZpdGUtcGx1Z2luLXNzci1hZGFwdGVyLyxcclxuICAgICAgICAgIC9Abml0ZWRhbmlcXC9hbmd1bGFyLXJlbmRlcmVyLWNvcmUvLFxyXG4gICAgICAgICAgL0BuaXRlZGFuaVxcL2FuZ3VsYXItcmVuZGVyZXItZXhwcmVzcy8sXHJcbiAgICAgICAgICAvQG5pdGVkYW5pXFwvYW5ndWxhci1yZW5kZXJlci1uZXN0anMvLFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0sXHJcbiAgICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgb3V0RGlyOiBlbnYuc3NyQnVpbGQgPyAnZGlzdC9zZXJ2ZXInIDogJ2Rpc3QvY2xpZW50JyxcclxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgICBleHRlcm5hbDogWyd4aHIyJ10sXHJcbiAgICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgICAgbWFudWFsQ2h1bmtzOiBpZCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgcnVudGltZTEgPSBbXHJcbiAgICAgICAgICAgICAgICAnQG5pdGVkYW5pL2FuZ3VsYXItcmVuZGVyZXItY29yZScsXHJcbiAgICAgICAgICAgICAgICAnQG5pdGVkYW5pL3ZpdGUtcGx1Z2luLWFuZ3VsYXIvY2xpZW50JyxcclxuICAgICAgICAgICAgICAgIC8vICdAYW5ndWxhcicsXHJcbiAgICAgICAgICAgICAgICAvLyAnem9uZS5qcycsXHJcbiAgICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgICBpZiAocnVudGltZTEuc29tZShzID0+IGlkLmluY2x1ZGVzKHMpKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICdydW50aW1lMSc7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgICBleGNsdWRlOiBbJ0Bhbmd1bGFyL2NvbXBpbGVyJ10sXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlc29sdmU6IHtcclxuICAgICAgICBhbGlhczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBmaW5kOiAvfi8sXHJcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICByZXBsYWNlbWVudDogbm9kZU1vZHVsZXNEaXIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gIH0sXHJcbn07XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTWFyY0xlZ2F1bHRcXFxccHJvamVjdHNcXFxcdXBkLW5ld1xcXFxhcHBzXFxcXHVwZFxcXFx2aXRlLXBsdWdpblxcXFxwbHVnaW5cXFxcc3djXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxzd2NcXFxcdHJhbnNmb3JtLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9NYXJjTGVnYXVsdC9wcm9qZWN0cy91cGQtbmV3L2FwcHMvdXBkL3ZpdGUtcGx1Z2luL3BsdWdpbi9zd2MvdHJhbnNmb3JtLnRzXCI7aW1wb3J0IHtcclxuICBKc01pbmlmeU9wdGlvbnMsXHJcbiAgbWluaWZ5LFxyXG4gIHBsdWdpbnMsXHJcbiAgUHJvZ3JhbSxcclxuICB0cmFuc2Zvcm0sXHJcbn0gZnJvbSAnQHN3Yy9jb3JlJztcclxuXHJcbmltcG9ydCB7XHJcbiAgQW5ndWxhckNvbXBvbmVudHMsXHJcbiAgQW5ndWxhckltcG9ydENvbXBpbGVyQ29tcG9uZW50cyxcclxuICBBbmd1bGFySW5qZWN0b3IsXHJcbiAgQW5ndWxhclN3YXBQbGF0Zm9ybUR5bmFtaWMsXHJcbn0gZnJvbSAnLi9pbmRleC5qcyc7XHJcbmNvbnN0IGZpbGVFeHRlbnNpb25SRSA9IC9cXC5bXi9cXHM/XSskLztcclxuXHJcbmV4cG9ydCBjb25zdCBzd2NUcmFuc2Zvcm0gPSBhc3luYyAoeyBjb2RlLCBpZCwgaXNTc3IsIGlzUHJvZHVjdGlvbiB9KSA9PiB7XHJcbiAgY29uc3QgbWluaWZ5T3B0aW9uczogSnNNaW5pZnlPcHRpb25zID0ge1xyXG4gICAgY29tcHJlc3M6ICFpc1NzciAmJiBpc1Byb2R1Y3Rpb24sXHJcbiAgICBtYW5nbGU6ICFpc1NzciAmJiBpc1Byb2R1Y3Rpb24sXHJcbiAgICBlY21hOiAnMjAyMCcsXHJcbiAgICBtb2R1bGU6IHRydWUsXHJcbiAgICBmb3JtYXQ6IHtcclxuICAgICAgY29tbWVudHM6IGZhbHNlLFxyXG4gICAgfSxcclxuICB9O1xyXG5cclxuICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XHJcbiAgICBpZiAoaXNQcm9kdWN0aW9uKSB7XHJcbiAgICAgIHJldHVybiBtaW5pZnkoY29kZSwgbWluaWZ5T3B0aW9ucyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBbZmlsZXBhdGgsIHF1ZXJ5c3RyaW5nID0gJyddID0gaWQuc3BsaXQoJz8nKTtcclxuICBjb25zdCBbZXh0ZW5zaW9uID0gJyddID1cclxuICAgIHF1ZXJ5c3RyaW5nLm1hdGNoKGZpbGVFeHRlbnNpb25SRSkgfHwgZmlsZXBhdGgubWF0Y2goZmlsZUV4dGVuc2lvblJFKSB8fCBbXTtcclxuXHJcbiAgaWYgKCEvXFwuKGpzfHRzfHRzeHxqc3g/KSQvLnRlc3QoZXh0ZW5zaW9uKSkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHRyYW5zZm9ybShjb2RlLCB7XHJcbiAgICBzb3VyY2VNYXBzOiAhaXNQcm9kdWN0aW9uLFxyXG4gICAganNjOiB7XHJcbiAgICAgIHRhcmdldDogJ2VzMjAyMCcsXHJcbiAgICAgIHBhcnNlcjoge1xyXG4gICAgICAgIHN5bnRheDogJ3R5cGVzY3JpcHQnLFxyXG4gICAgICAgIHRzeDogZmFsc2UsXHJcbiAgICAgICAgZGVjb3JhdG9yczogdHJ1ZSxcclxuICAgICAgICBkeW5hbWljSW1wb3J0OiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICB0cmFuc2Zvcm06IHtcclxuICAgICAgICBkZWNvcmF0b3JNZXRhZGF0YTogdHJ1ZSxcclxuICAgICAgICBsZWdhY3lEZWNvcmF0b3I6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIG1pbmlmeTogbWluaWZ5T3B0aW9ucyxcclxuICAgIH0sXHJcbiAgICBtaW5pZnk6ICFpc1NzciAmJiBpc1Byb2R1Y3Rpb24sXHJcbiAgICBwbHVnaW46IHBsdWdpbnMoW1xyXG4gICAgICAobTogUHJvZ3JhbSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGFuZ3VsYXJDb21wb25lbnRQbHVnaW4gPSBuZXcgQW5ndWxhckNvbXBvbmVudHMoe1xyXG4gICAgICAgICAgc291cmNlVXJsOiBpZCxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gYW5ndWxhckNvbXBvbmVudFBsdWdpbi52aXNpdFByb2dyYW0obSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIChtOiBQcm9ncmFtKSA9PiB7XHJcbiAgICAgICAgY29uc3QgYW5ndWxhckluamVjdG9yUGx1Z2luID0gbmV3IEFuZ3VsYXJJbmplY3RvcigpO1xyXG4gICAgICAgIHJldHVybiBhbmd1bGFySW5qZWN0b3JQbHVnaW4udmlzaXRQcm9ncmFtKG0pO1xyXG4gICAgICB9LFxyXG4gICAgICAvLyAobTogUHJvZ3JhbSkgPT4ge1xyXG4gICAgICAvLyAgIHJldHVybiBuZXcgQW5ndWxhckltcG9ydENvbXBpbGVyQ29tcG9uZW50cygpLnZpc2l0UHJvZ3JhbShtKTtcclxuICAgICAgLy8gfSxcclxuICAgICAgLy8gLi4uKGlzUHJvZHVjdGlvblxyXG4gICAgICAvLyAgID8gW1xyXG4gICAgICAvLyAgICAgICAobTogUHJvZ3JhbSkgPT5cclxuICAgICAgLy8gICAgICAgICBuZXcgQW5ndWxhclN3YXBQbGF0Zm9ybUR5bmFtaWMoKS52aXNpdFByb2dyYW0obSksXHJcbiAgICAgIC8vICAgICBdXHJcbiAgICAgIC8vICAgOiBbXSksXHJcbiAgICBdKSxcclxuICB9KTtcclxufTtcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxzd2NcXFxcdmlzaXRvcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE1hcmNMZWdhdWx0XFxcXHByb2plY3RzXFxcXHVwZC1uZXdcXFxcYXBwc1xcXFx1cGRcXFxcdml0ZS1wbHVnaW5cXFxccGx1Z2luXFxcXHN3Y1xcXFx2aXNpdG9yc1xcXFxjb21waWxlci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTWFyY0xlZ2F1bHQvcHJvamVjdHMvdXBkLW5ldy9hcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vc3djL3Zpc2l0b3JzL2NvbXBpbGVyLnRzXCI7aW1wb3J0IHsgTW9kdWxlSXRlbSB9IGZyb20gJ0Bzd2MvY29yZSc7XHJcbmltcG9ydCB7IFZpc2l0b3IgfSBmcm9tICdAc3djL2NvcmUvVmlzaXRvci5qcyc7XHJcbmltcG9ydCB7XHJcbiAgY3JlYXRlU3BhbixcclxuICBjcmVhdGVTdHJpbmdMaXRlcmFsLFxyXG4gIGlzSW1wb3J0RGVjbGFyYXRpb24sXHJcbn0gZnJvbSAnc3djLWFzdC1oZWxwZXJzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBBbmd1bGFySW1wb3J0Q29tcGlsZXJDb21wb25lbnRzIGV4dGVuZHMgVmlzaXRvciB7XHJcbiAgb3ZlcnJpZGUgdmlzaXRNb2R1bGVJdGVtcyhpdGVtczogTW9kdWxlSXRlbVtdKTogTW9kdWxlSXRlbVtdIHtcclxuICAgIHJldHVybiBpdGVtcy5mbGF0TWFwKGl0ZW0gPT4ge1xyXG4gICAgICBpZiAoaXNJbXBvcnREZWNsYXJhdGlvbihpdGVtKSkge1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgIGl0ZW0uc3BlY2lmaWVycy5zb21lKGltcCA9PlxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgJ3JlbmRlclBhZ2UnLFxyXG4gICAgICAgICAgICAgICdwbGF0Zm9ybUJyb3dzZXJEeW5hbWljJyxcclxuICAgICAgICAgICAgICAncGxhdGZvcm1Ccm93c2VyJyxcclxuICAgICAgICAgICAgICAnYm9vdHN0cmFwQXBwbGljYXRpb24nLFxyXG4gICAgICAgICAgICBdLmluY2x1ZGVzKGltcC5sb2NhbC52YWx1ZSlcclxuICAgICAgICAgIClcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB0eXBlOiAnSW1wb3J0RGVjbGFyYXRpb24nLFxyXG4gICAgICAgICAgICAgIHNwYW46IGNyZWF0ZVNwYW4oKSxcclxuICAgICAgICAgICAgICB0eXBlT25seTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgc3BlY2lmaWVyczogW10sXHJcbiAgICAgICAgICAgICAgc291cmNlOiBjcmVhdGVTdHJpbmdMaXRlcmFsKCdAYW5ndWxhci9jb21waWxlcicpLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpdGVtLFxyXG4gICAgICAgICAgXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxzd2NcXFxcdmlzaXRvcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE1hcmNMZWdhdWx0XFxcXHByb2plY3RzXFxcXHVwZC1uZXdcXFxcYXBwc1xcXFx1cGRcXFxcdml0ZS1wbHVnaW5cXFxccGx1Z2luXFxcXHN3Y1xcXFx2aXNpdG9yc1xcXFxjb21wb25lbnRzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9NYXJjTGVnYXVsdC9wcm9qZWN0cy91cGQtbmV3L2FwcHMvdXBkL3ZpdGUtcGx1Z2luL3BsdWdpbi9zd2MvdmlzaXRvcnMvY29tcG9uZW50cy50c1wiO2ltcG9ydCB7XHJcbiAgQXJyYXlFeHByZXNzaW9uLFxyXG4gIENhbGxFeHByZXNzaW9uLFxyXG4gIERlY29yYXRvcixcclxuICBJZGVudGlmaWVyLFxyXG4gIEtleVZhbHVlUHJvcGVydHksXHJcbiAgTW9kdWxlSXRlbSxcclxuICBPYmplY3RFeHByZXNzaW9uLFxyXG4gIFN0cmluZ0xpdGVyYWwsXHJcbiAgVHNUeXBlLFxyXG59IGZyb20gJ0Bzd2MvY29yZSc7XHJcbmltcG9ydCB7IFZpc2l0b3IgfSBmcm9tICdAc3djL2NvcmUvVmlzaXRvci5qcyc7XHJcbmltcG9ydCB7IGRpcm5hbWUsIGV4dG5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcclxuaW1wb3J0IHtcclxuICBjcmVhdGVBcnJheUV4cHJlc3Npb24sXHJcbiAgY3JlYXRlRXhwcmVzc2lvblN0YXRlbWVudCxcclxuICBjcmVhdGVJZGVudGlmZXIsXHJcbiAgY3JlYXRlSW1wb3J0RGVmYXVsdFNwZWNpZmllcixcclxuICBjcmVhdGVLZXlWYWx1ZVByb3BlcnR5LFxyXG4gIGNyZWF0ZVNwYW4sXHJcbiAgY3JlYXRlU3RyaW5nTGl0ZXJhbCxcclxufSBmcm9tICdzd2MtYXN0LWhlbHBlcnMnO1xyXG5cclxuY29uc3QgcmFuZG9tSWRlbnRpZmllciA9ICgpID0+XHJcbiAgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDE1KS5yZXBsYWNlKC9cXGQvZywgJycpO1xyXG5cclxuY29uc3QgaXNDb21wb25lbnREZWNvcmF0b3IgPSAoZGVjb3JhdG9yOiBEZWNvcmF0b3IpID0+XHJcbiAgZGVjb3JhdG9yLmV4cHJlc3Npb24udHlwZSA9PT0gJ0NhbGxFeHByZXNzaW9uJyAmJlxyXG4gIChkZWNvcmF0b3IuZXhwcmVzc2lvbj8uY2FsbGVlIGFzIElkZW50aWZpZXIpLnZhbHVlID09PSAnQ29tcG9uZW50JztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQW5ndWxhckNvbXBvbmVudE9wdGlvbnMge1xyXG4gIHNvdXJjZVVybDogc3RyaW5nO1xyXG59XHJcbmV4cG9ydCBjbGFzcyBBbmd1bGFyQ29tcG9uZW50cyBleHRlbmRzIFZpc2l0b3Ige1xyXG4gIGltcG9ydEZpbGVzOiB7XHJcbiAgICB1cmw6IHN0cmluZztcclxuICAgIGlkZW50aWZpZXI6IHN0cmluZztcclxuICB9W10gPSBbXTtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBvcHRpb25zOiBBbmd1bGFyQ29tcG9uZW50T3B0aW9ucykge1xyXG4gICAgc3VwZXIoKTtcclxuICB9XHJcbiAgb3ZlcnJpZGUgdmlzaXRUc1R5cGVzKG5vZGVzOiBUc1R5cGVbXSk6IFRzVHlwZVtdIHtcclxuICAgIHJldHVybiBub2RlcztcclxuICB9XHJcbiAgb3ZlcnJpZGUgdmlzaXRUc1R5cGUobm9kZXM6IFRzVHlwZSk6IFRzVHlwZSB7XHJcbiAgICByZXR1cm4gbm9kZXM7XHJcbiAgfVxyXG4gIG92ZXJyaWRlIHZpc2l0TW9kdWxlSXRlbXMoaXRlbXM6IE1vZHVsZUl0ZW1bXSk6IE1vZHVsZUl0ZW1bXSB7XHJcbiAgICBjb25zdCBmaWxlcyA9IFsuLi5pdGVtcy5mbGF0TWFwKGl0ZW0gPT4gdGhpcy52aXNpdE1vZHVsZUl0ZW0oaXRlbSkpXTtcclxuICAgIGlmICh0aGlzLmltcG9ydEZpbGVzLmxlbmd0aCkge1xyXG4gICAgICBmb3IgKGNvbnN0IHsgdXJsLCBpZGVudGlmaWVyIH0gb2YgdGhpcy5pbXBvcnRGaWxlcykge1xyXG4gICAgICAgIGZpbGVzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgdHlwZTogJ0ltcG9ydERlY2xhcmF0aW9uJyxcclxuICAgICAgICAgIHNwYW46IGNyZWF0ZVNwYW4oKSxcclxuICAgICAgICAgIHR5cGVPbmx5OiBmYWxzZSxcclxuICAgICAgICAgIHNwZWNpZmllcnM6IFtjcmVhdGVJbXBvcnREZWZhdWx0U3BlY2lmaWVyKGlkZW50aWZpZXIpXSxcclxuICAgICAgICAgIHNvdXJjZTogY3JlYXRlU3RyaW5nTGl0ZXJhbCh1cmwpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmlsZXM7XHJcbiAgfVxyXG5cclxuICBvdmVycmlkZSB2aXNpdERlY29yYXRvcihkZWNvcmF0b3I6IERlY29yYXRvcikge1xyXG4gICAgaWYgKCFpc0NvbXBvbmVudERlY29yYXRvcihkZWNvcmF0b3IpKSByZXR1cm4gZGVjb3JhdG9yO1xyXG5cclxuICAgIGNvbnN0IGNvbXBvbmVudE9wdGlvbnMgPSAoZGVjb3JhdG9yLmV4cHJlc3Npb24gYXMgQ2FsbEV4cHJlc3Npb24pXHJcbiAgICAgIC5hcmd1bWVudHNbMF0uZXhwcmVzc2lvbiBhcyBPYmplY3RFeHByZXNzaW9uO1xyXG5cclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgZGVjb3JhdG9yLmV4cHJlc3Npb24uYXJndW1lbnRzID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgZXhwcmVzc2lvbjoge1xyXG4gICAgICAgICAgLi4uY29tcG9uZW50T3B0aW9ucyxcclxuICAgICAgICAgIHByb3BlcnRpZXM6IGNvbXBvbmVudE9wdGlvbnMucHJvcGVydGllcy5tYXAocHJvcCA9PiB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoKChwcm9wIGFzIEtleVZhbHVlUHJvcGVydHkpLmtleSBhcyBJZGVudGlmaWVyKS52YWx1ZSkge1xyXG4gICAgICAgICAgICAgIGNhc2UgJ3N0eWxlVXJscyc6IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybVN0eWxlVXJscyhwcm9wKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGNhc2UgJ3RlbXBsYXRlVXJsJzoge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtVGVtcGxhdGVVcmwocHJvcCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3A7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICBdO1xyXG5cclxuICAgIHJldHVybiBkZWNvcmF0b3I7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHRyYW5zZm9ybVRlbXBsYXRlVXJsKHByb3ApIHtcclxuICAgIGNvbnN0IHRlbXBsYXRlVXJsID0gKChwcm9wIGFzIEtleVZhbHVlUHJvcGVydHkpLnZhbHVlIGFzIElkZW50aWZpZXIpLnZhbHVlO1xyXG4gICAgY29uc3QgYWN0dWFsSW1wb3J0UGF0aCA9IGpvaW4oZGlybmFtZSh0aGlzLm9wdGlvbnMuc291cmNlVXJsKSwgdGVtcGxhdGVVcmwpO1xyXG5cclxuICAgIGlmIChleHRuYW1lKGFjdHVhbEltcG9ydFBhdGgpICE9PSAnLmh0bWwnKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBgSFRNTCB0eXBlICR7ZXh0bmFtZShhY3R1YWxJbXBvcnRQYXRoKX0gaXMgbm90IHN1cHBvcnRlZC5gXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBpZGVudGlmaWVyID0gcmFuZG9tSWRlbnRpZmllcigpO1xyXG4gICAgdGhpcy5pbXBvcnRGaWxlcy5wdXNoKHtcclxuICAgICAgaWRlbnRpZmllcixcclxuICAgICAgdXJsOiB0ZW1wbGF0ZVVybCArICc/cmF3JyxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGNyZWF0ZUtleVZhbHVlUHJvcGVydHkoXHJcbiAgICAgIGNyZWF0ZUlkZW50aWZlcigndGVtcGxhdGUnKSxcclxuICAgICAgY3JlYXRlSWRlbnRpZmVyKGlkZW50aWZpZXIpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1TdHlsZVVybHMocHJvcCkge1xyXG4gICAgY29uc3Qgc3R5bGVVcmxzID0gKHByb3AgYXMgS2V5VmFsdWVQcm9wZXJ0eSkudmFsdWUgYXMgQXJyYXlFeHByZXNzaW9uO1xyXG5cclxuICAgIGNvbnN0IHN0eWxlcyA9IHN0eWxlVXJscy5lbGVtZW50cy5tYXAoZSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0eWxlVXJsID0gKGUhLmV4cHJlc3Npb24gYXMgU3RyaW5nTGl0ZXJhbCkudmFsdWU7XHJcbiAgICAgIGNvbnN0IGlkZW50aWZpZXIgPSByYW5kb21JZGVudGlmaWVyKCk7XHJcbiAgICAgIHRoaXMuaW1wb3J0RmlsZXMucHVzaCh7XHJcbiAgICAgICAgdXJsOiBzdHlsZVVybCArICc/aW5saW5lJyxcclxuICAgICAgICBpZGVudGlmaWVyLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGlkZW50aWZpZXI7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5wcm9wLFxyXG4gICAgICBrZXk6IGNyZWF0ZUlkZW50aWZlcignc3R5bGVzJyksXHJcbiAgICAgIHZhbHVlOiBjcmVhdGVBcnJheUV4cHJlc3Npb24oXHJcbiAgICAgICAgc3R5bGVzLm1hcChjID0+IGNyZWF0ZUV4cHJlc3Npb25TdGF0ZW1lbnQoY3JlYXRlSWRlbnRpZmVyKGMpKSlcclxuICAgICAgKSxcclxuICAgIH07XHJcbiAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTWFyY0xlZ2F1bHRcXFxccHJvamVjdHNcXFxcdXBkLW5ld1xcXFxhcHBzXFxcXHVwZFxcXFx2aXRlLXBsdWdpblxcXFxwbHVnaW5cXFxcc3djXFxcXHZpc2l0b3JzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxzd2NcXFxcdmlzaXRvcnNcXFxcaW5qZWN0b3IudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL01hcmNMZWdhdWx0L3Byb2plY3RzL3VwZC1uZXcvYXBwcy91cGQvdml0ZS1wbHVnaW4vcGx1Z2luL3N3Yy92aXNpdG9ycy9pbmplY3Rvci50c1wiO2ltcG9ydCB7XHJcbiAgQXJndW1lbnQsXHJcbiAgQ2FsbEV4cHJlc3Npb24sXHJcbiAgQ2xhc3NEZWNsYXJhdGlvbixcclxuICBJZGVudGlmaWVyLFxyXG4gIE1lbWJlckV4cHJlc3Npb24sXHJcbiAgTW9kdWxlSXRlbSxcclxuICBOYW1lZEltcG9ydFNwZWNpZmllcixcclxuICBUc1BhcmFtZXRlclByb3BlcnR5LFxyXG4gIFRzVHlwZSxcclxufSBmcm9tICdAc3djL2NvcmUnO1xyXG5pbXBvcnQgeyBWaXNpdG9yIH0gZnJvbSAnQHN3Yy9jb3JlL1Zpc2l0b3IuanMnO1xyXG5pbXBvcnQge1xyXG4gIGNyZWF0ZUlkZW50aWZlcixcclxuICBjcmVhdGVJbXBvcnRTcGVjaWZpZXIsXHJcbiAgY3JlYXRlU3BhbixcclxuICBpc0NhbGxFeHByZXNzaW9uLFxyXG4gIGlzSWRlbnRpZmVyLFxyXG4gIGlzSW1wb3J0RGVjbGFyYXRpb24sXHJcbiAgaXNUc1R5cGVBbm5vdGF0aW9uLFxyXG4gIGlzVHNUeXBlUmVmZXJlbmNlLFxyXG59IGZyb20gJ3N3Yy1hc3QtaGVscGVycyc7XHJcblxyXG5jb25zdCBoYXNJbmplY3REZWNvcmF0b3IgPSBub2RlID0+XHJcbiAgbm9kZS5kZWNvcmF0b3JzPy5sZW5ndGggJiZcclxuICBub2RlLmRlY29yYXRvcnMuc29tZShcclxuICAgIGRlYyA9PlxyXG4gICAgICBpc0NhbGxFeHByZXNzaW9uKGRlYy5leHByZXNzaW9uKSAmJlxyXG4gICAgICBpc0lkZW50aWZlcihkZWMuZXhwcmVzc2lvbi5jYWxsZWUpICYmXHJcbiAgICAgIGRlYy5leHByZXNzaW9uLmNhbGxlZS52YWx1ZSA9PT0gJ0luamVjdCcsXHJcbiAgKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUNhbGxFeHByZXNzaW9uKFxyXG4gIGNhbGxlZTogTWVtYmVyRXhwcmVzc2lvbiB8IElkZW50aWZpZXIsXHJcbiAgYXJnczogQXJndW1lbnRbXSA9IFtdLFxyXG4pIHtcclxuICBjb25zdCBvYmplY3Q6IENhbGxFeHByZXNzaW9uID0ge1xyXG4gICAgdHlwZTogJ0NhbGxFeHByZXNzaW9uJyxcclxuICAgIHNwYW46IGNyZWF0ZVNwYW4oKSxcclxuICAgIGNhbGxlZSxcclxuICAgIGFyZ3VtZW50czogYXJncyxcclxuICB9O1xyXG4gIHJldHVybiBvYmplY3Q7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBbmd1bGFySW5qZWN0b3IgZXh0ZW5kcyBWaXNpdG9yIHtcclxuICBwcml2YXRlIGhhc0luamVjdG9ySW1wb3J0ID0gZmFsc2U7XHJcbiAgcHJpdmF0ZSBoYXNJbmplY3RlZENvbnN0cnVjdG9yID0gZmFsc2U7XHJcbiAgcHJpdmF0ZSBpc0FuZ3VsYXJDbGFzcyA9IGZhbHNlO1xyXG5cclxuICBvdmVycmlkZSB2aXNpdENsYXNzRGVjbGFyYXRpb24oZGVjbDogQ2xhc3NEZWNsYXJhdGlvbikge1xyXG4gICAgdGhpcy5pc0FuZ3VsYXJDbGFzcyA9ICEhZGVjbC5kZWNvcmF0b3JzPy5zb21lKFxyXG4gICAgICBkZWMgPT5cclxuICAgICAgICBpc0NhbGxFeHByZXNzaW9uKGRlYy5leHByZXNzaW9uKSAmJlxyXG4gICAgICAgIGlzSWRlbnRpZmVyKGRlYy5leHByZXNzaW9uLmNhbGxlZSkgJiZcclxuICAgICAgICBbJ05nTW9kdWxlJywgJ0NvbXBvbmVudCcsICdJbmplY3RhYmxlJywgJ0RpcmVjdGl2ZSddLmluY2x1ZGVzKFxyXG4gICAgICAgICAgZGVjLmV4cHJlc3Npb24uY2FsbGVlLnZhbHVlLFxyXG4gICAgICAgICksXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiBzdXBlci52aXNpdENsYXNzRGVjbGFyYXRpb24oZGVjbCk7XHJcbiAgfVxyXG5cclxuICBvdmVycmlkZSB2aXNpdE1vZHVsZUl0ZW1zKGl0ZW1zOiBNb2R1bGVJdGVtW10pOiBNb2R1bGVJdGVtW10ge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gaXRlbXMuZmxhdE1hcChpdGVtID0+IHRoaXMudmlzaXRNb2R1bGVJdGVtKGl0ZW0pKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuaGFzSW5qZWN0b3JJbXBvcnQgJiYgdGhpcy5oYXNJbmplY3RlZENvbnN0cnVjdG9yKSB7XHJcbiAgICAgIHJldHVybiByZXN1bHQubWFwKHJlcyA9PiB7XHJcbiAgICAgICAgaWYgKGlzSW1wb3J0RGVjbGFyYXRpb24ocmVzKSkge1xyXG4gICAgICAgICAgaWYgKCF0aGlzLmhhc0luamVjdG9ySW1wb3J0ICYmIHJlcy5zb3VyY2UudmFsdWUgPT09ICdAYW5ndWxhci9jb3JlJykge1xyXG4gICAgICAgICAgICByZXMuc3BlY2lmaWVycy5wdXNoKGNyZWF0ZUltcG9ydFNwZWNpZmllcignSW5qZWN0JykpO1xyXG4gICAgICAgICAgICB0aGlzLmhhc0luamVjdG9ySW1wb3J0ID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgb3ZlcnJpZGUgdmlzaXRDb25zdHJ1Y3RvclBhcmFtZXRlcihcclxuICAgIG5vZGU6IFRzUGFyYW1ldGVyUHJvcGVydHksXHJcbiAgKTogVHNQYXJhbWV0ZXJQcm9wZXJ0eSB7XHJcbiAgICBpZiAoaGFzSW5qZWN0RGVjb3JhdG9yKG5vZGUpIHx8ICFub2RlLnBhcmFtIHx8ICFub2RlLnBhcmFtLnR5cGVBbm5vdGF0aW9uKSB7XHJcbiAgICAgIHJldHVybiBub2RlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIHRoaXMuaXNBbmd1bGFyQ2xhc3MgJiZcclxuICAgICAgICBpc1RzVHlwZUFubm90YXRpb24obm9kZS5wYXJhbS50eXBlQW5ub3RhdGlvbikgJiZcclxuICAgICAgICBpc1RzVHlwZVJlZmVyZW5jZShub2RlLnBhcmFtLnR5cGVBbm5vdGF0aW9uLnR5cGVBbm5vdGF0aW9uKSAmJlxyXG4gICAgICAgIGlzSWRlbnRpZmVyKG5vZGUucGFyYW0udHlwZUFubm90YXRpb24udHlwZUFubm90YXRpb24udHlwZU5hbWUpXHJcbiAgICAgICkge1xyXG4gICAgICAgIG5vZGUuZGVjb3JhdG9ycyA9IG5vZGUuZGVjb3JhdG9ycyA/PyBbXTtcclxuICAgICAgICBub2RlLmRlY29yYXRvcnMucHVzaCh7XHJcbiAgICAgICAgICB0eXBlOiAnRGVjb3JhdG9yJyxcclxuICAgICAgICAgIHNwYW46IGNyZWF0ZVNwYW4oKSxcclxuICAgICAgICAgIGV4cHJlc3Npb246IGNyZWF0ZUNhbGxFeHByZXNzaW9uKGNyZWF0ZUlkZW50aWZlcignSW5qZWN0JyksIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGV4cHJlc3Npb246IGNyZWF0ZUlkZW50aWZlcihcclxuICAgICAgICAgICAgICAgIG5vZGUucGFyYW0udHlwZUFubm90YXRpb24udHlwZUFubm90YXRpb24udHlwZU5hbWUudmFsdWUsXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0pLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuaGFzSW5qZWN0ZWRDb25zdHJ1Y3RvciA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIG92ZXJyaWRlIHZpc2l0TmFtZWRJbXBvcnRTcGVjaWZpZXIoXHJcbiAgICBub2RlOiBOYW1lZEltcG9ydFNwZWNpZmllcixcclxuICApOiBOYW1lZEltcG9ydFNwZWNpZmllciB7XHJcbiAgICBpZiAoIXRoaXMuaGFzSW5qZWN0b3JJbXBvcnQgJiYgbm9kZS5sb2NhbC52YWx1ZSA9PT0gJ0luamVjdCcpIHtcclxuICAgICAgdGhpcy5oYXNJbmplY3RvckltcG9ydCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbm9kZTtcclxuICB9XHJcblxyXG4gIG92ZXJyaWRlIHZpc2l0VHNUeXBlcyhub2RlczogVHNUeXBlW10pOiBUc1R5cGVbXSB7XHJcbiAgICByZXR1cm4gbm9kZXM7XHJcbiAgfVxyXG5cclxuICBvdmVycmlkZSB2aXNpdFRzVHlwZShub2RlczogVHNUeXBlKTogVHNUeXBlIHtcclxuICAgIHJldHVybiBub2RlcztcclxuICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxzd2NcXFxcdmlzaXRvcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE1hcmNMZWdhdWx0XFxcXHByb2plY3RzXFxcXHVwZC1uZXdcXFxcYXBwc1xcXFx1cGRcXFxcdml0ZS1wbHVnaW5cXFxccGx1Z2luXFxcXHN3Y1xcXFx2aXNpdG9yc1xcXFxzd2FwLWR5bmFtaWMtaW1wb3J0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9NYXJjTGVnYXVsdC9wcm9qZWN0cy91cGQtbmV3L2FwcHMvdXBkL3ZpdGUtcGx1Z2luL3BsdWdpbi9zd2MvdmlzaXRvcnMvc3dhcC1keW5hbWljLWltcG9ydC50c1wiO2ltcG9ydCB7IE1vZHVsZUl0ZW0gfSBmcm9tICdAc3djL2NvcmUnO1xyXG5pbXBvcnQgeyBWaXNpdG9yIH0gZnJvbSAnQHN3Yy9jb3JlL1Zpc2l0b3IuanMnO1xyXG5pbXBvcnQge1xyXG4gIGNyZWF0ZUltcG9ydFNwZWNpZmllcixcclxuICBjcmVhdGVTdHJpbmdMaXRlcmFsLFxyXG4gIGlzQ2FsbEV4cHJlc3Npb24sXHJcbiAgaXNJbXBvcnREZWNsYXJhdGlvbixcclxuICB1cGRhdGVJbXBvcnREZWNsYXJhdGlvbixcclxuICBpc0V4cHJlc3Npb25TdGF0ZW1lbnQsXHJcbiAgaXNNZW1iZXJFeHByZXNzaW9uLFxyXG4gIGlzSWRlbnRpZmVyLFxyXG4gIGNyZWF0ZUlkZW50aWZlcixcclxufSBmcm9tICdzd2MtYXN0LWhlbHBlcnMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFuZ3VsYXJTd2FwUGxhdGZvcm1EeW5hbWljIGV4dGVuZHMgVmlzaXRvciB7XHJcbiAgb3ZlcnJpZGUgdmlzaXRNb2R1bGVJdGVtcyhpdGVtczogTW9kdWxlSXRlbVtdKTogTW9kdWxlSXRlbVtdIHtcclxuICAgIGxldCBoYXNDaGFuZ2VkUGxhdGZvcm1Ccm93c2VyRHluYW1pYyA9IGZhbHNlO1xyXG4gICAgcmV0dXJuIGl0ZW1zLmZsYXRNYXAoaXRlbSA9PiB7XHJcbiAgICAgIGlmIChpc0ltcG9ydERlY2xhcmF0aW9uKGl0ZW0pKSB7XHJcbiAgICAgICAgaWYgKGl0ZW0uc291cmNlLnZhbHVlID09PSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljJykge1xyXG4gICAgICAgICAgaGFzQ2hhbmdlZFBsYXRmb3JtQnJvd3NlckR5bmFtaWMgPSB0cnVlO1xyXG4gICAgICAgICAgaXRlbS5zcGVjaWZpZXJzID0gaXRlbS5zcGVjaWZpZXJzLmZpbHRlcihcclxuICAgICAgICAgICAgcyA9PiBzLmxvY2FsLnZhbHVlICE9PSAncGxhdGZvcm1Ccm93c2VyRHluYW1pYydcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBjb25zdCB1cGRhdGVkSW1wb3J0ID0gdXBkYXRlSW1wb3J0RGVjbGFyYXRpb24oXHJcbiAgICAgICAgICAgIGl0ZW0sXHJcbiAgICAgICAgICAgIGNyZWF0ZVN0cmluZ0xpdGVyYWwoJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXInKSxcclxuICAgICAgICAgICAgW2NyZWF0ZUltcG9ydFNwZWNpZmllcigncGxhdGZvcm1Ccm93c2VyJyldXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcmV0dXJuIHVwZGF0ZWRJbXBvcnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChoYXNDaGFuZ2VkUGxhdGZvcm1Ccm93c2VyRHluYW1pYyAmJiBpc0V4cHJlc3Npb25TdGF0ZW1lbnQoaXRlbSkpIHtcclxuICAgICAgICBpZiAoaXNDYWxsRXhwcmVzc2lvbihpdGVtLmV4cHJlc3Npb24pKSB7XHJcbiAgICAgICAgICBpZiAoaXNNZW1iZXJFeHByZXNzaW9uKGl0ZW0uZXhwcmVzc2lvbi5jYWxsZWUpKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0NhbGxFeHByZXNzaW9uKGl0ZW0uZXhwcmVzc2lvbi5jYWxsZWUub2JqZWN0KSkge1xyXG4gICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIGlzTWVtYmVyRXhwcmVzc2lvbihpdGVtLmV4cHJlc3Npb24uY2FsbGVlLm9iamVjdC5jYWxsZWUpICYmXHJcbiAgICAgICAgICAgICAgICBpc0NhbGxFeHByZXNzaW9uKGl0ZW0uZXhwcmVzc2lvbi5jYWxsZWUub2JqZWN0LmNhbGxlZS5vYmplY3QpICYmXHJcbiAgICAgICAgICAgICAgICBpc0lkZW50aWZlcihcclxuICAgICAgICAgICAgICAgICAgaXRlbS5leHByZXNzaW9uLmNhbGxlZS5vYmplY3QuY2FsbGVlLm9iamVjdC5jYWxsZWVcclxuICAgICAgICAgICAgICAgICkgJiZcclxuICAgICAgICAgICAgICAgIGl0ZW0uZXhwcmVzc2lvbi5jYWxsZWUub2JqZWN0LmNhbGxlZS5vYmplY3QuY2FsbGVlLnZhbHVlID09PVxyXG4gICAgICAgICAgICAgICAgICAncGxhdGZvcm1Ccm93c2VyRHluYW1pYydcclxuICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0uZXhwcmVzc2lvbi5jYWxsZWUub2JqZWN0LmNhbGxlZS5vYmplY3QuY2FsbGVlID1cclxuICAgICAgICAgICAgICAgICAgY3JlYXRlSWRlbnRpZmVyKCdwbGF0Zm9ybUJyb3dzZXInKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxwbHVnaW5zXFxcXGRldi5wbHVnaW4udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL01hcmNMZWdhdWx0L3Byb2plY3RzL3VwZC1uZXcvYXBwcy91cGQvdml0ZS1wbHVnaW4vcGx1Z2luL3BsdWdpbnMvZGV2LnBsdWdpbi50c1wiO2ltcG9ydCB7IFBsdWdpbiB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgeyBzd2NUcmFuc2Zvcm0gfSBmcm9tICcuLi9zd2MvdHJhbnNmb3JtLmpzJztcclxuXHJcbmNvbnN0IGhtckNvZGUgPSBgXHJcbmltcG9ydCB7XHJcbiAgY3JlYXRlSW5wdXRUcmFuc2ZlcixcclxuICBjcmVhdGVOZXdIb3N0cyxcclxuICByZW1vdmVOZ1N0eWxlcyxcclxufSBmcm9tICdAbml0ZWRhbmkvdml0ZS1wbHVnaW4tYW5ndWxhci9obXInO1xyXG5cclxuLy8gQHRzLWlnbm9yZVxyXG5jb25zdCBfX2Jvb3RzdHJhcEFwcGxpY2F0aW9uID0gYXN5bmMgKC4uLmFyZ3MpID0+IHtcclxuICByZW1vdmVOZ1N0eWxlcygpO1xyXG4gIC8vIEB0cy1pZ25vcmVcclxuICByZXR1cm4gYm9vdHN0cmFwQXBwbGljYXRpb24oLi4uYXJncykudGhlbigoYXBwUmVmKSA9PiB7XHJcbiAgICBpZiAoaW1wb3J0Lm1ldGEuaG90KSB7XHJcbiAgICAgIGltcG9ydC5tZXRhLmhvdC5hY2NlcHQoKTtcclxuICAgICAgaW1wb3J0Lm1ldGEuaG90LmRpc3Bvc2UoKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNtcExvY2F0aW9uID0gYXBwUmVmLmNvbXBvbmVudHMubWFwKFxyXG4gICAgICAgICAgKGNtcCkgPT4gY21wLmxvY2F0aW9uLm5hdGl2ZUVsZW1lbnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICBpbXBvcnQubWV0YS5ob3QuZGF0YS5zdG9yZSA9IHtcclxuICAgICAgICAgIGRpc3Bvc2VPbGRIb3N0czogY3JlYXRlTmV3SG9zdHMoY21wTG9jYXRpb24pLFxyXG4gICAgICAgICAgcmVzdG9yZUlucHV0VmFsdWVzOiBjcmVhdGVJbnB1dFRyYW5zZmVyKCksXHJcbiAgICAgICAgfTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjb25zdCBzdG9yZSA9IGltcG9ydC5tZXRhLmhvdC5kYXRhLnN0b3JlO1xyXG4gICAgICBpZiAoc3RvcmUpIHtcclxuICAgICAgICBzdG9yZS5kaXNwb3NlT2xkSG9zdHMoKTtcclxuICAgICAgICBzdG9yZS5yZXN0b3JlSW5wdXRWYWx1ZXMoKTtcclxuICAgICAgICBhcHBSZWYudGljaygpO1xyXG4gICAgICAgIGRlbGV0ZSBpbXBvcnQubWV0YS5ob3QuZGF0YS5zdG9yZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFwcFJlZjtcclxuICB9KTtcclxufTtcclxuYDtcclxuXHJcbmV4cG9ydCBjb25zdCBEZXZlbG9wbWVudFBsdWdpbjogUGx1Z2luID0ge1xyXG4gIG5hbWU6ICd2aXRlLXBsdWdpbi1hbmd1bGFyLWRldicsXHJcbiAgZW5mb3JjZTogJ3ByZScsXHJcbiAgYXBwbHkoY29uZmlnLCBlbnYpIHtcclxuICAgIGNvbnN0IGlzQnVpbGQgPSBlbnYuY29tbWFuZCA9PT0gJ2J1aWxkJztcclxuICAgIGNvbnN0IGlzU3NyQnVpbGQgPSBlbnYuc3NyQnVpbGQgPT09IHRydWU7XHJcbiAgICByZXR1cm4gIWlzQnVpbGQgfHwgaXNTc3JCdWlsZDtcclxuICB9LFxyXG4gIGNvbmZpZyhfdXNlckNvbmZpZywgZW52KSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlc2J1aWxkOiBmYWxzZSxcclxuICAgIH07XHJcbiAgfSxcclxuICByZXNvbHZlSWQoaWQpIHtcclxuICAgIGlmIChpZCA9PT0gJy9AYW5ndWxhci9jb21waWxlcicpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZSgnQGFuZ3VsYXIvY29tcGlsZXInKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHRyYW5zZm9ybUluZGV4SHRtbChodG1sKSB7XHJcbiAgICBjb25zdCBjb21waWxlclNjcmlwdCA9IGA8c2NyaXB0IHR5cGU9XCJtb2R1bGVcIiBzcmM9XCIvQGFuZ3VsYXIvY29tcGlsZXJcIj48L3NjcmlwdD5gO1xyXG4gICAgcmV0dXJuIGh0bWwucmVwbGFjZSgnPC9oZWFkPicsIGAke2NvbXBpbGVyU2NyaXB0fTwvaGVhZD5gKTtcclxuICB9LFxyXG4gIHRyYW5zZm9ybShjb2RlLCBpZCkge1xyXG4gICAgLy9UT0RPOiBkbyB0aGlzIGJldHRlclxyXG4gICAgY29uc3QgaXNFbnRyeSA9IGlkLmVuZHNXaXRoKCdtYWluLnRzJyk7XHJcblxyXG4gICAgaWYgKGlzRW50cnkpIHtcclxuICAgICAgbGV0IHQgPSAwO1xyXG4gICAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgICAgY29kZSA9IGNvZGUucmVwbGFjZSgvYm9vdHN0cmFwQXBwbGljYXRpb24vZywgbWF0Y2ggPT4ge1xyXG4gICAgICAgIGlmICgrK3QgPT09IDIpIHtcclxuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgIHJldHVybiAnX19ib290c3RyYXBBcHBsaWNhdGlvbic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBtYXRjaDtcclxuICAgICAgfSk7XHJcbiAgICAgIGlmIChmb3VuZCkge1xyXG4gICAgICAgIGNvZGUgPSBobXJDb2RlICsgY29kZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gUnVuIGV2ZXJ5dGhpbmcgZWxzZSB0aHJvdWdoIFNXQ1xyXG4gICAgLy8gT24gdGhlIHNlcnZlciwgd2UgbmVlZCBkZWNvcmF0b3IgbWV0YWRhdGEsXHJcbiAgICAvLyBAYW5hbG9nanMvdml0ZS1wbHVnaW4tYW5ndWxhciB1c2VzIGVzYnVpbGQsIGJ1dCBlc2J1aWxkIGRvZXNuJ3Qgc3VwcG9ydCBkZWNvcmF0b3IgbWV0YWRhdGFcclxuICAgIHJldHVybiBzd2NUcmFuc2Zvcm0oe1xyXG4gICAgICBjb2RlLFxyXG4gICAgICBpZCxcclxuICAgICAgaXNTc3I6IGZhbHNlLFxyXG4gICAgICBpc1Byb2R1Y3Rpb246IGZhbHNlLFxyXG4gICAgfSk7XHJcbiAgfSxcclxufTtcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxwbHVnaW5zXFxcXHByb2QucGx1Z2luLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9NYXJjTGVnYXVsdC9wcm9qZWN0cy91cGQtbmV3L2FwcHMvdXBkL3ZpdGUtcGx1Z2luL3BsdWdpbi9wbHVnaW5zL3Byb2QucGx1Z2luLnRzXCI7aW1wb3J0IGFuZ3VsYXJBcHBsaWNhdGlvblByZXNldCBmcm9tICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhci9zcmMvdG9vbHMvYmFiZWwvcHJlc2V0cy9hcHBsaWNhdGlvbi5qcyc7XHJcbmltcG9ydCB7IGNyZWF0ZUNvbXBpbGVyUGx1Z2luIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvYW5ndWxhci9jb21waWxlci1wbHVnaW4uanMnO1xyXG5pbXBvcnQge1xyXG4gIENvbXBpbGVySG9zdCxcclxuICBqb2luLFxyXG4gIE5ndHNjUHJvZ3JhbSxcclxuICByZWFkQ29uZmlndXJhdGlvbixcclxufSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGknO1xyXG5pbXBvcnQgeyB0cmFuc2Zvcm1Bc3luYyB9IGZyb20gJ0BiYWJlbC9jb3JlJztcclxuaW1wb3J0IHtcclxuICBtZXJnZVRyYW5zZm9ybWVycyxcclxuICByZXBsYWNlQm9vdHN0cmFwLFxyXG59IGZyb20gJ0BuZ3Rvb2xzL3dlYnBhY2svc3JjL2l2eS90cmFuc2Zvcm1hdGlvbi5qcyc7XHJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgY3dkIH0gZnJvbSAncHJvY2Vzcyc7XHJcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcclxuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCB7IEFuZ3VsYXJWaXRlUGx1Z2luT3B0aW9ucyB9IGZyb20gJy4uL3BsdWdpbi1vcHRpb25zJztcclxuaW1wb3J0IHsgbWVyZ2VEZWVwIH0gZnJvbSAnLi4vdXRpbHMnO1xyXG5pbXBvcnQgeyBPcHRpbWl6ZXJQbHVnaW4gfSBmcm9tICcuL29wdGltaXplci5wbHVnaW4uanMnO1xyXG5cclxuaW50ZXJmYWNlIEVtaXRGaWxlUmVzdWx0IHtcclxuICBjb2RlOiBzdHJpbmc7XHJcbiAgbWFwPzogc3RyaW5nO1xyXG4gIGRlcGVuZGVuY2llczogcmVhZG9ubHkgc3RyaW5nW107XHJcbiAgaGFzaD86IFVpbnQ4QXJyYXk7XHJcbn1cclxudHlwZSBGaWxlRW1pdHRlciA9IChmaWxlOiBzdHJpbmcpID0+IFByb21pc2U8RW1pdEZpbGVSZXN1bHQgfCB1bmRlZmluZWQ+O1xyXG5cclxuZXhwb3J0IGNvbnN0IFByb2R1Y3Rpb25QbHVnaW4gPSAoXHJcbiAgb3B0aW9ucz86IEFuZ3VsYXJWaXRlUGx1Z2luT3B0aW9ucyxcclxuKTogUGx1Z2luW10gPT4ge1xyXG4gIGNvbnN0IHdvcmtzcGFjZVJvb3QgPSBvcHRpb25zPy53b3Jrc3BhY2VSb290IHx8IGN3ZCgpO1xyXG4gIC8vIGNvbnN0IHRzY29uZmlnUGF0aCA9IG9wdGlvbnM/LnRzQ29uZmlnUGF0aCB8fCBqb2luKGN3ZCgpLCAndHNjb25maWcuanNvbicpO1xyXG4gIGNvbnN0IHRzY29uZmlnUGF0aCA9IHJlc29sdmUoY3dkKCksICd0c2NvbmZpZy5qc29uJyk7XHJcblxyXG4gIGxldCByb290TmFtZXM6IHN0cmluZ1tdID0gW107XHJcbiAgbGV0IGNvbXBpbGVyT3B0aW9uczogYW55ID0ge307XHJcbiAgbGV0IGhvc3Q6IHRzLkNvbXBpbGVySG9zdDtcclxuICBsZXQgZmlsZUVtaXR0ZXI6IEZpbGVFbWl0dGVyIHwgdW5kZWZpbmVkO1xyXG5cclxuICBhc3luYyBmdW5jdGlvbiBidWlsZEFuZEFuYWx5emUoKSB7XHJcbiAgICBjb25zdCBhbmd1bGFyUHJvZ3JhbTogTmd0c2NQcm9ncmFtID0gbmV3IE5ndHNjUHJvZ3JhbShcclxuICAgICAgcm9vdE5hbWVzLFxyXG4gICAgICBjb21waWxlck9wdGlvbnMsXHJcbiAgICAgIGhvc3QgYXMgQ29tcGlsZXJIb3N0LFxyXG4gICAgKTtcclxuICAgIGNvbnN0IGFuZ3VsYXJDb21waWxlciA9IGFuZ3VsYXJQcm9ncmFtLmNvbXBpbGVyO1xyXG4gICAgY29uc3QgdHlwZVNjcmlwdFByb2dyYW0gPSBhbmd1bGFyUHJvZ3JhbS5nZXRUc1Byb2dyYW0oKTtcclxuICAgIGNvbnN0IGJ1aWxkZXIgPSB0cy5jcmVhdGVBYnN0cmFjdEJ1aWxkZXIodHlwZVNjcmlwdFByb2dyYW0sIGhvc3QpO1xyXG4gICAgYXdhaXQgYW5ndWxhckNvbXBpbGVyLmFuYWx5emVBc3luYygpO1xyXG4gICAgY29uc3QgZGlhZ25vc3RpY3MgPSBhbmd1bGFyQ29tcGlsZXIuZ2V0RGlhZ25vc3RpY3MoKTtcclxuXHJcbiAgICBjb25zdCBtc2cgPSB0cy5mb3JtYXREaWFnbm9zdGljc1dpdGhDb2xvckFuZENvbnRleHQoZGlhZ25vc3RpY3MsIGhvc3QpO1xyXG4gICAgaWYgKG1zZykge1xyXG4gICAgICBjb25zb2xlLmxvZyhtc2cpO1xyXG4gICAgICBwcm9jZXNzLmV4aXQoMSk7XHJcbiAgICB9XHJcblxyXG4gICAgZmlsZUVtaXR0ZXIgPSBjcmVhdGVGaWxlRW1pdHRlcihcclxuICAgICAgYnVpbGRlcixcclxuICAgICAgbWVyZ2VUcmFuc2Zvcm1lcnMoYW5ndWxhckNvbXBpbGVyLnByZXBhcmVFbWl0KCkudHJhbnNmb3JtZXJzLCB7XHJcbiAgICAgICAgYmVmb3JlOiBbcmVwbGFjZUJvb3RzdHJhcCgoKSA9PiBidWlsZGVyLmdldFByb2dyYW0oKS5nZXRUeXBlQ2hlY2tlcigpKV0sXHJcbiAgICAgIH0pLFxyXG4gICAgICAoKSA9PiBbXSxcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gW1xyXG4gICAge1xyXG4gICAgICBuYW1lOiAndml0ZS1wbHVnaW4tYW5ndWxhci1wcm9kJyxcclxuICAgICAgZW5mb3JjZTogJ3ByZScsXHJcbiAgICAgIGFwcGx5KGNvbmZpZywgZW52KSB7XHJcbiAgICAgICAgY29uc3QgaXNCdWlsZCA9IGVudi5jb21tYW5kID09PSAnYnVpbGQnO1xyXG4gICAgICAgIGNvbnN0IGlzU3NyQnVpbGQgPSBlbnYuc3NyQnVpbGQ7XHJcbiAgICAgICAgcmV0dXJuIGlzQnVpbGQgJiYgIWlzU3NyQnVpbGQ7XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vVE9ETzogZml4IHRoaXNcclxuICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgIGNvbmZpZyhfdXNlckNvbmZpZywgZW52KSB7XHJcbiAgICAgICAgY29uc3Qgdml0ZUNvbmZpZyA9IG1lcmdlRGVlcChfdXNlckNvbmZpZywge1xyXG4gICAgICAgICAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICAgICAgICAgIGVzYnVpbGRPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAgICAgICAgY3JlYXRlQ29tcGlsZXJQbHVnaW4oXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0c2NvbmZpZzogdHNjb25maWdQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgYWR2YW5jZWRPcHRpbWl6YXRpb25zOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgd29ya3NwYWNlUm9vdCxcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXROYW1lczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgYnVuZGxlczogJ1tuYW1lXScsXHJcbiAgICAgICAgICAgICAgICAgICAgICBtZWRpYTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGltaXphdGlvbjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IFsnZXMyMDIwJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgaW5saW5lU3R5bGVMYW5ndWFnZTogJ3Njc3MnLFxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgIGRlZmluZToge1xyXG4gICAgICAgICAgICAgICAgbmdEZXZNb2RlOiAnZmFsc2UnLFxyXG4gICAgICAgICAgICAgICAgbmdKaXRNb2RlOiAnZmFsc2UnLFxyXG4gICAgICAgICAgICAgICAgbmdJMThuQ2xvc3VyZU1vZGU6ICdmYWxzZScsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB2aXRlQ29uZmlnO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgYXN5bmMgYnVpbGRTdGFydChvcHRpb25zKSB7XHJcbiAgICAgICAgY29uc3QgeyBvcHRpb25zOiB0c0NvbXBpbGVyT3B0aW9ucywgcm9vdE5hbWVzOiBybiB9ID0gcmVhZENvbmZpZ3VyYXRpb24oXHJcbiAgICAgICAgICB0c2NvbmZpZ1BhdGgsXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGVuYWJsZUl2eTogdHJ1ZSxcclxuICAgICAgICAgICAgY29tcGlsYXRpb25Nb2RlOiAnZnVsbCcsXHJcbiAgICAgICAgICAgIG5vRW1pdE9uRXJyb3I6IGZhbHNlLFxyXG4gICAgICAgICAgICBzdXBwcmVzc091dHB1dFBhdGhDaGVjazogdHJ1ZSxcclxuICAgICAgICAgICAgb3V0RGlyOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGlubGluZVNvdXJjZXM6IGZhbHNlLFxyXG4gICAgICAgICAgICBpbmxpbmVTb3VyY2VNYXA6IGZhbHNlLFxyXG4gICAgICAgICAgICBzb3VyY2VNYXA6IGZhbHNlLFxyXG4gICAgICAgICAgICBtYXBSb290OiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNvdXJjZVJvb3Q6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZGVjbGFyYXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgICBkZWNsYXJhdGlvbk1hcDogZmFsc2UsXHJcbiAgICAgICAgICAgIGFsbG93RW1wdHlDb2RlZ2VuRmlsZXM6IGZhbHNlLFxyXG4gICAgICAgICAgICBhbm5vdGF0aW9uc0FzOiAnZGVjb3JhdG9ycycsXHJcbiAgICAgICAgICAgIGVuYWJsZVJlc291cmNlSW5saW5pbmc6IGZhbHNlLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICApO1xyXG4gICAgICAgIHJvb3ROYW1lcyA9IHJuO1xyXG4gICAgICAgIGNvbXBpbGVyT3B0aW9ucyA9IHRzQ29tcGlsZXJPcHRpb25zO1xyXG4gICAgICAgIGhvc3QgPSB0cy5jcmVhdGVJbmNyZW1lbnRhbENvbXBpbGVySG9zdChjb21waWxlck9wdGlvbnMpO1xyXG4gICAgICAgIGF3YWl0IGJ1aWxkQW5kQW5hbHl6ZSgpO1xyXG4gICAgICB9LFxyXG4gICAgICBhc3luYyB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykgfHxcclxuICAgICAgICAgIC8vVE9ETzogd2h5IGlzIHRoaXMgbmVlZGVkPyB2aXRlLXBsdWdpbi1zc3IgdGhyb3dzIGFuIGVycm9yIGlmIHRoaXMgaXMgbm90IGhlcmVcclxuICAgICAgICAgIC8vIGRlYnVnIGFuZCByZW1vdmUgdGhpcyBpZiBwb3NzaWJsZVxyXG4gICAgICAgICAgY29kZS5pbmNsdWRlcygnQG5pdGVkYW5pL3ZpdGUtcGx1Z2luLWFuZ3VsYXIvY2xpZW50JylcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgvXFwuW2NtXT90c3g/JC8udGVzdChpZCkpIHtcclxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZpbGVFbWl0dGVyIShpZCk7XHJcbiAgICAgICAgICBjb25zdCBkYXRhID0gcmVzdWx0Py5jb2RlID8/ICcnO1xyXG4gICAgICAgICAgY29uc3QgZm9yY2VBc3luY1RyYW5zZm9ybWF0aW9uID1cclxuICAgICAgICAgICAgL2Zvclxccythd2FpdFxccypcXCh8YXN5bmNcXHMrZnVuY3Rpb25cXHMqXFwqLy50ZXN0KGRhdGEpO1xyXG4gICAgICAgICAgY29uc3QgYmFiZWxSZXN1bHQgPSBhd2FpdCB0cmFuc2Zvcm1Bc3luYyhkYXRhLCB7XHJcbiAgICAgICAgICAgIGZpbGVuYW1lOiBpZCxcclxuICAgICAgICAgICAgc291cmNlTWFwczogZmFsc2UsXHJcbiAgICAgICAgICAgIGNvbXBhY3Q6IGZhbHNlLFxyXG4gICAgICAgICAgICBjb25maWdGaWxlOiBmYWxzZSxcclxuICAgICAgICAgICAgYmFiZWxyYzogZmFsc2UsXHJcbiAgICAgICAgICAgIGJyb3dzZXJzbGlzdENvbmZpZ0ZpbGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBwbHVnaW5zOiBbXSxcclxuICAgICAgICAgICAgcHJlc2V0czogW1xyXG4gICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgIGFuZ3VsYXJBcHBsaWNhdGlvblByZXNldCxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgZm9yY2VBc3luY1RyYW5zZm9ybWF0aW9uLFxyXG4gICAgICAgICAgICAgICAgICBvcHRpbWl6ZToge30sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb2RlOiBiYWJlbFJlc3VsdD8uY29kZSA/PyAnJyxcclxuICAgICAgICAgICAgbWFwOiBiYWJlbFJlc3VsdD8ubWFwLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgT3B0aW1pemVyUGx1Z2luLFxyXG4gIF07XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZUVtaXR0ZXIoXHJcbiAgcHJvZ3JhbTogdHMuQnVpbGRlclByb2dyYW0sXHJcbiAgdHJhbnNmb3JtZXJzOiB0cy5DdXN0b21UcmFuc2Zvcm1lcnMgPSB7fSxcclxuICBvbkFmdGVyRW1pdD86IChzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKSA9PiB2b2lkLFxyXG4pOiBGaWxlRW1pdHRlciB7XHJcbiAgcmV0dXJuIGFzeW5jIChmaWxlOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGUoZmlsZSk7XHJcbiAgICBpZiAoIXNvdXJjZUZpbGUpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY29kZSA9ICcnO1xyXG4gICAgcHJvZ3JhbS5lbWl0KFxyXG4gICAgICBzb3VyY2VGaWxlLFxyXG4gICAgICAoZmlsZW5hbWUsIGRhdGEpID0+IHtcclxuICAgICAgICBpZiAoL1xcLltjbV0/anMkLy50ZXN0KGZpbGVuYW1lKSkge1xyXG4gICAgICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICAgICAgY29kZSA9IGRhdGE7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICB1bmRlZmluZWQgLyogY2FuY2VsbGF0aW9uVG9rZW4gKi8sXHJcbiAgICAgIHVuZGVmaW5lZCAvKiBlbWl0T25seUR0c0ZpbGVzICovLFxyXG4gICAgICB0cmFuc2Zvcm1lcnMsXHJcbiAgICApO1xyXG5cclxuICAgIG9uQWZ0ZXJFbWl0Py4oc291cmNlRmlsZSk7XHJcblxyXG4gICAgcmV0dXJuIHsgY29kZSwgZGVwZW5kZW5jaWVzOiBbXSB9O1xyXG4gIH07XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTWFyY0xlZ2F1bHRcXFxccHJvamVjdHNcXFxcdXBkLW5ld1xcXFxhcHBzXFxcXHVwZFxcXFx2aXRlLXBsdWdpblxcXFxwbHVnaW5cXFxcdXRpbHMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL01hcmNMZWdhdWx0L3Byb2plY3RzL3VwZC1uZXcvYXBwcy91cGQvdml0ZS1wbHVnaW4vcGx1Z2luL3V0aWxzLnRzXCI7aW1wb3J0IHsgbWVyZ2VDb25maWcgfSBmcm9tICd2aXRlJztcclxuXHJcbmV4cG9ydCBjb25zdCBub3JtYWxpemVQYXRoID0gKHBhdGg6IHN0cmluZykgPT4gcGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XHJcbmV4cG9ydCBjb25zdCB1c2VQbHVnaW5Db25maWcgPSBhc3luYyAocGx1Z2luLCBjb25maWcsIGVudikgPT4ge1xyXG4gIGxldCBjYyA9IGNvbmZpZztcclxuICBmb3IgKGNvbnN0IHAgb2YgW3BsdWdpbl0uZmxhdCgpKSB7XHJcbiAgICBpZiAocC5jb25maWcpIHtcclxuICAgICAgY29uc3QgcmV0ID0gYXdhaXQgcC5jb25maWcoY2MsIGVudik7XHJcbiAgICAgIGlmIChyZXQpIHtcclxuICAgICAgICBjYyA9IG1lcmdlQ29uZmlnKGNjLCByZXQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY2M7XHJcbn07XHJcbmV4cG9ydCBjb25zdCB1c2VQbHVnaW5UcmFuc2Zvcm0gPSBhc3luYyAoeyBwbHVnaW4sIGNvZGUsIGlkLCBjdHggfSkgPT4ge1xyXG4gIGxldCBjYyA9IHsgY29kZSB9O1xyXG4gIGxldCBwcmV2ID0gY2M7XHJcbiAgZm9yIChjb25zdCBwIG9mIFtwbHVnaW5dLmZsYXQoKSkge1xyXG4gICAgaWYgKHAudHJhbnNmb3JtKSB7XHJcbiAgICAgIHByZXYgPSBjYztcclxuXHJcbiAgICAgIGNjID0gYXdhaXQgcC50cmFuc2Zvcm0uY2FsbChjdHgsIGNjLmNvZGUsIGlkKTtcclxuICAgICAgY2MgPz89IHByZXY7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBjYztcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VQbHVnaW5IYW5kbGVIb3RVcGRhdGUgPSBhc3luYyAoeyBwbHVnaW4sIGN0eCB9KSA9PiB7XHJcbiAgY29uc3QgbW9kczogYW55W10gPSBbXTtcclxuXHJcbiAgZm9yIChjb25zdCBwIG9mIFtwbHVnaW5dLmZsYXQoKSkge1xyXG4gICAgaWYgKHAuaGFuZGxlSG90VXBkYXRlKSB7XHJcbiAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwLmhhbmRsZUhvdFVwZGF0ZShjdHgpO1xyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQpKSB7XHJcbiAgICAgICAgbW9kcy5wdXNoKC4uLnJlc3VsdCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBtb2RzO1xyXG59O1xyXG5leHBvcnQgY29uc3QgdXNlUGx1Z2luQnVpbGRTdGFydCA9IGFzeW5jICh7IHBsdWdpbiwgb3B0aW9ucyB9KSA9PiB7XHJcbiAgZm9yIChjb25zdCBwIG9mIFtwbHVnaW5dLmZsYXQoKSkge1xyXG4gICAgaWYgKHAuYnVpbGRTdGFydCkge1xyXG4gICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgYXdhaXQgcC5idWlsZFN0YXJ0KG9wdGlvbnMpO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuZXhwb3J0IGNvbnN0IHVzZVBsdWdpbkNvbmZpZ3VyZVNlcnZlciA9IGFzeW5jICh7IHBsdWdpbiwgc2VydmVyIH0pID0+IHtcclxuICBmb3IgKGNvbnN0IHAgb2YgW3BsdWdpbl0uZmxhdCgpKSB7XHJcbiAgICBpZiAocC5jb25maWd1cmVTZXJ2ZXIpIHtcclxuICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgIGF3YWl0IHAuY29uZmlndXJlU2VydmVyKHNlcnZlcik7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3QgaXNPYmplY3QgPSAodmFsOiB1bmtub3duKSA9PlxyXG4gIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWwpLnNsaWNlKDgsIC0xKSA9PT0gJ09iamVjdCc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2xvbmUoaW5wdXQ6IGFueSkge1xyXG4gIGNvbnN0IG91dHB1dCA9IEFycmF5LmlzQXJyYXkoaW5wdXQpID8gQXJyYXkoaW5wdXQubGVuZ3RoKSA6IHt9O1xyXG5cclxuICBpZiAoaW5wdXQ/LmdldFRpbWUpIHJldHVybiBuZXcgRGF0ZShpbnB1dC5nZXRUaW1lKCkpO1xyXG5cclxuICBmb3IgKGNvbnN0IGtleSBpbiBpbnB1dCkge1xyXG4gICAgY29uc3QgdmFsID0gaW5wdXRba2V5XTtcclxuXHJcbiAgICBvdXRwdXRba2V5XSA9IHR5cGVvZiB2YWwgPT09ICdvYmplY3QnICYmIHZhbCAhPT0gbnVsbCA/IGNsb25lKHZhbCkgOiB2YWw7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gb3V0cHV0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VEZWVwPE91dHB1dCA9IHVua25vd24+KFxyXG4gIHRhcmdldDogb2JqZWN0LFxyXG4gIHNvdXJjZTogb2JqZWN0LFxyXG4pOiBPdXRwdXQge1xyXG4gIGNvbnN0IG91dHB1dCA9IGNsb25lKHRhcmdldCkgYXMgT3V0cHV0O1xyXG5cclxuICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhzb3VyY2UpKSB7XHJcbiAgICBpZiAoaXNPYmplY3Qoc291cmNlW2tleV0pICYmIGlzT2JqZWN0KHRhcmdldFtrZXldKSkge1xyXG4gICAgICBvdXRwdXRba2V5XSA9IG1lcmdlRGVlcCh0YXJnZXRba2V5XSwgc291cmNlW2tleV0pO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBvdXRwdXRba2V5XSA9IHNvdXJjZVtrZXldO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG91dHB1dDtcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE1hcmNMZWdhdWx0XFxcXHByb2plY3RzXFxcXHVwZC1uZXdcXFxcYXBwc1xcXFx1cGRcXFxcdml0ZS1wbHVnaW5cXFxccGx1Z2luXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE1hcmNMZWdhdWx0XFxcXHByb2plY3RzXFxcXHVwZC1uZXdcXFxcYXBwc1xcXFx1cGRcXFxcdml0ZS1wbHVnaW5cXFxccGx1Z2luXFxcXHBsdWdpbnNcXFxcb3B0aW1pemVyLnBsdWdpbi50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTWFyY0xlZ2F1bHQvcHJvamVjdHMvdXBkLW5ldy9hcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vcGx1Z2lucy9vcHRpbWl6ZXIucGx1Z2luLnRzXCI7aW1wb3J0IGFuZ3VsYXJBcHBsaWNhdGlvblByZXNldCBmcm9tICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhci9zcmMvdG9vbHMvYmFiZWwvcHJlc2V0cy9hcHBsaWNhdGlvbi5qcyc7XHJcbmltcG9ydCB7IGxvYWRFc21Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhci9zcmMvdXRpbHMvbG9hZC1lc20uanMnO1xyXG5pbXBvcnQgeyB0cmFuc2Zvcm1Bc3luYyB9IGZyb20gJ0BiYWJlbC9jb3JlJztcclxuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCB7IHJlcXVpcmVzTGlua2luZyB9IGZyb20gJy4vdXRpbHMuanMnO1xyXG5cclxuZXhwb3J0IGNvbnN0IE9wdGltaXplclBsdWdpbjogUGx1Z2luID0ge1xyXG4gIG5hbWU6ICd2aXRlLXBsdWdpbi1hbmd1bGFyLW9wdGltaXplcicsXHJcbiAgYXBwbHkoY29uZmlnLCBlbnYpIHtcclxuICAgIGNvbnN0IGlzQnVpbGQgPSBlbnYuY29tbWFuZCA9PT0gJ2J1aWxkJztcclxuICAgIGNvbnN0IGlzU3NyQnVpbGQgPSBlbnYuc3NyQnVpbGQ7XHJcbiAgICByZXR1cm4gaXNCdWlsZCAmJiAhaXNTc3JCdWlsZDtcclxuICB9LFxyXG4gIGVuZm9yY2U6ICdwb3N0JyxcclxuICBjb25maWcoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlc2J1aWxkOiB7XHJcbiAgICAgICAgbGVnYWxDb21tZW50czogJ25vbmUnLFxyXG4gICAgICAgIGtlZXBOYW1lczogZmFsc2UsXHJcbiAgICAgICAgZGVmaW5lOiB7XHJcbiAgICAgICAgICBuZ0Rldk1vZGU6ICdmYWxzZScsXHJcbiAgICAgICAgICBuZ0ppdE1vZGU6ICdmYWxzZScsXHJcbiAgICAgICAgICBuZ0kxOG5DbG9zdXJlTW9kZTogJ2ZhbHNlJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN1cHBvcnRlZDoge1xyXG4gICAgICAgICAgLy8gTmF0aXZlIGFzeW5jL2F3YWl0IGlzIG5vdCBzdXBwb3J0ZWQgd2l0aCBab25lLmpzLiBEaXNhYmxpbmcgc3VwcG9ydCBoZXJlIHdpbGwgY2F1c2VcclxuICAgICAgICAgIC8vIGVzYnVpbGQgdG8gZG93bmxldmVsIGFzeW5jL2F3YWl0IHRvIGEgWm9uZS5qcyBzdXBwb3J0ZWQgZm9ybS5cclxuICAgICAgICAgICdhc3luYy1hd2FpdCc6IGZhbHNlLFxyXG4gICAgICAgICAgLy8gWm9uZS5qcyBhbHNvIGRvZXMgbm90IHN1cHBvcnQgYXN5bmMgZ2VuZXJhdG9ycyBvciBhc3luYyBpdGVyYXRvcnMuIEhvd2V2ZXIsIGVzYnVpbGQgZG9lc1xyXG4gICAgICAgICAgLy8gbm90IGN1cnJlbnRseSBzdXBwb3J0IGRvd25sZXZlbGluZyBlaXRoZXIgb2YgdGhlbS4gSW5zdGVhZCBiYWJlbCBpcyB1c2VkIHdpdGhpbiB0aGUgSlMvVFNcclxuICAgICAgICAgIC8vIGxvYWRlciB0byBwZXJmb3JtIHRoZSBkb3dubGV2ZWwgdHJhbnNmb3JtYXRpb24uIFRoZXkgYXJlIGJvdGggZGlzYWJsZWQgaGVyZSB0byBhbGxvd1xyXG4gICAgICAgICAgLy8gZXNidWlsZCB0byBoYW5kbGUgdGhlbSBpbiB0aGUgZnV0dXJlIGlmIHN1cHBvcnQgaXMgZXZlciBhZGRlZC5cclxuICAgICAgICAgIC8vIE5PVEU6IElmIGVzYnVpbGQgYWRkcyBzdXBwb3J0IGluIHRoZSBmdXR1cmUsIHRoZSBiYWJlbCBzdXBwb3J0IGZvciB0aGVzZSBjYW4gYmUgZGlzYWJsZWQuXHJcbiAgICAgICAgICAnYXN5bmMtZ2VuZXJhdG9yJzogZmFsc2UsXHJcbiAgICAgICAgICAnZm9yLWF3YWl0JzogZmFsc2UsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfSxcclxuICBhc3luYyB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcclxuICAgIGlmICgvXFwuW2NtXT9qcyQvLnRlc3QoaWQpKSB7XHJcbiAgICAgIGNvbnN0IGFuZ3VsYXJQYWNrYWdlID0gL1tcXFxcL11ub2RlX21vZHVsZXNbXFxcXC9dQGFuZ3VsYXJbXFxcXC9dLy50ZXN0KGlkKTtcclxuXHJcbiAgICAgIGNvbnN0IGxpbmtlclBsdWdpbkNyZWF0b3IgPSAoXHJcbiAgICAgICAgYXdhaXQgbG9hZEVzbU1vZHVsZTxcclxuICAgICAgICAgIHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9saW5rZXIvYmFiZWwnKVxyXG4gICAgICAgID4oJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9saW5rZXIvYmFiZWwnKVxyXG4gICAgICApLmNyZWF0ZUVzMjAxNUxpbmtlclBsdWdpbjtcclxuXHJcbiAgICAgIGNvbnN0IGZvcmNlQXN5bmNUcmFuc2Zvcm1hdGlvbiA9XHJcbiAgICAgICAgIS9bXFxcXC9dW19mXT9lc20yMDE1W1xcXFwvXS8udGVzdChpZCkgJiZcclxuICAgICAgICAvZm9yXFxzK2F3YWl0XFxzKlxcKHxhc3luY1xccytmdW5jdGlvblxccypcXCovLnRlc3QoY29kZSk7XHJcbiAgICAgIGNvbnN0IHNob3VsZExpbmsgPSBhd2FpdCByZXF1aXJlc0xpbmtpbmcoaWQsIGNvZGUpO1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdHJhbnNmb3JtQXN5bmMoY29kZSwge1xyXG4gICAgICAgIGZpbGVuYW1lOiBpZCxcclxuICAgICAgICBzb3VyY2VNYXBzOiBmYWxzZSxcclxuICAgICAgICBjb21wYWN0OiBmYWxzZSxcclxuICAgICAgICBjb25maWdGaWxlOiBmYWxzZSxcclxuICAgICAgICBiYWJlbHJjOiBmYWxzZSxcclxuICAgICAgICBicm93c2Vyc2xpc3RDb25maWdGaWxlOiBmYWxzZSxcclxuICAgICAgICBwbHVnaW5zOiBbXSxcclxuICAgICAgICBwcmVzZXRzOiBbXHJcbiAgICAgICAgICBbXHJcbiAgICAgICAgICAgIGFuZ3VsYXJBcHBsaWNhdGlvblByZXNldCxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGFuZ3VsYXJMaW5rZXI6IHtcclxuICAgICAgICAgICAgICAgIHNob3VsZExpbmssXHJcbiAgICAgICAgICAgICAgICBqaXRNb2RlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGxpbmtlclBsdWdpbkNyZWF0b3IsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBmb3JjZUFzeW5jVHJhbnNmb3JtYXRpb24sXHJcbiAgICAgICAgICAgICAgb3B0aW1pemU6IHtcclxuICAgICAgICAgICAgICAgIGxvb3NlRW51bXM6IGFuZ3VsYXJQYWNrYWdlLFxyXG4gICAgICAgICAgICAgICAgcHVyZVRvcExldmVsOiBhbmd1bGFyUGFja2FnZSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgY29kZTogcmVzdWx0Py5jb2RlIHx8ICcnLFxyXG4gICAgICAgIG1hcDogcmVzdWx0Py5tYXAgYXMgYW55LFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybjtcclxuICB9LFxyXG59O1xyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE1hcmNMZWdhdWx0XFxcXHByb2plY3RzXFxcXHVwZC1uZXdcXFxcYXBwc1xcXFx1cGRcXFxcdml0ZS1wbHVnaW5cXFxccGx1Z2luXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE1hcmNMZWdhdWx0XFxcXHByb2plY3RzXFxcXHVwZC1uZXdcXFxcYXBwc1xcXFx1cGRcXFxcdml0ZS1wbHVnaW5cXFxccGx1Z2luXFxcXHBsdWdpbnNcXFxcdXRpbHMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL01hcmNMZWdhdWx0L3Byb2plY3RzL3VwZC1uZXcvYXBwcy91cGQvdml0ZS1wbHVnaW4vcGx1Z2luL3BsdWdpbnMvdXRpbHMudHNcIjtpbXBvcnQgKiBhcyB3YmwgZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXIvc3JjL3Rvb2xzL2JhYmVsL3dlYnBhY2stbG9hZGVyLmpzJztcclxuaW1wb3J0ICogYXMgYXBwIGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyL3NyYy90b29scy9iYWJlbC9wcmVzZXRzL2FwcGxpY2F0aW9uLmpzJztcclxuXHJcbmxldCByZXF1aXJlc0xpbmtpbmc6IEZ1bmN0aW9uO1xyXG4vKipcclxuICogV29ya2Fyb3VuZCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIEFuZ3VsYXIgMTYuMitcclxuICovXHJcbmlmICh0eXBlb2YgKHdibCBhcyBhbnkpWydyZXF1aXJlc0xpbmtpbmcnXSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICByZXF1aXJlc0xpbmtpbmcgPSAod2JsIGFzIGFueSkucmVxdWlyZXNMaW5raW5nO1xyXG59IGVsc2UgaWYgKHR5cGVvZiAoYXBwIGFzIGFueSlbJ3JlcXVpcmVzTGlua2luZyddICE9PSAndW5kZWZpbmVkJykge1xyXG4gIHJlcXVpcmVzTGlua2luZyA9IChhcHAgYXMgYW55KVsncmVxdWlyZXNMaW5raW5nJ10gYXMgRnVuY3Rpb247XHJcbn1cclxuXHJcbmV4cG9ydCB7IHJlcXVpcmVzTGlua2luZyB9O1xyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE1hcmNMZWdhdWx0XFxcXHByb2plY3RzXFxcXHVwZC1uZXdcXFxcYXBwc1xcXFx1cGRcXFxcdml0ZS1wbHVnaW5cXFxccGx1Z2luXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYXJjTGVnYXVsdFxcXFxwcm9qZWN0c1xcXFx1cGQtbmV3XFxcXGFwcHNcXFxcdXBkXFxcXHZpdGUtcGx1Z2luXFxcXHBsdWdpblxcXFxpbmRleC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTWFyY0xlZ2F1bHQvcHJvamVjdHMvdXBkLW5ldy9hcHBzL3VwZC92aXRlLXBsdWdpbi9wbHVnaW4vaW5kZXgudHNcIjtpbXBvcnQgeyBQbHVnaW4gfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHsgRGlySW1wb3J0ZXJQbHVnaW4gfSBmcm9tICcuL25vZGUvZGlyLWltcG9ydGVyLmpzJztcclxuaW1wb3J0IHsgQW5ndWxhclZpdGVQbHVnaW5PcHRpb25zIGFzIFZpdGVQbHVnaW5Bbmd1bGFyT3B0aW9ucyB9IGZyb20gJy4vcGx1Z2luLW9wdGlvbnMuanMnO1xyXG5pbXBvcnQgeyBDb21tb25QbHVnaW4gfSBmcm9tICcuL3BsdWdpbnMvY29uZmlnLmpzJztcclxuaW1wb3J0IHsgRGV2ZWxvcG1lbnRQbHVnaW4gfSBmcm9tICcuL3BsdWdpbnMvZGV2LnBsdWdpbi5qcyc7XHJcbmltcG9ydCB7IFByb2R1Y3Rpb25QbHVnaW4gfSBmcm9tICcuL3BsdWdpbnMvcHJvZC5wbHVnaW4uanMnO1xyXG5pbXBvcnQgeyBjaGVja2VyIH0gZnJvbSAndml0ZS1wbHVnaW4tY2hlY2tlcic7XHJcbmltcG9ydCBkZWZ1IGZyb20gJ2RlZnUnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFuZ3VsYXIob3B0aW9ucz86IFZpdGVQbHVnaW5Bbmd1bGFyT3B0aW9ucyk6IFBsdWdpbltdIHtcclxuICBjb25zdCB7IHR5cGVjaGVjayB9ID0gZGVmdShvcHRpb25zLCB7XHJcbiAgICB0eXBlY2hlY2s6IHRydWUsXHJcbiAgfSk7XHJcbiAgY29uc3QgcGx1Z2lucyA9IFtcclxuICAgIENvbW1vblBsdWdpbixcclxuICAgIERpckltcG9ydGVyUGx1Z2luLFxyXG4gICAgRGV2ZWxvcG1lbnRQbHVnaW4sXHJcbiAgICAuLi5Qcm9kdWN0aW9uUGx1Z2luKG9wdGlvbnMpLFxyXG4gIF07XHJcbiAgaWYgKHR5cGVjaGVjaykge1xyXG4gICAgcGx1Z2lucy5wdXNoKGNoZWNrZXIoeyB0eXBlc2NyaXB0OiB7IHJvb3Q6IG9wdGlvbnM/LndvcmtzcGFjZVJvb3QsIHRzY29uZmlnUGF0aDogb3B0aW9ucz8udHNDb25maWdQYXRoIH0gfSkpO1xyXG4gIH1cclxuICByZXR1cm4gcGx1Z2lucztcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRVLFNBQVMsV0FBQUEsZ0JBQWU7QUFDcFcsU0FBUyxjQUFjLDhCQUFpRDs7O0FDRGtWLFNBQVMsWUFBWTtBQUMvYSxTQUFTLFVBQVUsZUFBZTtBQUNsQyxTQUFTLFdBQVc7QUFDcEIsU0FBUyxxQkFBNkI7QUFFL0IsSUFBTSxvQkFBNEI7QUFBQSxFQUN2QyxNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsRUFDVCxNQUFNLFVBQVUsUUFBUSxVQUFVLFNBQVM7QUFDekMsUUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEtBQUs7QUFDN0I7QUFBQSxJQUNGO0FBQ0EsUUFBSTtBQUNGLFlBQU0sY0FBYyxjQUFjLFNBQVMsSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUN6RCxZQUFNLGVBQWUsUUFBUSxJQUFJLEdBQUcsZ0JBQWdCLE1BQU07QUFDMUQsWUFBTSxRQUFRLE1BQU0sS0FBSyxZQUFZO0FBQ3JDLFVBQUksTUFBTSxZQUFZLEdBQUc7QUFDdkIsY0FBTSxrQkFBa0IsT0FBTyxNQUFNLEdBQUcsRUFBRSxJQUFJO0FBQzlDLGNBQU0sYUFBYTtBQUFBLFVBQ2pCO0FBQUEsVUFDQTtBQUFBLFVBQ0Esa0JBQWtCO0FBQUEsVUFDbEIsa0JBQWtCO0FBQUEsUUFDcEI7QUFFQSxtQkFBVyxhQUFhLFlBQVk7QUFDbEMsY0FBSTtBQUNGLGtCQUFNQyxTQUFRLE1BQU0sS0FBSyxRQUFRLGNBQWMsU0FBUyxDQUFDO0FBQ3pELGdCQUFJQSxPQUFNLE9BQU8sR0FBRztBQUNsQixxQkFBTyxLQUFLLFFBQVEsR0FBRyxXQUFXLElBQUksU0FBUyxJQUFJLFVBQVU7QUFBQSxnQkFDM0QsR0FBRztBQUFBLGdCQUNILFVBQVU7QUFBQSxjQUNaLENBQUM7QUFBQSxZQUNIO0FBQUEsVUFDRixR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ZTtBQUFBLFFBQzdDO0FBQUEsUUFDQSxVQUFVO0FBQUEsUUFDVixXQUFXO0FBQUEsUUFDWCxPQUFPO0FBQUEsUUFDUCxTQUFTLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBUTtBQUFBLFFBQ3RDLFVBQVUsUUFBUTtBQUFBLFVBQ2hCO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxNQUNSLFdBQVc7QUFBQSxJQUNiO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0wsUUFBUSxvQkFBb0IsUUFBUSxJQUFJLE1BQU0sS0FBSyxHQUFJO0FBQUEsTUFDekQ7QUFBQSxJQUNGO0FBQUEsSUFDQSxVQUFVO0FBQUEsSUFDVixNQUFNO0FBQUEsTUFDSixXQUFXO0FBQUEsSUFDYjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsY0FBYztBQUFBLFFBQ1osTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUFBLE1BQ0QsUUFBUTtBQUFBLFFBQ04sV0FBVztBQUFBLFFBQ1gsZUFBZTtBQUFBLFFBQ2YsY0FBYztBQUFBLE1BQ2hCLENBQUM7QUFBQSxNQUNELHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxRQUFRLG9CQUFvQixRQUFRLElBQUksTUFBTSxLQUFLLEdBQUk7QUFBQSxNQUN6RDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicmVzb2x2ZSIsICJzdGF0cyIsICJjd2QiLCAiY3dkIiwgIlZpc2l0b3IiLCAiam9pbiIsICJjcmVhdGVTcGFuIiwgImNyZWF0ZVN0cmluZ0xpdGVyYWwiLCAiVmlzaXRvciIsICJjcmVhdGVTcGFuIiwgImNyZWF0ZVN0cmluZ0xpdGVyYWwiLCAiam9pbiIsICJWaXNpdG9yIiwgImNyZWF0ZUlkZW50aWZlciIsICJjcmVhdGVTcGFuIiwgImlzSW1wb3J0RGVjbGFyYXRpb24iLCAiY3JlYXRlU3BhbiIsICJWaXNpdG9yIiwgImlzSW1wb3J0RGVjbGFyYXRpb24iLCAiY3JlYXRlSWRlbnRpZmVyIiwgIlZpc2l0b3IiLCAiY3JlYXRlSW1wb3J0U3BlY2lmaWVyIiwgImNyZWF0ZVN0cmluZ0xpdGVyYWwiLCAiaXNDYWxsRXhwcmVzc2lvbiIsICJpc0ltcG9ydERlY2xhcmF0aW9uIiwgImlzSWRlbnRpZmVyIiwgImNyZWF0ZUlkZW50aWZlciIsICJhbmd1bGFyQXBwbGljYXRpb25QcmVzZXQiLCAidHJhbnNmb3JtQXN5bmMiLCAicmVzb2x2ZSIsICJjd2QiLCAicmVxdWlyZXNMaW5raW5nIiwgInJlcXVpcmVzTGlua2luZyIsICJ3b3Jrc3BhY2VSb290IiwgImN3ZCIsICJyZXNvbHZlIiwgIm9wdGlvbnMiLCAidHJhbnNmb3JtQXN5bmMiLCAiYW5ndWxhckFwcGxpY2F0aW9uUHJlc2V0IiwgInBsdWdpbnMiLCAicmVzb2x2ZSJdCn0K
