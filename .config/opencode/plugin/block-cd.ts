// import type { Plugin } from "@opencode-ai/plugin";
// export const FileLockPlugin: Plugin = async (input) => {
//   const sessionId = Math.random().toString(36).substring(7);

//   return {
//     "tool.execute.before": rejectCd(sessionId),
//     "tool.execute.after": createAfterHook(sessionId),
//     "session.end": createSessionEndHook(sessionId),
//   };
// };
