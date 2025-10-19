/**
 * ARCHITECTURE: EditorNavigationController builds route URLs to the editor preserving context when needed.
 * It follows the manifesto by isolating URL composition away from views.
 * Responsibilities:
 * - toEditor(orderId, from, state): return path with optional query for back navigation.
 */
export class EditorNavigationController {
  toEditor(orderId, from = "worklist", state = null) {
    const q = new URLSearchParams();
    q.set("from", from);
    if (state && typeof state === "object") q.set("ctx", btoa(unescape(encodeURIComponent(JSON.stringify(state)))));
    return `/editor/${encodeURIComponent(orderId)}?${q.toString()}`;
  }
}
