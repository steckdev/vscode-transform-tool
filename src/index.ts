import * as vscode from "vscode";

type mainHtmlProps = {
  scriptUri: vscode.Uri;
  stylesUri: vscode.Uri;
  workers: Record<string, vscode.Uri>;
  settings: string;
};

export function getMainHtmlContent({
  scriptUri,
  stylesUri,
  workers: { prettierUri },
  settings,
}: mainHtmlProps) {
  const nonce = getNonce();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${stylesUri} 'unsafe-inline'; script-src 'nonce-${nonce}' ${scriptUri}; worker-src blob:; img-src data: https:; connect-src https:;">
      <link href="${stylesUri}" rel="stylesheet">
      <script nonce="${nonce}">
            window.prettierUri="${prettierUri}";
            window.viewSettings=${settings};
      </script>
    </head>
    <body>
      <div id="root"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>
  `;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
