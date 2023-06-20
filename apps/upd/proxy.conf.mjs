export default {
  '/api': {
    target: `http://localhost:${process.env['PORT'] || 9000}`,
    secure: false,
  },
};
