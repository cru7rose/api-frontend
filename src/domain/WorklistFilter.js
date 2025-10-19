/**
 * ARCHITEKTURA: Niemutowalny obiekt zapytania do listy roboczej. Odpowiada za serializację filtrów do parametrów URL.
 * Separuje szczegóły filtrowania od komponentów UI oraz usług sieciowych.
 */
export class WorklistFilter {
  constructor(search = null, source = null, errorTypes = [], minConfidence = null, maxConfidence = null, page = 1, pageSize = 50) {
    this.search = search;
    this.source = source;
    this.errorTypes = Array.isArray(errorTypes) ? errorTypes : [];
    this.minConfidence = minConfidence;
    this.maxConfidence = maxConfidence;
    this.page = page;
    this.pageSize = pageSize;
  }

  withPatch(patch) {
    return new WorklistFilter(
      patch.search ?? this.search,
      patch.source ?? this.source,
      patch.errorTypes ?? this.errorTypes.slice(),
      patch.minConfidence ?? this.minConfidence,
      patch.maxConfidence ?? this.maxConfidence,
      patch.page ?? this.page,
      patch.pageSize ?? this.pageSize
    );
  }

  toQueryRecord() {
    const q = {};
    if (this.search) q.q = this.search;
    if (this.source) q.source = this.source;
    if (this.errorTypes.length) q.errorTypes = this.errorTypes.join(",");
    if (this.minConfidence != null) q.minConfidence = String(this.minConfidence);
    if (this.maxConfidence != null) q.maxConfidence = String(this.maxConfidence);
    q.page = String(this.page);
    q.pageSize = String(this.pageSize);
    return q;
  }
}
