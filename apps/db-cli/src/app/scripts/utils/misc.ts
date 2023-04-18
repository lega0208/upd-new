export const startTimer = (label1: string) => {
  const start = Date.now();

  return (label2?: string) => {
    const end = Date.now();
    console.log(
      `${label1} ${label2 || ''}: ${((end - start) / 1000).toFixed(2)}s`
    );
  };
};
