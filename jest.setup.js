// Jest setup file for enhanced proof assistant tests

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock performance.now for consistent timing in tests
global.performance = {
  now: jest.fn(() => Date.now())
};

// Mock Math.random for deterministic tests
const mockMath = Object.create(global.Math);
mockMath.random = jest.fn(() => 0.5);
global.Math = mockMath;

// Mock setTimeout and setInterval for faster tests
jest.useFakeTimers();

// Setup test environment
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset Math.random to return 0.5
  Math.random.mockReturnValue(0.5);
  
  // Reset performance.now
  performance.now.mockReturnValue(Date.now());
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllTimers();
});

// Global test utilities
global.testUtils = {
  // Helper to create mock verification requests
  createMockVerificationRequest: (overrides = {}) => ({
    hypothesis: 'Test hypothesis',
    ingredients: [
      {
        id: 'test_ingredient',
        label: 'Test Ingredient',
        inci_name: 'Test INCI',
        category: 'active',
        molecular_weight: 300,
        safety_rating: 'safe'
      }
    ],
    targetEffects: [],
    constraints: [],
    skinModel: {
      layers: [
        {
          id: 'test_layer',
          name: 'Test Layer',
          depth: 50,
          cellTypes: ['test_cells'],
          permeability: 0.5,
          ph: 7.0,
          functions: ['test_function']
        }
      ],
      barriers: [],
      transport: []
    },
    ...overrides
  }),

  // Helper to wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock tensor data
  createMockTensor: (shape, fillValue = 0.5) => ({
    shape,
    data: new Float32Array(shape.reduce((a, b) => a * b, 1)).fill(fillValue),
    dtype: 'float32'
  })
};
