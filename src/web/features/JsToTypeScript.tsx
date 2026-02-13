import JsonToTS from "json-to-ts";
import { useCallback } from "react";
import ConversionWrapper from "../components/ConversionWrapper";

const DEFAULT = "{chima: [1,2,3]}";

const safeParseJavaScriptObject = (input: string): unknown => {
  const trimmed = input.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const jsonString = trimmed
      .replace(/(\w+):/g, '"$1":')
      .replace(/'/g, '"');

    try {
      return JSON.parse(jsonString);
    } catch {
      throw new Error('Invalid JavaScript object syntax. Please use valid JSON-like syntax.');
    }
  }

  throw new Error('Input must be a JavaScript object literal (enclosed in {})');
};

export default function JsObjectToTypescript() {
  const name = "JS Object to Typescript";

  const transformer = useCallback(async ({ value }: { value: string }) => {
    const parsed = safeParseJavaScriptObject(value);
    const result = JSON.stringify(parsed, null, 2);

    let stringResult = "";
    JsonToTS(JSON.parse(result)).forEach((typeInterface) => {
      stringResult += `${typeInterface} \n`;
    });
    return stringResult;
  }, []);

  return (
    <ConversionWrapper
      transformer={transformer}
      title={name}
      language="javascript"
      resultTitle="TypeScript"
      resultLanguage={"typescript"}
      defaultValue={DEFAULT.trim()}
    />
  );
}
