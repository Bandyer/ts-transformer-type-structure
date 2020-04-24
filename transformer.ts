import * as ts from 'typescript';
import {SyntaxKind, TypeChecker, UnionOrIntersectionTypeNode} from 'typescript';
import * as path from 'path';
import {getFunctions} from "./funs-transformer"
import {getKeys} from "./keys-transformer";
import {isDeepStrictEqual} from "util";

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) => visitNodeAndChildren(file, program, context);
}

function visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node | undefined;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node | undefined {
  return ts.visitEachChild(visitNode(node, program), childNode => visitNodeAndChildren(childNode, program, context), context);
}

function visitNode(node: ts.SourceFile, program: ts.Program): ts.SourceFile;
function visitNode(node: ts.Node, program: ts.Program): ts.Node | undefined;
function visitNode(node: ts.Node, program: ts.Program): ts.Node | undefined {
  if (isKeysImportExpression(node)) return;
  if (!ts.isCallExpression(node)) return node;

  const typeChecker = program.getTypeChecker();

  const isKeys = isKeysCallExpression(node, typeChecker);
  const isFunctions = isFunctionsCallExpression(node, typeChecker);

  if (!isKeys && !isFunctions) return node;

  if (!node.typeArguments) return ts.createArrayLiteral([]);

  var type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);

  var properties = typeChecker.getPropertiesOfType(type);

  if (!!properties && properties.length == 0) {
    // this can happen if the type provided is in union or intersection with 'any'
    if (!isUnionOrIntersectionExpression(node.typeArguments[0], true)) return ts.createArrayLiteral([]);
    properties = getSubProperties(typeChecker, node.typeArguments[0], node.typeArguments[0].kind);
    if (isKeys) return getKeys(properties);
    else return getFunctions(properties);
  }

  if (isKeys) return getKeys(properties);
  else {
    if (isUnionOrIntersectionExpression(node.typeArguments[0], false))
      properties = getSubProperties(typeChecker, node.typeArguments[0], node.typeArguments[0].kind);
    return getFunctions(properties);
  }
}

function getUniqueElements(input: Array<ts.Symbol>): Array<ts.Symbol> {
  return input.reduce((accumulator: ts.Symbol[], item: ts.Symbol) => {

    if (accumulator.findIndex((it) => it.name == item.name) == -1) {
      accumulator.push(item);
    }

    return accumulator;
  }, []);
}

function getCommonElements(input: Array<ts.Symbol>): Array<ts.Symbol> {
  const map = new Map<string, ts.Symbol>();
  const commonMap = new Map<string, ts.Symbol>();

  input.forEach((fun) => {
    const previous = map.get(fun.name);
    if (!!previous && isDeepStrictEqual(previous.name, fun.name)) {
      commonMap.set(fun.name, fun);
    }
    map.set(fun.name, fun)
  });

  return Array.from(commonMap.values());
}

function getSubProperties(typeChecker: TypeChecker, node: ts.TypeNode, kind: ts.SyntaxKind): ts.Symbol[] {
  if (node.kind == SyntaxKind.AnyKeyword) return [];
  if (!isUnionOrIntersectionExpression(node, false)) {
    return typeChecker.getPropertiesOfType(typeChecker.getTypeFromTypeNode(node));
  }

  var props: ts.Symbol[] = [];
  var countReferenceTypes = 0;

  node.types.forEach((n) => {
    if (n.kind != SyntaxKind.AnyKeyword && n.kind != ts.SyntaxKind.IntersectionType && n.kind != ts.SyntaxKind.UnionType) countReferenceTypes += 1;
    getSubProperties(typeChecker, n, kind).forEach((i) => props.push(i));
  });

  if (kind == ts.SyntaxKind.UnionType && countReferenceTypes > 1) return getCommonElements(props);
  else if (kind == ts.SyntaxKind.IntersectionType && countReferenceTypes > 1) return getUniqueElements(props);

  return props;
}


function isUnionOrIntersectionExpression(argument: ts.TypeNode, checkForAnyKeyword: boolean): argument is ts.UnionOrIntersectionTypeNode {
  const types = (argument as UnionOrIntersectionTypeNode).types;
  return !!types ? checkForAnyKeyword ? types.some((it) => it.kind == SyntaxKind.AnyKeyword) : true : false;
}

const indexJs = path.join(__dirname, 'index.js');

function isKeysImportExpression(node: ts.Node): node is ts.ImportDeclaration {
  if (!ts.isImportDeclaration(node)) {
    return false;
  }
  const module = (node.moduleSpecifier as ts.StringLiteral).text;
  try {
    return indexJs === (
      module.startsWith('.')
        ? require.resolve(path.resolve(path.dirname(node.getSourceFile().fileName), module))
        : require.resolve(module)
    );
  } catch (e) {
    return false;
  }
}

const indexTs = path.join(__dirname, 'index.d.ts');

function isKeysCallExpression(node: ts.CallExpression, typeChecker: ts.TypeChecker): node is ts.CallExpression {
  return isCallExpression(node, typeChecker, 'keys');
}

function isFunctionsCallExpression(node: ts.CallExpression, typeChecker: ts.TypeChecker): node is ts.CallExpression {
  return isCallExpression(node, typeChecker, 'funs');
}

function isCallExpression(node: ts.CallExpression, typeChecker: ts.TypeChecker, keyword: string): node is ts.CallExpression {
  const signature = typeChecker.getResolvedSignature(node);
  if (typeof signature === 'undefined') return false;

  const {declaration} = signature;
  return !!declaration
    && !ts.isJSDocSignature(declaration)
    && (path.join(declaration.getSourceFile().fileName) === indexTs)
    && !!declaration.name
    && declaration.name.getText() === keyword;
}
