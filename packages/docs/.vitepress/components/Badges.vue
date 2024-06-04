<script setup lang="ts">
import { ref, onMounted } from 'vue'
import data from '../../../../coverage/coverage-summary.json'
defineProps<{
  name: string
}>()

const branches = data.total.branches.pct;
const functions = data.total.functions.pct;
const lines = data.total.lines.pct;
const statements = data.total.statements.pct;

const total = Math.round(((branches + functions + lines + statements) / 4 + Number.EPSILON) * 100) / 100;
</script>

<template>
  <p flex="~ gap-2 wrap">
    <a :href="`https://www.npmjs.com/package/${name}`" target="_blank"><img :src="`https://img.shields.io/npm/v/${name}?color=32A9C3&amp;labelColor=1B3C4A&amp;label=npm`" alt="NPM version"></a>
    <a :href="`https://www.npmjs.com/package/${name}`" target="_blank"><img :src="`https://img.shields.io/npm/dm/${name}?color=32A9C3&amp;labelColor=1B3C4A&amp;label=downloads`" alt="NPM downloads"></a>
    <img :src="`https://img.shields.io/badge/${total}%25-a?logo=jest&color=32A9C3&amp;labelColor=1B3C4A&amp;&label=Coverage`" alt="Coverage">
    <a :href="`https://github.com/wroud/foundation/tree/main/packages/${name.replace('@wroud/', '')}`" target="_blank"><img src="https://img.shields.io/badge/source-a?logo=github&color=1B3C4A" alt="GitHub"></a>
  </p>
</template>