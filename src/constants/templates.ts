// This file defines predefined templates for nested files.
// Please, feel free to contribute more templates as needed.
// The available placeholders are defined in FileTemplatePlaceholders type.
// Please include the header comments in each template :)

const jestTemplate = `
// Test file for {{fileName}}
// Created using https://github.com/Naamloos/nested_file_toolkit

describe('{{name}}', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
`;

const typescriptTypeTemplate = `
// Type definitions for {{fileName}}
// Created using https://github.com/Naamloos/nested_file_toolkit

export type {{name}} = {
  // Define the properties of {{name}} here
};
`;

export default {
  '*.spec.ts': jestTemplate,
  '*.spec.js': jestTemplate,
  '*.test.ts': jestTemplate,
  '*.test.js': jestTemplate,
  '*.d.ts': typescriptTypeTemplate,
  '*.types.ts': typescriptTypeTemplate,
};