/**
 * ARCHITECTURE: ApiAuthBinder binds/unbinds the Authorization header on the Shared ApiHttpClient singleton.
 * Responsibilities:
 * - Apply "Authorization: <type> <token>" to axios defaults; remove it on logout.
 */
import apiClient from "@/services/Api.js";

export class ApiAuthBinder {
  constructor() {
    this.headerName = "Authorization";
  }

  bind(accessToken, tokenType = "Bearer") {
    if (!accessToken) return false;
    const scheme = String(tokenType || "Bearer").trim() || "Bearer";
    if (!apiClient.defaults.headers) apiClient.defaults.headers = {};
    if (!apiClient.defaults.headers.common) apiClient.defaults.headers.common = {};
    apiClient.defaults.headers.common[this.headerName] = `${scheme} ${accessToken}`;
    return true;
  }

  unbind() {
    if (apiClient?.defaults?.headers?.common && this.headerName in apiClient.defaults.headers.common) {
      delete apiClient.defaults.headers.common[this.headerName];
      return true;
    }
    return false;
  }
}
