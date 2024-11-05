import { invokeRemote } from '@forge/api';
import Resolver from '@forge/resolver';

// We create a resolver to allow invoking the remote app from the UI
const resolver = new Resolver();
resolver.define('remote-invoke-resolver', async ({ context }) => {
  const { moduleKey } = context;
  const result = await invokeRemoteApp(
    moduleKey.includes('node') ? 'node' : 'boot',
    context,
  );
  if (result.json) {
    return {
      body: result.json,
    };
  }
  // Return the response body as a string if it's not JSON, to be printed out
  return result.body || result.statusText;
});
export const handler = resolver.getDefinitions();

/**
 * We also export a web trigger function to allow triggering the remote app without the UI
 * Select the backend using query parameters: ?backend=node or ?backend=boot
 * @see https://developer.atlassian.com/platform/forge/events-reference/web-trigger/#request
 */
export async function invokeRemoteAppWebtrigger({ queryParameters, context }) {
  const backend = queryParameters.backend?.[0];
  return await invokeRemoteApp(backend || 'node', context);
}

/**
 * @param backend {"node" | "boot"} Which backend to invoke
 * @param context {object} The context to pass to the remote app
 */
async function invokeRemoteApp(backend, context) {
  console.log('Invoking remote app with backend:', backend, context);

  const options = {
    method: 'POST',
    path: '/frc-backend',
    body: JSON.stringify(context),
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const invocationResult =
    backend === 'boot'
      ? await invokeRemoteSpringBoot(options)
      : await invokeRemoteNode(options);

  return await handleResponse(invocationResult);
}

async function invokeRemoteNode(options) {
  return invokeRemote('remote-app-node', options);
}

async function invokeRemoteSpringBoot(options) {
  return invokeRemote('remote-app-boot', options);
}

async function handleResponse(response) {
  const { ok, status, statusText } = response;

  if (!ok) {
    console.error('Invoking remote failed:', { status, statusText });
    return buildResponse({ status, statusText });
  }

  let text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse response body as JSON', e);
  }
  console.log('Invoking remote succeeded:', {
    status,
    statusText,
    body: json || text,
  });
  return buildResponse({ status, statusText, body: text, json });
}

/**
 * Response in the expected web trigger response format:
 * @see https://developer.atlassian.com/platform/forge/events-reference/web-trigger/#response
 */
function buildResponse({ status, statusText, body, json }) {
  return {
    headers: {
      'Content-Type': ['application/json'],
    },
    statusCode: status,
    statusText,
    body,
    // Extra property with pre-parsed JSON
    json,
  };
}
