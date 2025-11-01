#!/usr/bin/env nbb
;; SPDX-License-Identifier: GPL-3.0-only
;; nbb tools: maybe / maybe-missing / ensure-cmd / pm-install
(ns pm.install
  (:require [clojure.string :as str]))

;; --- node interop -----------------------------------------------------------
(def cp (js/require "child_process"))

(defn- spawn-sync
  "Run a command. When inherit? true, streams are inherited (nice for installers).
   Returns {:exit int :out string :err string}."
  [cmd args & {:keys [inherit?]}]
  (let [res (.spawnSync cp cmd (clj->js args)
                        (clj->js {:stdio (if inherit? "inherit" "pipe")
                                  :shell false}))]
    {:exit (.-status res)
     :out  (some-> res .-stdout (when (.-stdout res)) (.toString))
     :err  (some-> res .-stderr (when (.-stderr res)) (.toString))}))

(defn- sh
  "Convenience wrapper that inherits stdio and returns exit code."
  [cmd & args]
  (:exit (spawn-sync cmd args :inherit? true)))

(defn- has?
  "Does a command exist on PATH?"
  [cmd]
  (zero? (:exit (spawn-sync "sh" ["-lc" (str "command -v " cmd " >/dev/null 2>&1")]))))

;; --- booleans & maybe -------------------------------------------------------
(def ^:private truthy #{"1" "true" "t" "yes" "y" "on"})
(def ^:private falsy  #{"0" "false" "f" "no" "n" "off" ""})

(defn parse-bool
  "Accepts boolean/number/string. Throws on unknown strings."
  [x]
  (cond
    (or (true? x) (false? x)) x
    (number? x) (not (zero? x))
    (string? x) (let [v (-> x str/trim str/lower-case)]
                  (cond
                    (truthy v) true
                    (falsy v)  false
                    :else (throw (ex-info (str "invalid boolean: " x) {:value x}))))
    :else (boolean x)))

(defn maybe
  "Run (cmd & args) iff flag is truthy. Returns command's exit code; 0 on no-op."
  [flag cmd & args]
  (if (parse-bool flag)
    (apply sh cmd args)
    0))

;; --- pm-install -------------------------------------------------------------
(def ^:private apt-updated? (atom false))

(defn- pm-install-with
  "Install pkg using a specific manager. Returns exit code (0 success)."
  [mgr pkg]
  (case mgr
    "brew"    (sh "brew" "install" pkg)

    ;; Debian/Ubuntu
    "apt"     (do (when (and (has? "apt-get") (not @apt-updated?))
                    (when (zero? (sh "sudo" "apt-get" "update"))
                      (reset! apt-updated? true)))
                  (if (has? "apt-get")
                    (sh "sudo" "apt-get" "install" "-y" pkg)
                    (do (when (not @apt-updated?)
                          (when (zero? (sh "sudo" "apt" "update"))
                            (reset! apt-updated? true)))
                        (sh "sudo" "apt" "install" "-y" pkg))))

    "dnf"     (sh "sudo" "dnf" "install" "-y" pkg)
    "pacman"  (sh "sudo" "pacman" "-S" "--noconfirm" "--needed" pkg)
    "zypper"  (sh "sudo" "zypper" "--non-interactive" "install" pkg)
    "snap"    (let [flags (or (some-> (.-env js/process) .-SNAP_FLAGS) "")]
                (if (str/blank? flags)
                  (sh "sudo" "snap" "install" pkg)
                  (sh "sudo" "snap" "install" flags pkg)))
    "flatpak" (sh "flatpak" "install" "-y" (or (some-> (.-env js/process) .-FLATPAK_REMOTE) "flathub") pkg)
    "nix"     (sh "nix" "profile" "install" (str "nixpkgs#" pkg))

    ;; Node ecosystem
    "volta"   (sh "volta" "install" pkg)
    "npm"     (sh "npm" "install" "-g" pkg)
    "pnpm"    (sh "pnpm" "add" "-g" pkg)
    "yarn"    (sh "yarn" "global" "add" pkg)

    ;; Python
    "pipx"    (sh "pipx" "install" pkg)
    "pip"     (if (has? "python3")
                (sh "python3" "-m" "pip" "install" "--user" pkg)
                (sh "python"  "-m" "pip" "install" "--user" pkg))

    ;; Rust
    "cargo"   (sh "cargo" "install" pkg)

    ;; Go tools
    "go"      (let [pkg* (if (re-find #"[/@]" pkg) pkg (str pkg "@latest"))]
                (sh "go" "install" pkg*))

    ;; Ruby
    "gem"     (sh "gem" "install" pkg)

    ;; default / unknown
    (do (js/console.error (str "pm-install: unknown manager '" mgr "'"))
        2)))

(def ^:private mgr-order
  ["brew" "apt" "dnf" "pacman" "zypper" "snap" "flatpak" "nix"
   "volta" "npm" "pnpm" "yarn"
   "pipx" "pip"
   "cargo" "go"
   "gem"])

(defn pm-install
  "pm-install [opts pkg ...]
   opts: {:mgr <string>  ; force a manager
          :verbose? true}
   Tries managers in order until one succeeds per pkg."
  ([pkg] (pm-install {} pkg))
  ([opts & pkgs]
   (let [{:keys [mgr]} opts
         pick (fn [] (if mgr [mgr] (filter has? mgr-order)))]
     (when (empty? pkgs)
       (throw (ex-info "usage: (pm-install {:mgr \"brew\"} \"ripgrep\" ...)" {})))
     (doseq [p pkgs]
       (let [candidates (pick)]
         (if (empty? candidates)
           (do (js/console.error (str "pm-install: no known managers available for '" p "'"))
               (throw (ex-info "no managers available" {:package p})))
           (loop [[m & ms] candidates]
             (when m
               (let [code (pm-install-with m p)]
                 (if (zero? code)
                   (js/console.log (str "[ok] " p " via " m))
                   (if (seq ms)
                     (do (js/console.warn (str "[retry] " p " via " m " failed, trying next"))
                         (recur ms))
                     (throw (ex-info (str "install failed for " p)
                                     {:package p :last-manager m :exit code})))))))))))
   nil))

;; --- helpers that mirror the bash API ---------------------------------------
(defn maybe-missing
  "If (command) is missing, run (apply f args...). Returns f's exit code or 0."
  [command f & args]
  (if (has? command)
    0
    (apply f args)))

(defn ensure-cmd
  "Ensure a command is present by attempting install with pm-install, using cmd as pkg."
  [cmd]
  (when-not (has? cmd)
    (pm-install {} cmd))
  nil)

;; --- tiny CLI bridge (optional) ---------------------------------------------
;; Examples:
;;   nbb pm_install.cljs -- maybe true echo Hello
;;   nbb pm_install.cljs -- ensure-cmd rg
;;   nbb pm_install.cljs -- pm-install ripgrep
;;   nbb pm_install.cljs -- pm-install --mgr volta pnpm
(when (= (.-id js/module) ".")
  (let [[_script & argv] (js->clj (.-argv js/process))
        usage #(do (println "Usage:")
                   (println "  nbb pm_install.cljs -- maybe <bool> <cmd> [args...]")
                   (println "  nbb pm_install.cljs -- ensure-cmd <cmd>")
                   (println "  nbb pm_install.cljs -- pm-install [--mgr <mgr>] <pkg> [pkg...]")
                   (js/process.exit 2))]
    (when (empty? argv) (usage))
    (let [[sub & rest] argv]
      (case sub
        "maybe"
        (let [[flag cmd & args] rest]
          (when (or (nil? flag) (nil? cmd)) (usage))
          (js/process.exit (apply maybe flag cmd args)))

        "ensure-cmd"
        (let [[cmd] rest]
          (when (nil? cmd) (usage))
          (ensure-cmd cmd)
          (js/process.exit 0))

        "pm-install"
        (let [[mflag mval & pkgs] rest
              [opts pkgs*] (if (= mflag "--mgr")
                             [{:mgr mval} pkgs]
                             [{} (cons mflag mval)])]
          (apply pm-install opts pkgs*)
          (js/process.exit 0))

        (usage))))))
