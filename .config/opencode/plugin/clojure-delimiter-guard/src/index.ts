// SPDX-License-Identifier: GPL-3.0-only
import type { Plugin } from "@opencode-ai/plugin";
import { isClojureFile, assertNonEmptyString } from "./guards";
import { processContent } from "./processContent";

export const ClojureDelimiterChecker: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      const fp = output?.args?.filePath;
      if (!isClojureFile(fp)) return;

      // write
      if (input.tool === "write") {
        const c = output.args?.content;
        assertNonEmptyString(fp, "filePath");
        output.args.content = processContent(c, fp);
      }

      // edit
      if (input.tool === "edit") {
        const ns = output.args?.newString;
        assertNonEmptyString(fp, "filePath");
        output.args.newString = processContent(ns, fp);
      }
    },

    // Optional: two-phase gate. Enable if you want to also check the
    // resulting file content after the tool has executed and mutated it.
    // "tool.execute.after": async (_input, output) => {
    //   const fp = output?.args?.filePath;
    //   if (!isClojureFile(fp)) return;
    //   if (typeof output?.result?.content === "string") {
    //     output.result.content = processContent(output.result.content, fp);
    //   }
    // },
  };
};