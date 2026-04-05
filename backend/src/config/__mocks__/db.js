// Mock pool for testing
export let mockQuery = async () => ({ rows: [] });

const mockPool = {
  query: (...args) => mockQuery(...args),
};

export function setMockQuery(fn) {
  mockQuery = fn;
}

export default mockPool;
