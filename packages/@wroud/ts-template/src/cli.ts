#!/usr/bin/env node
import { configureYargs } from "./cliConfiguration.js";

await configureYargs(process.argv, process.cwd()).parse();
