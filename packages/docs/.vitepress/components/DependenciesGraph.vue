<script setup lang="ts">
import type { IServiceCollection } from "@wroud/di";
import { createChart, getDependenciesGraph } from "@wroud/di-tools-analyzer";
import { onMounted, ref } from "vue";
const props = defineProps<{
  serviceCollection: IServiceCollection;
  width: string;
  height: string;
}>();
const svgRef = ref<SVGSVGElement | null>(null);

onMounted(() => {
  if (svgRef.value) {
    const chart = createChart(svgRef.value as any, props.width, props.height);
    const graph = getDependenciesGraph(props.serviceCollection);
    chart.update(graph);
  }
});
</script>

<style>
.arrowhead {
  fill: var(--vp-c-text-1);
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
</style>

<template>
  <svg ref="svgRef"></svg>
</template>
