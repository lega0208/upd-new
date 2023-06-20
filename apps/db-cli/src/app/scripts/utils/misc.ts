import { ModuleRef } from '@nestjs/core';
import type { Type } from '@nestjs/common';
import { RunScriptCommand } from '../../run-script.command';

export const startTimer = (label1: string) => {
  const start = Date.now();

  return (label2?: string) => {
    const end = Date.now();
    console.log(
      `${label1} ${label2 || ''}: ${((end - start) / 1000).toFixed(2)}s`
    );
  };
};

function getModuleRef<T extends { moduleRef: ModuleRef }>(_this: T): ModuleRef {
  if (!_this) {
    throw new Error('Must be called with `this` bound to a context');
  }

  if (!_this.moduleRef) {
    throw new Error('`this` must have a `moduleRef` property');
  }

  return (<T>_this).moduleRef;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type TypeOrToken = string | symbol | Function | Type;

export function inject<T extends TypeOrToken, U = T extends string ? never : T>(
  this: ThisType<typeof RunScriptCommand> & { moduleRef: ModuleRef },
  typeOrToken: T
): U {
  return getModuleRef(this).get(typeOrToken, { strict: false });
}
