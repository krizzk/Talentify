// This file sets up MSW for browser testing
// Call this in your test setup or before running tests

if (typeof window !== 'undefined') {
  const { worker } = require('./browser');
  worker.start();
}

export {};
