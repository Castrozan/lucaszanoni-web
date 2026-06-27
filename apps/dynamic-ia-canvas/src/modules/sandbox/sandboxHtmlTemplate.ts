export function buildSandboxHtmlDocument(jsxCode: string): string {
  const escapedCode = jsxCode
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: white; color: #111; }
    #root { min-height: 100vh; }
    .sandbox-error { padding: 16px; color: #ef4444; font-size: 14px; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      const componentCode = \`${escapedCode}\`;

      function renderError(message) {
        document.getElementById('root').innerHTML =
          '<div class="sandbox-error">' + message + '</div>';
        window.parent.postMessage({ type: 'sandbox-error', error: message }, '*');
      }

      function renderComponent() {
        try {
          const moduleExports = {};
          const moduleFunction = new Function(
            'React', 'ReactDOM', 'exports',
            componentCode + '\\nObject.assign(exports, typeof App !== "undefined" ? { default: App } : {});'
          );
          moduleFunction(React, ReactDOM, moduleExports);

          const Component = moduleExports.default || moduleExports.App;
          if (!Component) {
            renderError('No default export or App component found');
            return;
          }

          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(Component));

          window.parent.postMessage({ type: 'sandbox-ready' }, '*');
        } catch (error) {
          renderError(error.message || 'Unknown rendering error');
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderComponent);
      } else {
        renderComponent();
      }
    })();
  </script>
</body>
</html>`;
}
