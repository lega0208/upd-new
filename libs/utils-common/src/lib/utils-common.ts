// Utility function for to help with rate-limiting within async functions
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Used for measuring function execution time
//  -credit: https://leefreeman.xyz/2020/05/08/typescript-decorators/
export function LogTiming(message = '') {
  return function (
    target: object,
    name: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    descriptor.value = async function () {
      const startTime = new Date(Date.now());
      await method.apply(this);
      const endTime = new Date(Date.now());
      console.log(
        `${message || name} took ${
          endTime.getTime() - startTime.getTime()
        }ms to complete.`
      );
    };
  };
}
