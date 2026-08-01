import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

/**
 * Reads `openapi/v1.yaml` (10-backend-architecture.md Section 4.1's
 * documented location — a sibling of `package.json`, not the frontend
 * monorepo) once per server instance and caches both the raw YAML text and
 * its parsed JSON form, so `/api/openapi.json`, `/api/openapi.yaml`, and
 * `/api/docs` all share one disk read and one parse.
 */

let cachedYamlText: string | null = null;
let cachedJson: unknown | null = null;

function loadYamlText(): string {
  if (cachedYamlText === null) {
    const specPath = path.join(process.cwd(), 'openapi', 'v1.yaml');
    cachedYamlText = fs.readFileSync(specPath, 'utf8');
  }
  return cachedYamlText;
}

export function getOpenApiYamlText(): string {
  return loadYamlText();
}

export function getOpenApiJson(): unknown {
  if (cachedJson === null) {
    cachedJson = yaml.load(loadYamlText());
  }
  return cachedJson;
}
