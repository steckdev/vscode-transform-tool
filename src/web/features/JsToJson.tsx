import { useCallback } from "react";
import ConversionWrapper from "../components/ConversionWrapper";

const DEFAULT = "{hello: {nice: '123'}}";

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

export default function JsObjectToJson() {
  const transformer = useCallback(async ({ value }: { value: string }) => {
    const parsed = safeParseJavaScriptObject(value);
    return JSON.stringify(parsed, null, 2);
  }, []);

  return (
    <ConversionWrapper
      transformer={transformer}
      title="JS Object to Json"
      language="javascript"
      defaultValue={DEFAULT.trim()}
      resultTitle="JSON"
      resultLanguage={"json"}
    />
  );
}
