export declare function wait(ms: number): Promise<unknown>;
export declare function squishTrim(str: string | void): string | void;
export declare function LogTiming(
  message?: string
): (target: object, name: string, descriptor: PropertyDescriptor) => void;
export declare function getArraySeperated(arr: {
  data: number[];
  value: string;
}): { data: number; value: string }[][];
export declare function sortArrayDesc(
  arr: { data: number; value: string }[][]
): { data: number; value: string }[][];
