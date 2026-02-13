import * as vscode from "vscode";
import { isToolString } from "./helpers";
import { textSelectionHandler } from "./selectTextProcessor";
import { OptionsProvider } from "./treeProvider";
import { toolArgs } from "./web/types";
import { transformers } from "./transformers";

const LANGUAGE_MAP: Record<string, string> = {
  json_to_typescript: "typescript",
  json_to_zod: "typescript",
  json_to_graphql: "graphql",
  json_to_mysql: "sql",
  json_to_mongoose: "json",
  js_object_to_json: "json",
  js_object_to_typescript: "typescript",
  yaml_to_json: "json",
  yaml_to_toml: "toml",
  toml_to_yamal: "yaml",
  toml_to_json: "json",
};

async function transformAndCreateDocument(tool: toolArgs, content: string) {
  try {
    const transformer = transformers[tool];
    if (!transformer) {
      vscode.window.showErrorMessage(`Unknown transformation: ${tool}`);
      return;
    }

    const result = transformer(content);
    const language = LANGUAGE_MAP[tool] || "plaintext";

    const doc = await vscode.workspace.openTextDocument({
      content: result,
      language,
    });

    await vscode.window.showTextDocument(doc, {
      viewColumn: vscode.ViewColumn.Beside,
      preview: false,
    });
  } catch (error) {
    vscode.window.showErrorMessage(
      `Transformation failed: ${(error as Error).message}`
    );
  }
}

async function getContentToTransform(): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor!");
    return undefined;
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  if (selectedText && !selection.isEmpty) {
    return selectedText;
  }

  const document = editor.document;
  const text = document.getText();

  if (!text.trim()) {
    vscode.window.showWarningMessage("No content to transform!");
    return undefined;
  }

  return text;
}

async function runTransformation(tool: toolArgs) {
  const content = await getContentToTransform();
  if (content) {
    await transformAndCreateDocument(tool, content);
  }
}

export function activate(context: vscode.ExtensionContext) {
  let tool: toolArgs = "json_to_typescript";

  vscode.window.createTreeView("transform-tool-tree", {
    treeDataProvider: new OptionsProvider(),
  });

  const disposable = vscode.commands.registerCommand(
    "transform.start",
    async (args) => {
      const [type, content] = args?.arguments ?? [];
      tool = isToolString(type ?? "") ? type : tool;

      if (content) {
        await transformAndCreateDocument(tool, content);
      } else {
        await runTransformation(tool);
      }
    }
  );

  const disposableProcessSelected = vscode.commands.registerCommand(
    "transform-tools.processSelectedText",
    textSelectionHandler
  );

  const commandMappings: Array<[string, toolArgs]> = [
    ["transform-tools.jsonToTypeScript", "json_to_typescript"],
    ["transform-tools.jsonToZod", "json_to_zod"],
    ["transform-tools.jsonToGraphQL", "json_to_graphql"],
    ["transform-tools.jsonToMySQL", "json_to_mysql"],
    ["transform-tools.jsonToMongoose", "json_to_mongoose"],
    ["transform-tools.jsObjectToJson", "js_object_to_json"],
    ["transform-tools.jsObjectToTypeScript", "js_object_to_typescript"],
    ["transform-tools.yamlToJson", "yaml_to_json"],
    ["transform-tools.yamlToToml", "yaml_to_toml"],
    ["transform-tools.tomlToYaml", "toml_to_yamal"],
    ["transform-tools.tomlToJson", "toml_to_json"],
  ];

  commandMappings.forEach(([commandId, toolType]) => {
    const disposableCommand = vscode.commands.registerCommand(
      commandId,
      async () => await runTransformation(toolType)
    );
    context.subscriptions.push(disposableCommand);
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposableProcessSelected);
}

export function deactivate() {}
