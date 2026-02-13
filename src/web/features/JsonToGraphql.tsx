import { useCallback } from "react";
import ConversionWrapper from "../components/ConversionWrapper";
import { jsonToGraphQLSchema } from "../utils/jsonToGraphql";

const DEFAULT = `
{
  "name": "Okoro Patience",
  "department": "SLT"
}
`;

export default function JsonToGraphql() {
  const transformer = useCallback(async ({ value }: { value: string }) => {
    return jsonToGraphQLSchema(value);
  }, []);

  return (
    <ConversionWrapper
      transformer={transformer}
      title="JSON to graphql"
      language="json"
      resultTitle="GraphQL"
      resultLanguage={"graphql"}
      defaultValue={DEFAULT.trim()}
    />
  );
}
