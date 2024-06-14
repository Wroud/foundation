<script setup lang="ts">
import type { IServiceCollection } from "@wroud/di";
import {
  createChart,
  getDependenciesGraph,
  type IGraph,
  type IChart,
} from "@wroud/di-tools-analyzer";
import { onMounted, reactive, ref, watchEffect } from "vue";
const props = defineProps<{
  serviceCollection?: IServiceCollection;
  graph?: string;
  defaultGraph?: string;
  width: string;
  height: string;
  displayImport?: boolean;
}>();
const svgRef = ref<SVGSVGElement | null>(null);
const store = reactive({
  graph: null as IGraph | null,
  chart: null as IChart | null,
  import(data: string) {
    store.graph = JSON.parse(data);
  },
});

onMounted(() => {
  if (svgRef.value) {
    store.chart = createChart(svgRef.value as any, props.width, props.height);
  }
});

watchEffect(() => {
  if (!store.chart) {
    return;
  }

  if (props.defaultGraph && !store.graph) {
    store.graph = JSON.parse(props.defaultGraph);
  }

  if (props.graph) {
    store.graph = JSON.parse(props.graph);
  }

  if (props.serviceCollection) {
    store.graph = getDependenciesGraph(props.serviceCollection);
    console.log(JSON.stringify(store.graph));
  }

  if (store.graph) {
    store.chart.update(store.graph);
  }
});

function onFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        store.import(e.target.result as string);
      }
    };
    reader.readAsText(file);
  }
}

function onPromptImport() {
  const data = prompt("Paste the JSON data here");
  if (data) {
    store.import(data);
  }
}
</script>

<style>
.arrowhead {
  fill: var(--vp-c-text-1);
}
.links {
  fill: none;
}
.link {
  stroke: var(--vp-c-text-1);
}
.node {
  user-select: none;
}
.legend-background {
  fill: var(--vp-c-bg);
  stroke: var(--vp-c-border);
}
.node-circle {
  fill: var(--vp-c-text-1);
  stroke: var(--vp-c-bg);
}
.node-transient .node-circle {
  fill: var(--vp-c-yellow-3);
}
.node-singleton .node-circle {
  fill: var(--vp-c-green-3);
}
.node-scoped .node-circle {
  fill: var(--vp-c-purple-3);
}
.node-not-found .node-circle {
  fill: var(--vp-c-red-3);
}
.node-text {
  font-size: 12px;
  fill: var(--vp-c-text-1);
  stroke: var(--vp-c-bg);
  cursor: default;
}
.graph-import {
  display: flex;
  gap: 16px;
  margin-top: 24px;
  flex-direction: column;
  align-items: flex-start;
}
.import-button {
  padding: 4px 8px;
  background-color: var(--vp-c-indigo-3);
  border-radius: 4px;

  &:hover {
    background-color: var(--vp-c-indigo-2);
  }
}
</style>

<template>
  <div v-if="props.displayImport" class="graph-import">
    <button type="button" class="import-button" @click="onPromptImport">
      Import JSON
    </button>
    <input type="file" name="file" @change="onFileSelect" />
  </div>
  <svg ref="svgRef"></svg>
</template>
