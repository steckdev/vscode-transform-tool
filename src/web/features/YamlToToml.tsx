import { stringify as tomlStringify } from "smol-toml";
import { useCallback } from "react";
import yaml from "yaml";
import ConversionWrapper from "../components/ConversionWrapper";

const DEFAULT = `spaceX: "Elon"`;
export default function YamlToToml() {
  const transformer = useCallback(async ({ value }: { value: string }) => {
    return tomlStringify(yaml.parse(value));
  }, []);

  return (
    <ConversionWrapper
      transformer={transformer}
      title="YAML to TOML"
      language="yaml"
      resultTitle="TOML"
      resultLanguage={"toml"}
      defaultValue={DEFAULT.trim()}
    />
  );
}
