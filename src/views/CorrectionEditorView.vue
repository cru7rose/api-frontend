<!--
ARCHITECTURE: CorrectionEditorView provides the end-to-end Address Correction Editor screen.
It follows the manifesto by delegating all business logic to controllers/facades and keeping UI thin.
Responsibilities:
- Load the order, wire map + google bootstrapping, show side-by-side Original vs Suggested (editable).
- Offer actions: Accept Suggestion, Use Original, Save Pickup/Delivery/Both, Save & Next.
-->
<template>
  <section class="editor">
    <header class="ed-header">
      <h1>Correction Editor — Order {{ state.orderId || route.params.id }}</h1>
      <div class="actions">
        <button @click="savePickup">Save Pickup</button>
        <button @click="saveDelivery">Save Delivery</button>
        <button class="primary" @click="saveBoth">Save Both</button>
        <button class="primary" @click="saveBothThenNext">Save & Next</button>
      </div>
    </header>

    <div class="cols">
      <div class="col left">
        <h3>Pickup Address</h3>
        <div class="form">
          <label>Street <input v-model="pickup.street" @input="onPickupEdit" /></label>
          <label>House No. <input v-model="pickup.houseNumber" @input="onPickupEdit" /></label>
          <label>Postal <input v-model="pickup.postalCode" @input="onPickupEdit" /></label>
          <label>City <input v-model="pickup.city" @input="onPickupEdit" /></label>
          <label>Country <input v-model="pickup.country" @input="onPickupEdit" /></label>
        </div>
        <div class="buttons">
          <button @click="acceptPickup(0)">Accept Suggestion</button>
          <button @click="useOriginalPickup">Use Original</button>
        </div>
        <div class="suggestions">
          <h4>Suggestions</h4>
          <ul>
            <li v-for="(s, i) in sugg.pickup" :key="'p'+i">
              <button @click="selectPickup(i)">
                {{ oneLine(s) }}
              </button>
            </li>
            <li v-if="!sugg.pickup.length">No suggestions yet.</li>
          </ul>
        </div>
      </div>

      <div class="col middle">
        <div ref="mapEl" class="map"></div>
      </div>

      <div class="col right">
        <h3>Delivery Address</h3>
        <div class="form">
          <label>Street <input v-model="delivery.street" @input="onDeliveryEdit" /></label>
          <label>House No. <input v-model="delivery.houseNumber" @input="onDeliveryEdit" /></label>
          <label>Postal <input v-model="delivery.postalCode" @input="onDeliveryEdit" /></label>
          <label>City <input v-model="delivery.city" @input="onDeliveryEdit" /></label>
          <label>Country <input v-model="delivery.country" @input="onDeliveryEdit" /></label>
        </div>
        <div class="buttons">
          <button @click="acceptDelivery(0)">Accept Suggestion</button>
          <button @click="useOriginalDelivery">Use Original</button>
        </div>
        <div class="suggestions">
          <h4>Suggestions</h4>
          <ul>
            <li v-for="(s, i) in sugg.delivery" :key="'d'+i">
              <button @click="selectDelivery(i)">
                {{ oneLine(s) }}
              </button>
            </li>
            <li v-if="!sugg.delivery.length">No suggestions yet.</li>
          </ul>
        </div>
      </div>
    </div>

    <footer class="diff">
      <h3>Diff</h3>
      <div class="diff-cols">
        <div>
          <h4>Pickup Changes</h4>
          <table>
            <thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead>
            <tbody>
              <tr v-for="r in diff.pickup.rows" :key="'dp'+r.field" :class="{ changed: r.changed }">
                <td>{{ r.label || r.field }}</td>
                <td>{{ r.before ?? '—' }}</td>
                <td>{{ r.after ?? '—' }}</td>
              </tr>
              <tr v-if="!diff.pickup.rows.length"><td colspan="3">No changes.</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4>Delivery Changes</h4>
          <table>
            <thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead>
            <tbody>
              <tr v-for="r in diff.delivery.rows" :key="'dd'+r.field" :class="{ changed: r.changed }">
                <td>{{ r.label || r.field }}</td>
                <td>{{ r.before ?? '—' }}</td>
                <td>{{ r.after ?? '—' }}</td>
              </tr>
              <tr v-if="!diff.delivery.rows.length"><td colspan="3">No changes.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { inject, onMounted, reactive, ref, watch } from "vue";
import { GoogleAddressVerificationBootstrap } from "@/bootstrap/GoogleAddressVerificationBootstrap";
import { useRoute, useRouter } from "vue-router";
import { EditorFacade } from "@/controllers/EditorFacade";
import { SaveFlowController } from "@/controllers/SaveFlowController";
import { IdempotentSaveController } from "@/controllers/IdempotentSaveController";
import { EditorDiffController } from "@/controllers/EditorDiffController";

const orchestrator = inject("orchestrator");
const googleKey = inject("googleKey");

