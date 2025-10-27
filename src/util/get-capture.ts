import { globToRegex } from "./glob-to-regex";

export const getCapture = (fileName: string, pattern: string): string => {
  const regex = globToRegex(pattern);
  const match = fileName.match(regex);
  if(match && match[1]) {
    return match[1];
  }
  return fileName.replace(/\.[^/.]+$/, '');
};