/**
 * ARCHITECTURE: StartupProbe emits deterministic breadcrumbs during app boot and first render.
 * It follows the manifesto by isolating debug side effects from core logic.
 * Responsibilities:
 * - Log lifecycle milestones; stamp <html data-app-boot="..."> for visual confirmation.
 */
export class StartupProbe {
    constructor() {
        this.marks = [];
    }

    mark(label) {
        const ts = new Date().toISOString();
        const entry = `${ts} :: ${label}`;
        this.marks.push(entry);
        if (typeof console !== "undefined" && console.log) console.log("[startup]", entry);
        try {
            const html = document.documentElement;
            html.setAttribute("data-app-boot", label);
        } catch (_) { /* ignore */ }
        return entry;
    }

    dump() {
        if (typeof console !== "undefined" && console.table) console.table(this.marks.map((m, i) => ({ i, m })));
        return this.marks.slice();
    }
}