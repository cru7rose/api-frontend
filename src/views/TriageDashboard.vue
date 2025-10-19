<!--
ARCHITECTURE: TriageDashboard shows high-level KPIs and quick entry points by batch and error types.
It follows the manifesto by delegating data loading to WorklistFacade and keeping the view declarative.
Responsibilities:
- Project KPIs from current worklist snapshot; allow navigation to filtered Worklist with one click.
-->
<template>
  <section class="dash">
    <header class="head">
      <h1>Address Exception Ops Center</h1>
      <div class="kpis">
        <div class="card"><div class="v">{{ kpi.pending }}</div><div class="l">Pending Review</div></div>
        <div class="card"><div class="v">{{ kpi.clearance }}</div><div class="l">Automated Clearance</div></div>
        <div class="card"><div class="v">{{ kpi.avg }}</div><div class="l">Avg Time to Resolution</div></div>
      </div>
    </header>

    <section class="actions">
      <button @click="gotoWorklist()">Open Worklist</button>
    </section>
  </section>
</template>

<script setup>
import { inject, onMounted, reactive } from "vue";
import { WorklistKpiController } from "@/controllers/WorklistKpiController";
import { useRouter } from "vue-router";

const orchestrator = inject("orchestrator");
const facade = orchestrator ? orchestrator.getWorklist() : null;
const kpiCtrl = new WorklistKpiController();
const router = useRouter();

const kpi = reactive({ pending: "0", clearance: "0.0%", avg: "—" });

async function load() {
  if (!facade) return;
  const r = await facade.initAndLoad({});
  if (!r.ok) return;
  const items = r.value.store.items;
  const vm = kpiCtrl.compute(items);
  kpi.pending = vm.pending;
  kpi.clearance = vm.clearancePercent;
  kpi.avg = vm.avgResolution;
}

function gotoWorklist() {
  router.push("/worklist");
}

onMounted(load);
</script>

<style scoped>
.dash { padding: 16px; display: grid; gap: 16px; }
.head { display: grid; gap: 12px; }
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #fff; }
.v { font-size: 28px; font-weight: 700; }
.l { font-size: 12px; color: #666; }
.actions { display: flex; gap: 8px; }
</style>
