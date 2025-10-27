type FileTemplatePlaceholders = {
  /**
   * The name of the original file without extension.
   */
  name: string;

  /**
   * The full filename of the original file including extension.
   */
  fileName: string;

  /**
   * The captured value from the wildcard in the pattern.
   */
  capture: string;

  /**
   * The filename of the test file associated with the created nested file.
   */
  nestedFileName: string;

  /**
   * The name of the test file without extension.
   */
  nestedName: string;

  /**
   * The date when the file is created.
   */
  date: Date;
}