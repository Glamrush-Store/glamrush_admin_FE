export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function useApiClient(clientOptions) {
  const config = useRuntimeConfig();
  const token = useCookie("auth_token");

  async function request(url, options = {}) {
    const headers = {
      ...(!(options.body instanceof FormData) && { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...options.headers,
    };

    const authValue = clientOptions?.authToken ?? token.value;
    if (authValue) {
      headers["Authorization"] = `Bearer ${authValue}`;
    }

    const response = await fetch(`${config.public.apiBase}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      token.value = null;
      navigateTo("/");
      throw new ApiError("Unauthorized", 401);
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        body.message || `Request failed: ${response.status}`,
        response.status,
        body.errors
      );
    }

    return body;
  }

  function get(url) {
    return request(url, { method: "GET" });
  }

  function post(url, body, options = {}) {
    return request(url, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  function put(url, body) {
    return request(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  function patch(url, body) {
    return request(url, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  function del(url) {
    return request(url, { method: "DELETE" });
  }

  function postFormData(url, formData) {
    return request(url, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });
  }

  function putFormData(url, formData) {
    formData.append("_method", "PUT");
    return request(url, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });
  }

  async function download(url) {
    const authValue = clientOptions?.authToken ?? token.value;
    const response = await fetch(`${config.public.apiBase}${url}`, {
      method: "GET",
      headers: {
        Accept: "text/csv",
        ...(authValue && { Authorization: `Bearer ${authValue}` }),
      },
    });

    if (response.status === 401) {
      token.value = null;
      navigateTo("/");
      throw new ApiError("Unauthorized", 401);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(
        body.message || `Download failed: ${response.status}`,
        response.status,
        body.errors
      );
    }

    const disposition = response.headers.get("content-disposition") || "";
    const filenameMatch = disposition.match(/filename\*?=(?:UTF-8''|["'])?([^"';]+)/i);
    const filename = filenameMatch
      ? decodeURIComponent(filenameMatch[1])
      : "newsletter-subscribers.csv";
    const objectUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);

    return filename;
  }

  return { get, post, put, patch, del, postFormData, putFormData, download };
}
