import https, { RequestOptions } from "node:https";

async function httpRequest(
  options: RequestOptions,
  body?: string
): Promise<Buffer[]> {
  return new Promise((resolve, reject) => {
    const data: Buffer[] = [];
    const request = https.request(options, (response) => {
      // reject on bad status
      if (
        !response.statusCode ||
        response.statusCode < 200 ||
        response.statusCode >= 300
      ) {
        return reject(new Error("statusCode=" + response.statusCode));
      }
      response.on("error", reject);

      response.on("data", (chunk) => data.push(chunk));
      response.on("end", () => resolve(data));
    });
    request.on("error", reject);
    // post data here if required
    if (body) {
      request.write(body);
    }
    request.end();
  });
}
