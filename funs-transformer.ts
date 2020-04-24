import * as ts from 'typescript';
import {Expression, MethodDeclaration, SyntaxKind} from 'typescript';
import {Val, Fun} from "./index";

export function getFunctions(properties: ts.Symbol[]): ts.Node {

  var funs: Fun[] = [];
  properties.forEach((property) => {

    if (property.declarations == undefined || property.declarations.length == 0) return;

    const declarations = property.declarations.filter((d) => d.kind == SyntaxKind.MethodSignature) as MethodDeclaration[];

    if (declarations == undefined || declarations.length == 0) return;

    declarations.forEach((declaration) => {
      const args = declaration.parameters.map(param => {
        const arg = <Val>{name: param.name.getText()};
        if (!!param.type) arg.type = {name: param.type.getText(), kind: param.type.kind};
        return arg;
      });

      const fun: Fun = {
        name: property.name,
        args: args,
        isOptional: !!declaration.questionToken
      };

      if (!!declaration.type) fun.returnType = {name: declaration.type.getText(), kind: declaration.type.kind};
      funs.push(fun);
    });
  });

  return ts.createArrayLiteral(mapFunToExpression(funs));
}

function mapArgsToExpression(array: Array<Val>): Array<Expression> {
  return array.map((it) => {
    const arg = [];
    if (it.name) {
      arg.push(ts.createPropertyAssignment("name", ts.createLiteral(it.name)));
    }

    if (it.type) {
      arg.push(ts.createPropertyAssignment("type", ts.createObjectLiteral([
        ts.createPropertyAssignment("name", ts.createLiteral(it.type.name)),
        ts.createPropertyAssignment("kind", ts.createLiteral(it.type.kind))
      ])));
    }

    return ts.createObjectLiteral(arg);
  });
}

function mapFunToExpression(array: Array<Fun>): Array<Expression> {
  return array.map((fun) => {
    const funcProperties = [];
    funcProperties.push(ts.createPropertyAssignment("name", ts.createLiteral(fun.name)));
    funcProperties.push(ts.createPropertyAssignment("args", ts.createArrayLiteral(mapArgsToExpression(fun.args))));
    if (fun.returnType) {
      funcProperties.push(ts.createPropertyAssignment("returnType", ts.createObjectLiteral([
        ts.createPropertyAssignment("name", ts.createLiteral(fun.returnType.name)),
        ts.createPropertyAssignment("kind", ts.createLiteral(fun.returnType.kind))
      ])));
    }
    funcProperties.push(ts.createPropertyAssignment("isOptional", ts.createLiteral(fun.isOptional)));
    return ts.createObjectLiteral(funcProperties)
  });
}
