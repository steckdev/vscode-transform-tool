const toml = require("smol-toml");
const yaml = require("yaml");
const JsonToTS = require("json-to-ts");
const { jsonToZod } = require("json-to-zod");
const gs = require("generate-schema");

const tomlParse = toml.parse;
const tomlStringify = toml.stringify;

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

const getGraphQLType = (value: any): string => {
  if (value === null) {return 'String';}
  if (Array.isArray(value)) {
    if (value.length === 0) {return '[String]';}
    return `[${getGraphQLType(value[0])}]`;
  }
  if (typeof value === 'object') {return 'Object';}
  if (typeof value === 'string') {return 'String';}
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Int' : 'Float';
  }
  if (typeof value === 'boolean') {return 'Boolean';}
  return 'String';
};

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const generateGraphQLSchema = (obj: any, typeName: string = 'RootType'): string => {
  const types: string[] = [];
  const processedTypes = new Set<string>();

  const processObject = (data: any, _currentTypeName: string): string[] => {
    const fields: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value === null) {
        fields.push(`  ${key}: String`);
      } else if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          const nestedTypeName = capitalizeFirstLetter(key);
          if (!processedTypes.has(nestedTypeName)) {
            processedTypes.add(nestedTypeName);
            const nestedFields = processObject(value[0], nestedTypeName);
            types.push(`type ${nestedTypeName} {\n${nestedFields.join('\n')}\n}`);
          }
          fields.push(`  ${key}: [${nestedTypeName}]`);
        } else {
          const elementType = value.length > 0 ? getGraphQLType(value[0]) : 'String';
          fields.push(`  ${key}: [${elementType}]`);
        }
      } else if (typeof value === 'object') {
        const nestedTypeName = capitalizeFirstLetter(key);
        if (!processedTypes.has(nestedTypeName)) {
          processedTypes.add(nestedTypeName);
          const nestedFields = processObject(value, nestedTypeName);
          types.push(`type ${nestedTypeName} {\n${nestedFields.join('\n')}\n}`);
        }
        fields.push(`  ${key}: ${nestedTypeName}`);
      } else {
        const fieldType = getGraphQLType(value);
        fields.push(`  ${key}: ${fieldType}`);
      }
    }

    return fields;
  };

  const rootFields = processObject(obj, typeName);
  const rootType = `type ${typeName} {\n${rootFields.join('\n')}\n}`;

  return [rootType, ...types].join('\n\n');
};

const jsonToGraphQLSchema = (jsonString: string): string => {
  const parsed = JSON.parse(jsonString);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Input must be a JSON object');
  }
  return generateGraphQLSchema(parsed);
};

export const transformers: Record<string, (input: string) => string> = {
  json_to_typescript: (input: string) => {
    try {
      let result = "";
      JsonToTS(JSON.parse(input)).forEach((typeInterface: string) => {
        result += `${typeInterface}\n`;
      });
      return result;
    } catch (error) {
      throw new Error(`Invalid JSON input. Expected valid JSON like: {"name": "John", "age": 30}`);
    }
  },

  json_to_zod: (input: string) => {
    try {
      return jsonToZod(JSON.parse(input));
    } catch (error) {
      throw new Error(`Invalid JSON input. Expected valid JSON like: {"name": "John", "age": 30}`);
    }
  },

  json_to_graphql: (input: string) => {
    try {
      return jsonToGraphQLSchema(input);
    } catch (error) {
      throw new Error(`Invalid JSON input. Expected a valid JSON object like: {"user": {"name": "John"}}`);
    }
  },

  json_to_mysql: (input: string) => {
    try {
      return gs.mysql(JSON.parse(input));
    } catch (error) {
      throw new Error(`Invalid JSON input. Expected valid JSON like: {"id": 1, "name": "John"}`);
    }
  },

  json_to_mongoose: (input: string) => {
    try {
      return JSON.stringify(gs.mongoose(JSON.parse(input)), null, 2);
    } catch (error) {
      throw new Error(`Invalid JSON input. Expected valid JSON like: {"name": "John", "age": 30}`);
    }
  },

  js_object_to_json: (input: string) => {
    const parsed = safeParseJavaScriptObject(input);
    return JSON.stringify(parsed, null, 2);
  },

  js_object_to_typescript: (input: string) => {
    const parsed = safeParseJavaScriptObject(input);
    const jsonString = JSON.stringify(parsed, null, 2);
    let result = "";
    JsonToTS(JSON.parse(jsonString)).forEach((typeInterface: string) => {
      result += `${typeInterface}\n`;
    });
    return result;
  },

  yaml_to_json: (input: string) => {
    try {
      return JSON.stringify(yaml.parse(input), null, 2);
    } catch (error) {
      throw new Error(`Invalid YAML input. Expected valid YAML like:\nname: John\nage: 30`);
    }
  },

  yaml_to_toml: (input: string) => {
    try {
      return tomlStringify(yaml.parse(input));
    } catch (error) {
      throw new Error(`Invalid YAML input. Expected valid YAML like:\nname: John\nage: 30`);
    }
  },

  toml_to_yamal: (input: string) => {
    try {
      return yaml.stringify(tomlParse(input));
    } catch (error) {
      throw new Error(`Invalid TOML input. Expected valid TOML like:\nname = "John"\nage = 30`);
    }
  },

  toml_to_json: (input: string) => {
    try {
      return JSON.stringify(tomlParse(input), null, 2);
    } catch (error) {
      throw new Error(`Invalid TOML input. Expected valid TOML like:\nname = "John"\nage = 30`);
    }
  },
};

