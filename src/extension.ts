import * as vscode from "vscode";
import { LANGUAGE_MAP, TRANSFORMATION_INFO } from "./constants";
import { isToolString } from "./helpers";
import { textSelectionHandler } from "./selectTextProcessor";
import { transformers } from "./transformers";
import { OptionsProvider } from "./treeProvider";
import { toolArgs } from "./web/types";


async function handleTransformationError(tool: toolArgs, error: Error) {
  const info = TRANSFORMATION_INFO[tool];
  const errorMessage = error.message;

  const action = await vscode.window.showErrorMessage(
    `❌ Transformation Failed: ${errorMessage}`,
    { modal: false },
    "Show Example",
    "Paste Your Own Input",
    "Cancel"
  );

  if (action === "Show Example") {
    const exampleDoc = await vscode.workspace.openTextDocument({
      content: `${info.description}\n\nExpected Format: ${info.expectedFormat}\n\nExample:\n${info.example}`,
      language: "plaintext",
    });

    await vscode.window.showTextDocument(exampleDoc, {
      viewColumn: vscode.ViewColumn.Beside,
      preview: false,
    });
  } else if (action === "Paste Your Own Input") {
    const userInput = await vscode.window.showInputBox({
      prompt: `Enter ${info.expectedFormat}`,
      placeHolder: info.example,
      value: "",
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value.trim()) {
          return "Input cannot be empty";
        }
        return null;
      }
    });

    if (userInput) {
      await transformAndCreateDocument(tool, userInput);
    }
  }
}

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
    await handleTransformationError(tool, error as Error);
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
