#!/usr/bin/env nbb
(ns pm.cli
  (:require [babashka.cli :as cli]
            [clojure.string :as str]
            [pm.install :as pm]))   ;; your pm-install/maybe fns

(def table
  [{:cmds ["pm-install"]
    :desc "Install one or more packages"
    :coerce {:mgr :string :pkg []}
    :alias  {:m :mgr}
    :args->opts [:pkg]                       ; fold trailing args into :pkg
    :fn (fn [{:keys [opts]}]
          (apply pm/pm-install (cond-> {} (:mgr opts) (assoc :mgr (:mgr opts)))
                 (:pkg opts)))}
   {:cmds ["ensure-cmd"]
    :args->opts [:cmd]
    :fn (fn [{:keys [opts]}] (pm/ensure-cmd (:cmd opts)))}])

(defn -main [argv]
  (cli/dispatch table argv))

(-main *command-line-args*)