const route = useRoute();
const router = useRouter();
const mapEl = ref(null);

const state = reactive({ orderId: null, ready: false });
const pickup = reactive({ street: "", houseNumber: "", postalCode: "", city: "", country: "PL" });
const delivery = reactive({ street: "", houseNumber: "", postalCode: "", city: "", country: "PL" });
const sugg = reactive({ pickup: [], delivery: [] });
const diff = reactive({ pickup: { rows: [] }, delivery: { rows: [] } });

let editorFacade = null;
let saveFlow = null;
let diffCtrl = null;

function oneLine(a) {
  const l1 = [a.street, a.houseNumber].filter(Boolean).join(" ");
  const l2 = [a.postalCode, a.city].filter(Boolean).join(" ");
  const c = a.countryCode || a.country || "PL";
  return [l1, l2, c].filter(Boolean).join(", ");
}

async function init() {
  const orderId = route.params.id;
  state.orderId = orderId;

  // Ensure Google runtime + map exists now
  const boot = new GoogleAddressVerificationBootstrap();
  await boot.init(mapEl.value, googleKey);

  editorFacade = orchestrator ? orchestrator.getEditor() : new EditorFacade(null, boot.mapController, boot.placesAdapter);
  saveFlow = new SaveFlowController(editorFacade, orchestrator ? orchestrator.queue : null, new IdempotentSaveController());
  diffCtrl = new EditorDiffController(editorFacade);

  const load = await editorFacade.load(orderId);
  if (!load.ok) {
    router.push("/worklist");
    return;
  }
  const snap = editorFacade.snapshot();
  Object.assign(pickup, snap.editor.editedPickup || {});
  Object.assign(delivery, snap.editor.editedDelivery || {});
  sugg.pickup = snap.editor.suggestions?.pickup || [];
  sugg.delivery = snap.editor.suggestions?.delivery || [];
  diffCtrl.recompute();
  Object.assign(diff, diffCtrl.snapshot());

  state.ready = true;
}

function onPickupEdit() {
  editorFacade.setManualPickup({ ...pickup });
  diffCtrl.recompute();
  Object.assign(diff, diffCtrl.snapshot());
}

function onDeliveryEdit() {
  editorFacade.setManualDelivery({ ...delivery });
  diffCtrl.recompute();
  Object.assign(diff, diffCtrl.snapshot());
}

function acceptPickup(i) {
  editorFacade.acceptPickupSuggestion(i);
  const snap = editorFacade.snapshot();
  Object.assign(pickup, snap.editor.editedPickup || {});
  diffCtrl.recompute();
  Object.assign(diff, diffCtrl.snapshot());
}

function acceptDelivery(i) {
  editorFacade.acceptDeliverySuggestion(i);
  const snap = editorFacade.snapshot();
  Object.assign(delivery, snap.editor.editedDelivery || {});
  diffCtrl.recompute();
  Object.assign(diff, diffCtrl.snapshot());
}

function useOriginalPickup() {
  editorFacade.useOriginalPickup();
  const snap = editorFacade.snapshot();
  Object.assign(pickup, snap.editor.editedPickup || {});
  diffCtrl.recompute();
  Object.assign(diff, diffCtrl.snapshot());
}

function useOriginalDelivery() {
  editorFacade.useOriginalDelivery();
  const snap = editorFacade.snapshot();
  Object.assign(delivery, snap.editor.editedDelivery || {});
  diffCtrl.recompute();
  Object.assign(diff, diffCtrl.snapshot());
}

async function savePickup() {
  await saveFlow.saveThenAwait("pickup");
}

async function saveDelivery() {
  await saveFlow.saveThenAwait("delivery");
}

async function saveBoth() {
  await saveFlow.saveThenAwait("both");
}

async function saveBothThenNext() {
  const r = await saveFlow.saveThenAwait("both");
  if (r.ok && r.value?.nextId) router.push(`/editor/${encodeURIComponent(r.value.nextId)}`);
  else router.push("/worklist");
}

watch(() => route.params.id, init);
onMounted(init);
</script>

<style scoped>
.editor { display: grid; gap: 12px; padding: 16px; }
.ed-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.actions { display: flex; gap: 8px; }
.actions .primary { background: #2d6cdf; color: #fff; }
.cols { display: grid; grid-template-columns: 1fr 480px 1fr; gap: 12px; }
.col { border: 1px solid #ddd; padding: 8px; border-radius: 6px; }
.form { display: grid; gap: 6px; }
.form label { display: grid; gap: 4px; font-size: 12px; }
.map { width: 100%; height: 520px; background: #f3f5f7; border: 1px solid #ddd; }
.suggestions { margin-top: 8px; }
.suggestions ul { list-style: none; padding: 0; display: grid; gap: 6px; }
.diff { border-top: 1px solid #eee; padding-top: 12px; }
.diff-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.changed td { background: #fff7e6; }
button { padding: 6px 10px; font-size: 14px; }
input { padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; }
</style>
