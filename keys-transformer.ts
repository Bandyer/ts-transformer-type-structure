import * as ts from 'typescript';

export function getKeys(properties: ts.Symbol[]): ts.Node {
  return ts.createArrayLiteral(properties.map((it) => ts.createLiteral(it.name)));
}
