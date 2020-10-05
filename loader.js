"use strict";

const os = require("os");
const gql = require("./src");

// Takes `source` (the source GraphQL query string)
// and `doc` (the parsed GraphQL document) and tacks on
// the imported definitions.
function expandImports(source, doc) {
  const lines = source.split(/\r\n|\r|\n/);
  let outputCode = `
    const names = new Set();
  `;

  lines.some((line) => {
    if (line[0] === "#" && line.slice(1).split(" ")[0] === "import") {
      const importFile = line.slice(1).split(" ")[1];
      const parseDocument = `require(${importFile})`;
      const appendDef = `doc.definitions = doc.definitions.concat(
        runtime.unique(${parseDocument}.definitions, names)
      );`;
      outputCode += appendDef + os.EOL;
    }
    return line.length !== 0 && line[0] !== "#";
  });

  return outputCode;
}

module.exports = function (source) {
  this.cacheable();
  const doc = gql`${source}`;
  let headerCode = `
    var runtime = require('@zendesk/graphql-tag/lib/runtime');
    var doc = ${JSON.stringify(doc)};
    doc.loc.source = ${JSON.stringify(doc.loc.source)};
  `;

  let outputCode = `module.exports = doc;`;

  // Allow multiple query/mutation definitions in a file. This parses out dependencies
  // at compile time, and then uses those at load time to create minimal query documents
  // We cannot do the latter at compile time due to how the #import code works.
  const operationDefinitions = doc.definitions.filter(
    (op) => op.kind === "OperationDefinition"
  );
  for (const op of operationDefinitions) {
    if (!op.name) {
      if (operationDefinitions.length > 1) {
        throw "Query/mutation names are required for a document with multiple definitions";
      } else {
        continue;
      }
    }

    const opName = op.name.value;
    outputCode += `
      module.exports["${opName}"] = runtime.oneQuery(doc, "${opName}");
    `;
  }

  const importOutputCode = expandImports(source, doc);
  const allCode =
    headerCode + os.EOL + importOutputCode + os.EOL + outputCode + os.EOL;
    console.log(allCode)
  return allCode;
};
