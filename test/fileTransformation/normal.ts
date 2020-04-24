import {funs, keys} from '../../index';

keys();

interface Foo {
  foo: string;
  fooFunc():void;
}
const fooKeys = keys<Foo>();
const fooFuns = funs<Foo>();
console.log(fooKeys[0]);

type FooBar = Foo & { bar: number; };
keys<FooBar>()[1];
type FooBarBaz = FooBar | { bar: Function; baz: Date; };
const fooBarBazKeys = keys<FooBarBaz>();
fooBarBazKeys.forEach(key => console.log(key));

keys.toString();

class MyClass<T extends object> {
  keys() {
    return keys<T>();
  }
}
