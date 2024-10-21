<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getPackageJestSummary } from "../tools/getPackageJestSummary.js";
const props = defineProps<{
  name: string;
}>();
const nameWithoutOrg = props.name.replace("@wroud/", "");

const version = ref("");
const { total } = getPackageJestSummary(props.name);

onMounted(async () => {
  const packageJson = await import(`../../../${props.name}/package.json`);
  version.value = "@" + packageJson.default.version;
});
</script>

<template>
  <p flex="~ gap-2 wrap">
    <a :href="`https://www.npmjs.com/package/${name}`" target="_blank"
      ><img
        :src="`https://img.shields.io/npm/v/${name}?color=32A9C3&amp;labelColor=1B3C4A&amp;label=npm`"
        alt="NPM version"
    /></a>
    <a :href="`https://www.npmjs.com/package/${name}`" target="_blank"
      ><img
        :src="`https://img.shields.io/npm/dm/${name}?color=32A9C3&amp;labelColor=1B3C4A&amp;label=downloads`"
        alt="NPM downloads"
    /></a>
    <a
      :href="`https://bundlephobia.com/package/${name}${version}`"
      target="_blank"
      ><img
        :src="`https://img.shields.io/bundlephobia/minzip/${name}${version}?color=32A9C3&amp;labelColor=1B3C4A&amp`"
        alt="Size"
    /></a>
    <img
      :src="`https://img.shields.io/badge/${total}%25-a?logo=vitest&color=32A9C3&amp;labelColor=1B3C4A&amp;&label=Coverage`"
      alt="Coverage"
    />
    <a
      :href="`https://github.com/wroud/foundation/tree/main/packages/${name}`"
      target="_blank"
      ><img
        src="https://img.shields.io/badge/source-a?logo=github&color=1B3C4A"
        alt="GitHub"
    /></a>
  </p>
</template>
