import { google, sheets_v4 } from "googleapis";

import { env } from "../env.js";

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_CODES = new Set(["ECONNRESET", "ETIMEDOUT"]);

type RetryableError = Error & {
  code?: number | string;
  response?: {
    status?: number;
  };
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n");
}

function createConfigurationError(): Error {
  return new Error("Google Sheets no está configurado");
}

function isRetryableError(error: RetryableError): boolean {
  const status = error.response?.status ?? (typeof error.code === "number" ? error.code : undefined);

  if (status && RETRYABLE_STATUS.has(status)) {
    return true;
  }

  return typeof error.code === "string" && RETRYABLE_CODES.has(error.code);
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let delayMs = env.GOOGLE_API_RETRY_DELAY_MS;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;

      if (!(error instanceof Error) || !isRetryableError(error as RetryableError) || attempt > env.GOOGLE_API_RETRIES) {
        throw error;
      }

      await wait(delayMs);
      delayMs *= 2;
    }
  }
}

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(
    env.GOOGLE_SHEETS_ID &&
      env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      env.GOOGLE_PRIVATE_KEY,
  );
}

export function getSheetsClient(): sheets_v4.Sheets {
  if (!isGoogleSheetsConfigured()) {
    throw createConfigurationError();
  }

  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL || undefined,
    key: normalizePrivateKey(env.GOOGLE_PRIVATE_KEY ?? ""),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

export async function readSheet(tabName: string): Promise<any[][]> {
  const sheets = getSheetsClient();

  return withRetry(async () => {
    const response = await sheets.spreadsheets.values.get(
      {
        spreadsheetId: env.GOOGLE_SHEETS_ID,
        range: tabName,
      },
      { timeout: env.GOOGLE_API_TIMEOUT_MS },
    );

    return response.data.values ?? [];
  });
}

export async function writeRow(tabName: string, row: unknown[]): Promise<void> {
  const sheets = getSheetsClient();

  await withRetry(async () => {
    await sheets.spreadsheets.values.append(
      {
        spreadsheetId: env.GOOGLE_SHEETS_ID,
        range: tabName,
        valueInputOption: "RAW",
        requestBody: {
          values: [row],
        },
      },
      { timeout: env.GOOGLE_API_TIMEOUT_MS },
    );
  });
}

export async function updateRow(tabName: string, rowIndex: number, row: unknown[]): Promise<void> {
  const sheets = getSheetsClient();

  await withRetry(async () => {
    await sheets.spreadsheets.values.update(
      {
        spreadsheetId: env.GOOGLE_SHEETS_ID,
        range: `${tabName}!${rowIndex}:${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [row],
        },
      },
      { timeout: env.GOOGLE_API_TIMEOUT_MS },
    );
  });
}

export async function deleteRow(tabName: string, rowIndex: number): Promise<void> {
  const sheets = getSheetsClient();
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: env.GOOGLE_SHEETS_ID,
  });
  const sheet = metadata.data.sheets?.find((item) => item.properties?.title === tabName);
  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined) {
    throw new Error(`No se encontró la hoja ${tabName}`);
  }

  await withRetry(async () => {
    await sheets.spreadsheets.batchUpdate(
      {
        spreadsheetId: env.GOOGLE_SHEETS_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex,
                },
              },
            },
          ],
        },
      },
      { timeout: env.GOOGLE_API_TIMEOUT_MS },
    );
  });
}
