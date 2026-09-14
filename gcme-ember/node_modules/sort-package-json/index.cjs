var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.js
var index_exports = {};
__export(index_exports, {
  default: () => index_default,
  sortOrder: () => defaultSortOrder,
  sortPackageJson: () => sortPackageJson
});
module.exports = __toCommonJS(index_exports);
var import_node_fs = __toESM(require("node:fs"), 1);

// node_modules/sort-object-keys/index.js
var has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
function sortObjectByKeyNameList(object, sortWith) {
  let keys, sortFn, key;
  if (typeof sortWith === "function") {
    sortFn = sortWith;
  } else {
    keys = sortWith;
  }
  const total = {};
  const objectKeys = [...keys ?? [], ...Object.keys(object).sort(sortFn)];
  for (key of objectKeys) {
    if (has(object, key)) {
      total[key] = object[key];
    }
  }
  return total;
}

// node_modules/detect-indent/index.js
var INDENT_REGEX = /^(?:( )+|\t+)/;
var INDENT_TYPE_SPACE = "space";
var INDENT_TYPE_TAB = "tab";
function shouldIgnoreSingleSpace(ignoreSingleSpaces, indentType, value) {
  return ignoreSingleSpaces && indentType === INDENT_TYPE_SPACE && value === 1;
}
function makeIndentsMap(string, ignoreSingleSpaces) {
  const indents = /* @__PURE__ */ new Map();
  let previousSize = 0;
  let previousIndentType;
  let key;
  for (const line of string.split(/\n/g)) {
    if (!line) {
      continue;
    }
    const matches = line.match(INDENT_REGEX);
    if (matches === null) {
      previousSize = 0;
      previousIndentType = "";
    } else {
      const indent = matches[0].length;
      const indentType = matches[1] ? INDENT_TYPE_SPACE : INDENT_TYPE_TAB;
      if (shouldIgnoreSingleSpace(ignoreSingleSpaces, indentType, indent)) {
        continue;
      }
      if (indentType !== previousIndentType) {
        previousSize = 0;
      }
      previousIndentType = indentType;
      let use = 1;
      let weight = 0;
      const indentDifference = indent - previousSize;
      previousSize = indent;
      if (indentDifference === 0) {
        use = 0;
        weight = 1;
      } else {
        const absoluteIndentDifference = Math.abs(indentDifference);
        if (shouldIgnoreSingleSpace(ignoreSingleSpaces, indentType, absoluteIndentDifference)) {
          continue;
        }
        key = encodeIndentsKey(indentType, absoluteIndentDifference);
      }
      const entry = indents.get(key);
      indents.set(key, entry === void 0 ? [1, 0] : [entry[0] + use, entry[1] + weight]);
    }
  }
  return indents;
}
function encodeIndentsKey(indentType, indentAmount) {
  const typeCharacter = indentType === INDENT_TYPE_SPACE ? "s" : "t";
  return typeCharacter + String(indentAmount);
}
function decodeIndentsKey(indentsKey) {
  const keyHasTypeSpace = indentsKey[0] === "s";
  const type = keyHasTypeSpace ? INDENT_TYPE_SPACE : INDENT_TYPE_TAB;
  const amount = Number(indentsKey.slice(1));
  return { type, amount };
}
function getMostUsedKey(indents) {
  let result;
  let maxUsed = 0;
  let maxWeight = 0;
  for (const [key, [usedCount, weight]] of indents) {
    if (usedCount > maxUsed || usedCount === maxUsed && weight > maxWeight) {
      maxUsed = usedCount;
      maxWeight = weight;
      result = key;
    }
  }
  return result;
}
function makeIndentString(type, amount) {
  const indentCharacter = type === INDENT_TYPE_SPACE ? " " : "	";
  return indentCharacter.repeat(amount);
}
function detectIndent(string) {
  if (typeof string !== "string") {
    throw new TypeError("Expected a string");
  }
  let indents = makeIndentsMap(string, true);
  if (indents.size === 0) {
    indents = makeIndentsMap(string, false);
  }
  const keyOfMostUsedIndent = getMostUsedKey(indents);
  let type;
  let amount = 0;
  let indent = "";
  if (keyOfMostUsedIndent !== void 0) {
    ({ type, amount } = decodeIndentsKey(keyOfMostUsedIndent));
    indent = makeIndentString(type, amount);
  }
  return {
    amount,
    type,
    indent
  };
}

