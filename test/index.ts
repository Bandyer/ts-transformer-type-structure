import {funs, keys} from '../index';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import {compile} from './compile/compile';
import * as ts from 'typescript';

describe('keys', () => {
  it('should return keys of given type', () => {
    assert.deepStrictEqual(keys(), []);
    assert.deepStrictEqual(keys<any>(), []);

    interface Foo {
      foo: string;
    }

    assert.deepStrictEqual(keys<Foo>(), ['foo']);
    type FooBar = {
      foo: string;
      bar?: number;
    };

    assert.deepStrictEqual(keys<FooBar>(), ['foo', 'bar']);

    interface BarBaz {
      bar: Function;
      baz: Date;
    }

    assert.deepStrictEqual(keys<FooBar & BarBaz>(), ['foo', 'bar', 'baz']);
    assert.deepStrictEqual(keys<FooBar | BarBaz>(), ['bar']);
    assert.deepStrictEqual(keys<FooBar & any>(), ['foo', 'bar']);
    assert.deepStrictEqual(keys<FooBar | any>(), ['foo', 'bar']);
    assert.deepStrictEqual(keys<FooBar | BarBaz | any>(), ['bar']);
  });

});

describe('functions', () => {

  interface Foo {
    ciao: string;

    foo?(a1: string, a2: boolean): void;
  }

  type FooBar = {
    bar(): boolean;
  };

  interface BarBaz {
    baz: Date;

    (): void;

    bar(): boolean;
  }

  interface BarBar {
    bar(): boolean;
  }

  interface ComplexBar {
    bar(callback: (n: number) => any): boolean;
  }

  interface Props {
    id(): string;
  }
  const keysOfProps = funs<Props>();

  it('should return empty array if no type has been specified', () => {
    assert.deepStrictEqual(funs(), []);
  });

  it("should return empty array if any type has been specified", () => {
    assert.deepStrictEqual(funs<any>(), []);
  });

  it('should return a single fun if interface contains only one function', () => {
    assert.deepStrictEqual(funs<Foo>(), [{
      args: [{
        name: 'a1',
        type: {
          kind: ts.SyntaxKind.StringKeyword,
          name: 'string'
        }
      },
        {
          name: 'a2',
          type: {
            kind: ts.SyntaxKind.BooleanKeyword,
            name: 'boolean'
          }
        }],
      isOptional: true,
      name: "foo",
      returnType: {
        kind: ts.SyntaxKind.VoidKeyword,
        name: "void"
      }
    }]);
  });

  it('should return all the functions of FooBar&Foo', () => {
    assert.deepStrictEqual(funs<FooBar & Foo>(), [
      {
        args: [],
        isOptional: false,
        name: "bar",
        returnType: {
          kind: ts.SyntaxKind.BooleanKeyword,
          name: "boolean"
        }
      },
      {
        args: [{
          name: 'a1',
          type: {
            kind: ts.SyntaxKind.StringKeyword,
            name: 'string'
          }
        },
          {
            name: 'a2',
            type: {
              kind: ts.SyntaxKind.BooleanKeyword,
              name: 'boolean'
            }
          }],
        isOptional: true,
        name: "foo",
        returnType: {
          kind: ts.SyntaxKind.VoidKeyword,
          name: "void"
        }
      }
    ]);
  });

  it('should return only the common functions between FooBar and BarBaz', () => {
    // the common functions
    assert.deepStrictEqual(funs<FooBar | BarBaz>(), [
      {
        args: [],
        isOptional: false,
        name: "bar",
        returnType: {
          kind: ts.SyntaxKind.BooleanKeyword,
          name: "boolean"
        }
      }
    ]);
  });

  it('should return all FooBar functions ignoring the any', () => {
    // all the functions of A & B
    assert.deepStrictEqual(funs<FooBar & any>(), [
      {
        args: [],
        isOptional: false,
        name: "bar",
        returnType: {
          kind: ts.SyntaxKind.BooleanKeyword,
          name: "boolean"
        }
      }
    ]);
  });

  it('should return all BarBaz functions ignoring the any', () => {
    assert.deepStrictEqual(funs<BarBaz | any>(), [
      {
        args: [],
        isOptional: false,
        name: "bar",
        returnType: {
          kind: ts.SyntaxKind.BooleanKeyword,
          name: "boolean"
        }
      }
    ]);
  });

  it('should return all functions of BarBaz&Foo&FooBar', () => {
    assert.deepStrictEqual(funs<BarBaz & Foo & FooBar>(), [
      {
        args: [],
        isOptional: false,
        name: 'bar',
        returnType: {
          kind: ts.SyntaxKind.BooleanKeyword,
          name: 'boolean'
        }
      },
      {
        args: [{
          name: 'a1',
          type: {
            kind: ts.SyntaxKind.StringKeyword,
            name: 'string'
          }
        },
          {
            name: 'a2',
            type: {
              kind: ts.SyntaxKind.BooleanKeyword,
              name: 'boolean'
            }
          }],
        isOptional: true,
        name: "foo",
        returnType: {
          kind: ts.SyntaxKind.VoidKeyword,
          name: "void"
        }
      }
    ]);
  });

  it('should return the common functions between BarBaz+Foo and FooBar', () => {
    assert.deepStrictEqual(funs<BarBaz & Foo | FooBar>(), [
      {
        args: [],
        isOptional: false,
        name: 'bar',
        returnType: {
          kind: ts.SyntaxKind.BooleanKeyword,
          name: 'boolean'
        }
      }
    ]);
  });

  it('should return the common function between BarBaz,Foo and FooBar', () => {
    assert.deepStrictEqual(funs<BarBaz | Foo | FooBar>(), []);
  });

  it('should return only Foo functions ignoring the union and intersection with any', () => {
    assert.deepStrictEqual(funs<Foo & any | any>(), [
      {
        args: [{
          name: 'a1',
          type: {
            kind: ts.SyntaxKind.StringKeyword,
            name: 'string'
          }
        },
          {
            name: 'a2',
            type: {
              kind: ts.SyntaxKind.BooleanKeyword,
              name: 'boolean'
            }
          }],
        isOptional: true,
        name: "foo",
        returnType: {
          kind: ts.SyntaxKind.VoidKeyword,
          name: "void"
        }
      }
    ]);
  });

  it('should return only Foo functions ignoring the double intersection with any', () => {
    assert.deepStrictEqual(funs<Foo | any | any>(), [
      {
        args: [{
          name: 'a1',
          type: {
            kind: ts.SyntaxKind.StringKeyword,
            name: 'string'
          }
        },
          {
            name: 'a2',
            type: {
              kind: ts.SyntaxKind.BooleanKeyword,
              name: 'boolean'
            }
          }],
        isOptional: true,
        name: "foo",
        returnType: {
          kind: ts.SyntaxKind.VoidKeyword,
          name: "void"
        }
      }
    ]);
  });
  it('should return a single function with a function as argument', () => {
    assert.deepStrictEqual(funs<ComplexBar>(), [
      {
        args: [
          {
            name: 'callback',
            type: {
              kind: 170,
              name: '(n: number) => any'
            }
          }
        ],
        isOptional: false,
        name: 'bar',
        returnType: {
          kind: 128,
          name: 'boolean'
        }
      }

    ]);
  });
});

describe('transform to ES', () => {
  it('should transform correctly', () => {
    const fileTransformationDir = path.join(__dirname, 'fileTransformation');
    fs.readdirSync(fileTransformationDir).filter((file) => path.extname(file) === '.ts').forEach(file =>
      (['ES5', 'ESNext'] as const).forEach(target =>
        it(`should transform ${file} as expected when target is ${target}`, async () => {
          let result = '';
          const fullFileName = path.join(fileTransformationDir, file),
            postCompileFullFileName = fullFileName.replace(/\.ts$/, '.js');
          compile([fullFileName], ts.ScriptTarget[target], (fileName, data) => postCompileFullFileName === path.join(fileName) && (result = data));
          assert.strictEqual(result.replace(/\r\n/g, '\n'), fs.readFileSync(fullFileName.replace(/\.ts$/, `.${target}.js`), 'utf-8'));
        }).timeout(0)
      )
    );
  });
});
