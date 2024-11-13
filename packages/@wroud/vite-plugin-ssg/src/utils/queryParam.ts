export function addQueryParam(url: string, name: string, value?: string) {
  value = value !== undefined ? encodeURIComponent(value) : undefined;
  // Split the URL into base and query string
  const [baseUrl, queryString] = url.split("?");

  // Parse existing parameters into an array
  const params = queryString?.split("&") || [];

  // Check if the parameter already exists
  const paramIndex = params.findIndex((param) => param.split("=")[0] === name);

  // Construct the parameter with or without a value
  const encodedParam = value !== undefined ? `${name}=${value}` : name;

  if (paramIndex !== -1) {
    // Update the parameter if it exists
    params[paramIndex] = encodedParam;
  } else {
    // Add the parameter if it does not exist
    params.push(encodedParam);
  }

  // Rebuild the URL with the updated query string
  const updatedQueryString = params.join("&");
  return `${baseUrl}?${updatedQueryString}`;
}

export function parseQueryParams(url: string) {
  const params: Record<string, string | null> = {};
  const queryString = url.split("?")[1];

  if (!queryString) return params;

  for (const param of queryString.split("&")) {
    const [key, value] = param.split("=");
    params[key!] = value ? decodeURIComponent(value) : null;
  }

  return params;
}

export function removeQueryParam(url: string, name: string) {
  // Split the URL into base and query string parts
  const [baseUrl, queryString] = url.split("?");

  // If there’s no query string, return the original URL
  if (!queryString) return url;

  // Filter out the specified parameter from the query string
  const updatedQueryString = queryString
    .split("&")
    .filter((param) => param.split("=")[0] !== name)
    .join("&");

  // Return the base URL with the updated query string, if any
  return updatedQueryString ? `${baseUrl}?${updatedQueryString}` : baseUrl!;
}
