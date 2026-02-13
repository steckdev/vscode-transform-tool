import * as vscode from "vscode";

type mainHtmlProps = {
  scriptUri: vscode.Uri;
  stylesUri: vscode.Uri;
  workers: Record<string, vscode.Uri>;
  settings: string;
};

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export function getMainHtmlContent({
  scriptUri,
  stylesUri,
  workers: { prettierUri },
  settings,
}: mainHtmlProps) {
  const escapedSettings = escapeHtml(settings);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${stylesUri.toString().replace(/[^:]*:/, '')} 'unsafe-inline'; script-src ${scriptUri.toString().replace(/[^:]*:/, '')} 'unsafe-inline'; worker-src blob:; img-src data: https:;">
      <link href="${stylesUri}" rel="stylesheet">
      <script>
            window.prettierUri="${prettierUri}";
            window.viewSettings=JSON.parse(decodeURIComponent("${encodeURIComponent(escapedSettings)}"));
      </script>
    </head>
    <body>
      <div id="root"></div>
      <script src="${scriptUri}"></script>
    </body>
    </html>
  `;
}
