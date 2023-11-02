import { mergeConfig } from 'vite';

export const normalizePath = (path: string) => path.replace(/\\/g, '/');
export const usePluginConfig = async (plugin, config, env) => {
  let cc = config;
  for (const p of [plugin].flat()) {
    if (p.config) {
      const ret = await p.config(cc, env);
      if (ret) {
        cc = mergeConfig(cc, ret);
      }
    }
  }

  return cc;
};
export const usePluginTransform = async ({ plugin, code, id, ctx }) => {
  let cc = { code };
  let prev = cc;
  for (const p of [plugin].flat()) {
    if (p.transform) {
      prev = cc;

      cc = await p.transform.call(ctx, cc.code, id);
      cc ??= prev;
    }
  }
  return cc;
};

export const usePluginHandleHotUpdate = async ({ plugin, ctx }) => {
  const mods: any[] = [];

  for (const p of [plugin].flat()) {
    if (p.handleHotUpdate) {
      //@ts-ignore
      const result = await p.handleHotUpdate(ctx);
      if (Array.isArray(result)) {
        mods.push(...result);
      }
    }
  }

  return mods;
};
export const usePluginBuildStart = async ({ plugin, options }) => {
  for (const p of [plugin].flat()) {
    if (p.buildStart) {
      //@ts-ignore
      await p.buildStart(options);
    }
  }
};
export const usePluginConfigureServer = async ({ plugin, server }) => {
  for (const p of [plugin].flat()) {
    if (p.configureServer) {
      //@ts-ignore
      await p.configureServer(server);
    }
  }
};

const isObject = (val: unknown) =>
  Object.prototype.toString.call(val).slice(8, -1) === 'Object';

export function clone(input: any) {
  const output = Array.isArray(input) ? Array(input.length) : {};

  if (input?.getTime) return new Date(input.getTime());

  for (const key in input) {
    const val = input[key];

    output[key] = typeof val === 'object' && val !== null ? clone(val) : val;
  }

  return output;
}

export function mergeDeep<Output = unknown>(
  target: object,
  source: object,
): Output {
  const output = clone(target) as Output;

  for (const key of Object.keys(source)) {
    if (isObject(source[key]) && isObject(target[key])) {
      output[key] = mergeDeep(target[key], source[key]);
      continue;
    }

    output[key] = source[key];
  }

  return output;
}