// node_modules/detect-newline/index.js
function detectNewline(string) {
  if (typeof string !== "string") {
    throw new TypeError("Expected a string");
  }
  const newlines = string.match(/(?:\r?\n)/g) || [];
  if (newlines.length === 0) {
    return;
  }
  const crlf = newlines.filter((newline) => newline === "\r\n").length;
  const lf = newlines.length - crlf;
  return crlf > lf ? "\r\n" : "\n";
}
function detectNewlineGraceful(string) {
  return typeof string === "string" && detectNewline(string) || "\n";
}

// index.js
var import_git_hooks_list = __toESM(require("git-hooks-list"), 1);

// node_modules/is-plain-obj/index.js
function isPlainObject(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
}

// index.js
var import_compare = __toESM(require("semver/functions/compare.js"), 1);
var import_min_version = __toESM(require("semver/ranges/min-version.js"), 1);
var pipe = (fns) => (x, ...args) => fns.reduce((result, fn) => fn(result, ...args), x);
var onArray = (fn) => (x) => Array.isArray(x) ? fn(x) : x;
var onStringArray = (fn) => (x) => Array.isArray(x) && x.every((item) => typeof item === "string") ? fn(x) : x;
var uniq = onStringArray((xs) => [...new Set(xs)]);
var sortArray = onStringArray((array) => array.toSorted());
var uniqAndSortArray = pipe([uniq, sortArray]);
var onObject = (fn) => (x, ...args) => isPlainObject(x) ? fn(x, ...args) : x;
var sortObjectBy = (comparator, deep) => {
  const over = onObject((object) => {
    if (deep) {
      object = Object.fromEntries(
        Object.entries(object).map(([key, value]) => [key, over(value)])
      );
    }
    return sortObjectByKeyNameList(object, comparator);
  });
  return over;
};
var objectGroupBy = (
  // eslint-disable-next-line n/no-unsupported-features/es-builtins, n/no-unsupported-features/es-syntax -- Safe
  Object.groupBy || // Remove this when we drop support for Node.js 20
  ((array, callback) => {
    const result = /* @__PURE__ */ Object.create(null);
    for (const value of array) {
      const key = callback(value);
      if (result[key]) {
        result[key].push(value);
      } else {
        result[key] = [value];
      }
    }
    return result;
  })
);
var sortObject = sortObjectBy();
var sortURLObject = sortObjectBy(["type", "url"]);
var sortPeopleObject = sortObjectBy(["name", "email", "url"]);
var sortDirectories = sortObjectBy([
  "lib",
  "bin",
  "man",
  "doc",
  "example",
  "test"
]);
var overProperty = (property, over) => onObject(
  (object, ...args) => Object.hasOwn(object, property) ? { ...object, [property]: over(object[property], ...args) } : object
);
var sortGitHooks = sortObjectBy(import_git_hooks_list.default);
var parseNameAndVersionRange = (specifier) => {
  const [nameAndVersion] = specifier.split(">");
  const atMatches = [...nameAndVersion.matchAll("@")];
  if (!atMatches.length || atMatches.length === 1 && atMatches[0].index === 0) {
    return { name: specifier };
  }
  const splitIndex = atMatches.pop().index;
  return {
    name: nameAndVersion.substring(0, splitIndex),
    range: nameAndVersion.substring(splitIndex + 1)
  };
};
var sortObjectBySemver = sortObjectBy((a, b) => {
  const { name: aName, range: aRange } = parseNameAndVersionRange(a);
  const { name: bName, range: bRange } = parseNameAndVersionRange(b);
  if (aName !== bName) {
    return aName.localeCompare(bName, "en");
  }
  if (!aRange) {
    return -1;
  }
  if (!bRange) {
    return 1;
  }
  return (0, import_compare.default)((0, import_min_version.default)(aRange), (0, import_min_version.default)(bRange));
});
var getPackageName = (ident) => {
  const index = ident.indexOf("@", ident.startsWith("@") ? 1 : 0);
  return index === -1 ? ident : ident.slice(0, index);
};
var sortObjectByIdent = (a, b) => {
  const packageNameA = getPackageName(a);
  const packageNameB = getPackageName(b);
  if (packageNameA < packageNameB) return -1;
  if (packageNameA > packageNameB) return 1;
  return 0;
};
var cache = /* @__PURE__ */ new Map();
var hasYarnOrPnpmFiles = () => {
  const cwd = process.cwd();
  if (!cache.has(cwd)) {
    cache.set(
      cwd,
      import_node_fs.default.existsSync("yarn.lock") || import_node_fs.default.existsSync(".yarn/") || import_node_fs.default.existsSync(".yarnrc.yml") || import_node_fs.default.existsSync("pnpm-lock.yaml") || import_node_fs.default.existsSync("pnpm-workspace.yaml")
    );
  }
  return cache.get(cwd);
};
function shouldSortDependenciesLikeNpm(packageJson) {
  if (typeof packageJson.packageManager === "string") {
    return packageJson.packageManager.startsWith("npm@");
  }
  if (packageJson.devEngines?.packageManager?.name) {
    return packageJson.devEngines.packageManager.name === "npm";
  }
  if (packageJson.pnpm) {
    return false;
  }
  if (packageJson.engines?.npm) {
    return true;
  }
  if (hasYarnOrPnpmFiles()) {
    return false;
  }
  return true;
}
var sortDependencies = onObject((dependencies, packageJson) => {
  if (Object.keys(dependencies).length < 2) {
    return dependencies;
  }
  if (shouldSortDependenciesLikeNpm(packageJson)) {
    return sortObjectByKeyNameList(dependencies, (a, b) => a.localeCompare(b, "en"));
  }
  return sortObjectByKeyNameList(dependencies);
});
var sortWorkspaces = pipe([
  sortObjectBy(["packages", "catalog"]),
  overProperty("packages", uniqAndSortArray),
  overProperty("catalog", sortDependencies)
]);
var eslintBaseConfigProperties = [
  // `files` and `excludedFiles` are only on `overrides[]`
  // for easier sort `overrides[]`,
  // add them to here, so we don't need sort `overrides[]` twice
  "files",
  "excludedFiles",
  // baseConfig
  "env",
  "parser",
  "parserOptions",
  "settings",
  "plugins",
  "extends",
  "rules",
  "overrides",
  "globals",
  "processor",
  "noInlineConfig",
  "reportUnusedDisableDirectives"
];
var sortEslintConfig = pipe([
  sortObjectBy(eslintBaseConfigProperties),
  overProperty("env", sortObject),
  overProperty("globals", sortObject),
  overProperty(
    "overrides",
    onArray((overrides) => overrides.map(sortEslintConfig))
  ),
  overProperty("parserOptions", sortObject),
  overProperty(
    "rules",
    sortObjectBy(
      (rule1, rule2) => rule1.split("/").length - rule2.split("/").length || rule1.localeCompare(rule2)
    )
  ),
  overProperty("settings", sortObject)
]);
var sortVSCodeBadgeObject = sortObjectBy(["description", "url", "href"]);
var sortPrettierConfig = pipe([
  // sort keys alphabetically, but put `overrides` at bottom
  onObject(
    (config) => sortObjectByKeyNameList(config, [
      ...Object.keys(config).filter((key) => key !== "overrides").sort(),
      "overrides"
    ])
  ),
  // if `config.overrides` exists
  overProperty(
    "overrides",
    // and `config.overrides` is an array
    onArray(
      (overrides) => overrides.map(
        pipe([
          // sort `config.overrides[]` alphabetically
          sortObject,
          // sort `config.overrides[].options` alphabetically
          overProperty("options", sortObject)
        ])
      )
    )
  )
]);
var sortVolta = sortObjectBy(["node", "npm", "yarn"]);
var wireitScriptProperties = ["command", "dependencies", "files", "output"];
var sortWireitScript = pipe([
  sortObjectBy(wireitScriptProperties),
  overProperty(
    "dependencies",
    onArray((deps) => deps.map(sortObjectBy(["script", "cascade"])))
  ),
  overProperty(
    "env",
    onObject(
      (env) => sortObjectByKeyNameList(
        Object.fromEntries(
          Object.entries(env).map(([key, value]) => [
            key,
            sortObjectBy(["external", "default"])(value)
          ])
        )
      )
    )
  ),
  overProperty(
    "service",
    pipe([sortObjectBy(["readyWhen"]), overProperty("readyWhen", sortObject)])
  )
]);
var sortWireit = onObject(
  (wireit) => sortObjectByKeyNameList(
    Object.fromEntries(
      Object.entries(wireit).map(([name, config]) => [
        name,
        sortWireitScript(config)
      ])
    )
  )
);
var sortDevEngines = overProperty(
  "packageManager",
  sortObjectBy(["name", "version", "onFail"])
);
var pnpmBaseConfigProperties = [
  "peerDependencyRules",
  "neverBuiltDependencies",
  "onlyBuiltDependencies",
  "onlyBuiltDependenciesFile",
  "allowedDeprecatedVersions",
  "allowNonAppliedPatches",
  "updateConfig",
  "auditConfig",
  "requiredScripts",
  "supportedArchitectures",
  "overrides",
  "patchedDependencies",
  "packageExtensions"
];
var sortPnpmConfig = pipe([
  sortObjectBy(pnpmBaseConfigProperties, true),
  overProperty("overrides", sortObjectBySemver)
]);
var defaultNpmScripts = /* @__PURE__ */ new Set([
  "install",
  "pack",
  "prepare",
  "publish",
  "restart",
  "shrinkwrap",
  "start",
  "stop",
  "test",
  "uninstall",
  "version"
]);
var hasDevDependency = (dependency, packageJson) => {
  return Object.hasOwn(packageJson, "devDependencies") && Object.hasOwn(packageJson.devDependencies, dependency);
};
var runSRegExp = /(?<=^|[\s&;<>|(])(?:run-s|npm-run-all2? .*(?:--sequential|--serial|-s))(?=$|[\s&;<>|)])/;
var isSequentialScript = (command) => command.includes("*") && runSRegExp.test(command);
var hasSequentialScript = (packageJson) => {
  if (!hasDevDependency("npm-run-all", packageJson) && !hasDevDependency("npm-run-all2", packageJson)) {
    return false;
  }
  const scripts = ["scripts", "betterScripts"].flatMap(
    (field) => packageJson[field] ? Object.values(packageJson[field]) : []
  );
  return scripts.some((script) => isSequentialScript(script));
};
function sortScriptNames(keys, prefix = "") {
  const groupMap = /* @__PURE__ */ new Map();
  for (const key of keys) {
    const rest = prefix ? key.slice(prefix.length + 1) : key;
    const idx = rest.indexOf(":");
    if (idx > 0) {
      const base = key.slice(0, (prefix ? prefix.length + 1 : 0) + idx);
      if (!groupMap.has(base)) groupMap.set(base, []);
      groupMap.get(base).push(key);
    } else {
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(key);
    }
  }
  return Array.from(groupMap.keys()).sort().flatMap((groupKey) => {
    const children = groupMap.get(groupKey);
    if (children.length > 1 && children.some((k) => k !== groupKey && k.startsWith(groupKey + ":"))) {
      const direct = children.filter((k) => k === groupKey || !k.startsWith(groupKey + ":")).sort();
      const nested = children.filter((k) => k.startsWith(groupKey + ":"));
      return [...direct, ...sortScriptNames(nested, groupKey)];
    }
    return children.sort();
  });
}
var sortScripts = onObject((scripts, packageJson) => {
  let names = Object.keys(scripts);
  const prefixable = /* @__PURE__ */ new Set();
  names = names.map((name) => {
    const omitted = name.replace(/^(?:pre|post)/, "");
    if (defaultNpmScripts.has(omitted) || names.includes(omitted)) {
      prefixable.add(omitted);
      return omitted;
    }
    return name;
  });
  if (!hasSequentialScript(packageJson)) {
    names = sortScriptNames(names);
  }
  names = names.flatMap(
    (key) => prefixable.has(key) ? [`pre${key}`, key, `post${key}`] : [key]
  );
  return sortObjectByKeyNameList(scripts, names);
});
var sortConditions = (conditions) => {
  const { defaultConditions = [], restConditions = [] } = objectGroupBy(
    conditions,
    (condition) => {
      if (condition === "default") {
        return "defaultConditions";
      }
      return "restConditions";
    }
  );
  return [...restConditions, ...defaultConditions];
};
var sortExports = onObject((exports2) => {
  const { paths = [], conditions = [] } = objectGroupBy(
    Object.keys(exports2),
    (key) => key.startsWith(".") ? "paths" : "conditions"
  );
  return Object.fromEntries(
    [...paths, ...sortConditions(conditions)].map((key) => [
      key,
      sortExports(exports2[key])
    ])
  );
});
var fields = [
  { key: "$schema" },
  { key: "name" },
  /* vscode */
  { key: "displayName" },
  { key: "version" },
  /* yarn */
  { key: "stableVersion" },
  { key: "private" },
  { key: "description" },
  /* vscode */
  { key: "categories", over: uniq },
  { key: "keywords", over: uniq },
  { key: "homepage" },
  { key: "bugs", over: sortObjectBy(["url", "email"]) },
  { key: "repository", over: sortURLObject },
  { key: "funding", over: sortURLObject },
  { key: "license", over: sortURLObject },
  /* vscode */
  { key: "qna" },
  { key: "author", over: sortPeopleObject },
  {
    key: "maintainers",
    over: onArray((maintainers) => maintainers.map(sortPeopleObject))
  },
  {
    key: "contributors",
    over: onArray((contributors) => contributors.map(sortPeopleObject))
  },
  /* vscode */
  { key: "publisher" },
  { key: "sideEffects" },
  { key: "type" },
  { key: "imports" },
  { key: "exports", over: sortExports },
  { key: "main" },
  { key: "svelte" },
  { key: "umd:main" },
  { key: "jsdelivr" },
  { key: "unpkg" },
  { key: "module" },
  { key: "source" },
  { key: "jsnext:main" },
  { key: "browser" },
  { key: "react-native" },
  { key: "types" },
  { key: "typesVersions" },
  { key: "typings" },
  { key: "style" },
  { key: "example" },
  { key: "examplestyle" },
  { key: "assets" },
  { key: "bin", over: sortObject },
  { key: "man" },
  { key: "directories", over: sortDirectories },
  { key: "files", over: uniq },
  { key: "workspaces", over: sortWorkspaces },
  // node-pre-gyp https://www.npmjs.com/package/node-pre-gyp#1-add-new-entries-to-your-packagejson
  {
    key: "binary",
    over: sortObjectBy([
      "module_name",
      "module_path",
      "remote_path",
      "package_name",
      "host"
    ])
  },
  { key: "scripts", over: sortScripts },
  { key: "betterScripts", over: sortScripts },
  { key: "wireit", over: sortWireit },
  /* vscode */
  { key: "l10n" },
  /* vscode */
  { key: "contributes", over: sortObject },
  /* vscode */
  { key: "activationEvents", over: uniq },
  { key: "husky", over: overProperty("hooks", sortGitHooks) },
  { key: "simple-git-hooks", over: sortGitHooks },
  { key: "pre-commit" },
  { key: "commitlint", over: sortObject },
  { key: "lint-staged" },
  { key: "nano-staged" },
  { key: "config", over: sortObject },
  { key: "nodemonConfig", over: sortObject },
  { key: "browserify", over: sortObject },
  { key: "babel", over: sortObject },
  { key: "browserslist" },
  { key: "xo", over: sortObject },
  { key: "prettier", over: sortPrettierConfig },
  { key: "eslintConfig", over: sortEslintConfig },
  { key: "eslintIgnore" },
  { key: "npmpkgjsonlint", over: sortObject },
  { key: "npmPackageJsonLintConfig", over: sortObject },
  { key: "npmpackagejsonlint", over: sortObject },
  { key: "release", over: sortObject },
  { key: "remarkConfig", over: sortObject },
  { key: "stylelint" },
  { key: "ava", over: sortObject },
  { key: "jest", over: sortObject },
  { key: "jest-junit", over: sortObject },
  { key: "jest-stare", over: sortObject },
  { key: "mocha", over: sortObject },
  { key: "nyc", over: sortObject },
  { key: "c8", over: sortObject },
  { key: "tap", over: sortObject },
  { key: "oclif", over: sortObjectBy(void 0, true) },
  { key: "resolutions", over: sortObject },
  { key: "overrides", over: sortDependencies },
  { key: "dependencies", over: sortDependencies },
  { key: "devDependencies", over: sortDependencies },
  { key: "dependenciesMeta", over: sortObjectBy(sortObjectByIdent, true) },
  { key: "peerDependencies", over: sortDependencies },
  // TODO: only sort depth = 2
  { key: "peerDependenciesMeta", over: sortObjectBy(void 0, true) },
  { key: "optionalDependencies", over: sortDependencies },
  { key: "bundledDependencies", over: uniqAndSortArray },
  { key: "bundleDependencies", over: uniqAndSortArray },
  /* vscode */
  { key: "extensionPack", over: uniqAndSortArray },
  /* vscode */
  { key: "extensionDependencies", over: uniqAndSortArray },
  { key: "flat" },
  { key: "packageManager" },
  { key: "engines", over: sortObject },
  { key: "engineStrict", over: sortObject },
  { key: "devEngines", over: sortDevEngines },
  { key: "volta", over: sortVolta },
  { key: "languageName" },
  { key: "os" },
  { key: "cpu" },
  { key: "preferGlobal", over: sortObject },
  { key: "publishConfig", over: sortObject },
  /* vscode */
  { key: "icon" },
  /* vscode */
  {
    key: "badges",
    over: onArray((badge) => badge.map(sortVSCodeBadgeObject))
  },
  /* vscode */
  { key: "galleryBanner", over: sortObject },
  /* vscode */
  { key: "preview" },
  /* vscode */
  { key: "markdown" },
  { key: "pnpm", over: sortPnpmConfig }
];
var defaultSortOrder = fields.map(({ key }) => key);
var overFields = pipe(
  fields.map(({ key, over }) => over ? overProperty(key, over) : void 0).filter(Boolean)
);
function editStringJSON(json, over) {
  if (typeof json === "string") {
    const { indent, type } = detectIndent(json);
    const endCharacters = json.slice(-1) === "\n" ? "\n" : "";
    const newline = detectNewlineGraceful(json);
    json = JSON.parse(json);
    let result = JSON.stringify(over(json), null, type === "tab" ? "	" : indent) + endCharacters;
    if (newline === "\r\n") {
      result = result.replace(/\n/g, newline);
    }
    return result;
  }
  return over(json);
}
function sortPackageJson(jsonIsh, options = {}) {
  return editStringJSON(
    jsonIsh,
    onObject((json) => {
      let sortOrder = options.sortOrder || defaultSortOrder;
      if (Array.isArray(sortOrder)) {
        const keys = Object.keys(json);
        const { privateKeys = [], publicKeys = [] } = objectGroupBy(
          keys,
          (key) => key[0] === "_" ? "privateKeys" : "publicKeys"
        );
        sortOrder = [
          ...sortOrder,
          ...defaultSortOrder,
          ...publicKeys.sort(),
          ...privateKeys.sort()
        ];
      }
      return overFields(sortObjectByKeyNameList(json, sortOrder), json);
    })
  );
}
var index_default = sortPackageJson;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sortOrder,
  sortPackageJson
});
