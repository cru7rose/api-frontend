/**
 * ARCHITEKTURA: Deklaratywna definicja operacji masowej korekty adresów z podglądem i zastosowaniem.
 * Zaprojektowana do walidacji po stronie serwera oraz ponownej weryfikacji partii.
 */
export class BulkEditPlan {
  constructor(orderIds, field, mode, findPattern, replaceWith) {
    this.orderIds = Array.isArray(orderIds) ? orderIds : [];
    this.field = field;
    this.mode = mode;
    this.findPattern = findPattern;
    this.replaceWith = replaceWith;
  }

  static findReplace(orderIds, field, findPattern, replaceWith) {
    return new BulkEditPlan(orderIds, field, "FIND_REPLACE", findPattern, replaceWith);
  }

  static append(orderIds, field, suffix) {
    return new BulkEditPlan(orderIds, field, "APPEND", null, suffix);
  }

  static prepend(orderIds, field, prefix) {
    return new BulkEditPlan(orderIds, field, "PREPEND", null, prefix);
  }
}
