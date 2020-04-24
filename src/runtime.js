// Collect any fragment/type references from a node, adding them to the refs Set
function collectFragmentReferences(node, refs) {
  if (node.kind === "FragmentSpread") {
    refs.add(node.name.value);
  } else if (node.kind === "VariableDefinition") {
    const type = node.type;
    if (type.kind === "NamedType") {
      refs.add(type.name.value);
    }
  }

  if (node.selectionSet) {
    node.selectionSet.selections.forEach((selection) => {
      collectFragmentReferences(selection, refs);
    });
  }

  if (node.variableDefinitions) {
    node.variableDefinitions.forEach((def) => {
      collectFragmentReferences(def, refs);
    });
  }

  if (node.definitions) {
    node.definitions.forEach((def) => {
      collectFragmentReferences(def, refs);
    });
  }
}

function findOperation(doc, name) {
  return doc.definitions.find(
    (element) => element.name && element.name.value == name
  );
}

function extractReferences(doc) {
  const definitionRefs = {};
  doc.definitions.forEach((def) => {
    if (def.name) {
      const refs = new Set();
      collectFragmentReferences(def, refs);
      definitionRefs[def.name.value] = refs;
    }
  });
  return definitionRefs;
}

function oneQuery(doc, operationName) {
  // Copy the DocumentNode, but clear out the definitions
  const newDoc = {
    kind: doc.kind,
    definitions: [findOperation(doc, operationName)],
  };
  if (doc.hasOwnProperty("loc")) {
    newDoc.loc = doc.loc;
  }

  const definitionRefs = extractReferences(doc);

  // Now, for the operation we're running, find any fragments referenced by
  // it or the fragments it references
  const opRefs = definitionRefs[operationName] || new Set();
  const allRefs = new Set();
  const newRefs = new Set();

  // IE 11 doesn't support "new Set(iterable)", so we add the members of opRefs to newRefs one by one
  opRefs.forEach((refName) => {
    newRefs.add(refName);
  });

  while (newRefs.size > 0) {
    const prevRefs = newRefs;
    newRefs = new Set();

    prevRefs.forEach((refName) => {
      if (!allRefs.has(refName)) {
        allRefs.add(refName);
        const childRefs = definitionRefs[refName] || new Set();
        childRefs.forEach((childRef) => {
          newRefs.add(childRef);
        });
      }
    });
  }

  allRefs.forEach((refName) => {
    const op = findOperation(doc, refName);
    if (op) {
      newDoc.definitions.push(op);
    }
  });

  return newDoc;
}

module.exports = {
  oneQuery,
};
