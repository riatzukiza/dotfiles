;; -*- mode: emacs-lisp; lexical-binding: t -*-
;; This file is loaded by Spacemacs at startup.
;; It must be stored in your home directory.

(defun dotspacemacs/layers ()
  "Layer configuration:
This function should only modify configuration layer settings."
  (setq-default
   dotspacemacs-distribution 'spacemacs

   dotspacemacs-enable-lazy-installation 'unused

   dotspacemacs-ask-for-lazy-installation t

   dotspacemacs-configuration-layer-path '("~/devel/promethean/.emacs/layers/")

   dotspacemacs-configuration-layers
   '(purescript
     aider
     direnv
     openai
     sql
     nginx
     (clojure :variables
              clojure-enable-fancify-symbols t
              clojure-enable-linters t)
     vimscript
     systemd
     react
     python
     common-lisp
     (typescript :variables
                 typescript-linter 'eslint
                 typescript-fmt-on-save t
                 typescript-fmt-tool 'prettier
                 node-add-modules-path t
                 )
     (javascript :variables
                 javascript-fmt-tool 'prettier
                 node-add-modules-path t
                 )
     ;;opencode-agent-shell
     html
     toml
     yaml
     ;; company
     auto-completion
     (better-defaults :variables relative-line-numbers t)
     emacs-lisp
     git
     helm
     lsp
     markdown
     multiple-cursors
     ;; eww
     org
     github-copilot

     prom-unique
     (shell :variables
            shell-default-height 30
            shell-default-position 'bottom
            shell-default-shell 'vterm)
     spell-checking
     syntax-checking
     version-control
     (llm-client :variables llm-client-enable-ellama t
                 llm-client-enable-gptel t)

     treemacs


     llm
     codex

     promethean
     err-core
     err-ts
     err-commonlisp
     )

   dotspacemacs-additional-packages '(yasnippet-snippets prettier-js lsp-sonarlint obsidian)
   dotspacemacs-frozen-packages '()
   dotspacemacs-excluded-packages '()

   dotspacemacs-install-packages 'used-only))

(defun dotspacemacs/init ()
  "Initialization:
This function is called at the very beginning of Spacemacs startup,
before layer configuration.
It should only modify the values of Spacemacs settings."
  (setq-default
   dotspacemacs-elpa-timeout 5
   dotspacemacs-gc-cons '(100000000 0.1)
   dotspacemacs-read-process-output-max (* 1024 1024)
   dotspacemacs-use-spacelpa nil

   dotspacemacs-verify-spacelpa-archives t

   dotspacemacs-check-for-update nil

   dotspacemacs-elpa-subdirectory 'emacs-version

   dotspacemacs-editing-style 'vim

   dotspacemacs-startup-buffer-show-version t

   dotspacemacs-startup-banner 'official

   dotspacemacs-startup-banner-scale 'auto

   ;; List of items to show in startup buffer or an association list of
   ;; the form `(list-type . list-size)`. If nil then it is disabled.
   ;; Possible values for list-type are:
   ;; `recents' `recents-by-project' `bookmarks' `projects' `agenda' `todos'.
   ;; List sizes may be nil, in which case
   ;; `spacemacs-buffer-startup-lists-length' takes effect.
   ;; The exceptional case is `recents-by-project', where list-type must be a
   ;; pair of numbers, e.g. `(recents-by-project . (7 .  5))', where the first
   ;; number is the project limit and the second the limit on the recent files
   ;; within a project.
   dotspacemacs-startup-lists '((recents . 5)
                                (projects . 7)
                                (bookmarks . 5)
                                (agenda . 5)
                                (todos . 5)
                                (recents-by-project . (5 . 5))

                                )

   dotspacemacs-startup-buffer-responsive t

   dotspacemacs-show-startup-list-numbers t

   dotspacemacs-startup-buffer-multi-digit-delay 0.4

   dotspacemacs-startup-buffer-show-icons nil

   dotspacemacs-new-empty-buffer-major-mode 'org-mode

   dotspacemacs-scratch-mode 'text-mode

   dotspacemacs-scratch-buffer-persistent t

   dotspacemacs-scratch-buffer-unkillable t

   dotspacemacs-initial-scratch-message "Happy hacking, err!"

   dotspacemacs-themes '(monokai
                         spacemacs-dark
                         spacemacs-light)

   ;; Set the theme for the Spaceline. Supported themes are `spacemacs',
   ;; `all-the-icons', `custom', `doom', `vim-powerline' and `vanilla'. The
   ;; first three are spaceline themes. `doom' is the doom-emacs mode-line.
   ;; `vanilla' is default Emacs mode-line. `custom' is a user defined themes,
   ;; refer to the DOCUMENTATION.org for more info on how to create your own
   ;; spaceline theme. Value can be a symbol or list with additional properties.
   ;; (default '(spacemacs :separator wave :separator-scale 1.5))
   dotspacemacs-mode-line-theme '(spacemacs :separator wave :separator-scale 1.5)

   ;; If non-nil the cursor color matches the state color in GUI Emacs.
   ;; (default t)
   dotspacemacs-colorize-cursor-according-to-state t

   dotspacemacs-default-font '("Source Code Pro"
                               :size 10.0
                               :weight normal
                               :width normal)

   dotspacemacs-default-icons-font 'all-the-icons

   dotspacemacs-leader-key "SPC"

   dotspacemacs-emacs-command-key "SPC"

   dotspacemacs-ex-command-key ":"

   dotspacemacs-emacs-leader-key "M-m"

   dotspacemacs-major-mode-leader-key ","

   dotspacemacs-major-mode-emacs-leader-key (if window-system "M-<return>" "C-M-m")

   dotspacemacs-distinguish-gui-tab nil

   dotspacemacs-default-layout-name "Default"

   dotspacemacs-display-default-layout nil

   dotspacemacs-auto-resume-layouts nil

   dotspacemacs-auto-generate-layout-names nil

   dotspacemacs-large-file-size 1

   dotspacemacs-auto-save-file-location 'cache

   dotspacemacs-max-rollback-slots 5

   dotspacemacs-enable-paste-transient-state t

   dotspacemacs-which-key-delay 0.4

   dotspacemacs-which-key-position 'bottom

   dotspacemacs-switch-to-buffer-prefers-purpose nil

   dotspacemacs-maximize-window-keep-side-windows t

   dotspacemacs-enable-load-hints nil

   dotspacemacs-enable-package-quickstart nil

   dotspacemacs-loading-progress-bar t

   dotspacemacs-fullscreen-at-startup nil

   dotspacemacs-fullscreen-use-non-native nil

   dotspacemacs-maximized-at-startup t

   dotspacemacs-undecorated-at-startup nil

   dotspacemacs-active-transparency 80

   dotspacemacs-inactive-transparency 65

   dotspacemacs-background-transparency 60

   dotspacemacs-show-transient-state-title t

   dotspacemacs-show-transient-state-color-guide t

   dotspacemacs-mode-line-unicode-symbols t

   dotspacemacs-smooth-scrolling t

   dotspacemacs-scroll-bar-while-scrolling t

   dotspacemacs-line-numbers 'relative

   dotspacemacs-folding-method 'evil

   dotspacemacs-smartparens-strict-mode nil

   dotspacemacs-activate-smartparens-mode t

   dotspacemacs-smart-closing-parenthesis nil

   dotspacemacs-highlight-delimiters 'all

   dotspacemacs-enable-server nil

   dotspacemacs-server-socket-dir nil

   dotspacemacs-persistent-server nil

   dotspacemacs-search-tools '("rg" "grep")

   dotspacemacs-undo-system 'undo-fu

   dotspacemacs-frame-title-format "%I@%S"

   dotspacemacs-icon-title-format nil

   dotspacemacs-show-trailing-whitespace t

   dotspacemacs-whitespace-cleanup 'trailing

   dotspacemacs-use-clean-aindent-mode t

   dotspacemacs-use-SPC-as-y nil

   dotspacemacs-swap-number-row nil

   dotspacemacs-zone-out-when-idle nil

   dotspacemacs-pretty-docs nil

   dotspacemacs-home-shorten-agenda-source nil

   dotspacemacs-byte-compile nil))

(defun dotspacemacs/user-env ()
  "Environment variables setup.
This function defines the environment variables for your Emacs session. By
default it calls `spacemacs/load-spacemacs-env' which loads the environment
variables declared in `~/.spacemacs.env' or `~/.spacemacs.d/.spacemacs.env'.
See the header of this file for more information."
  (spacemacs/load-spacemacs-env)
  )

(defun dotspacemacs/user-init ()
  "Initialization for user code:
This function is called immediately after `dotspacemacs/init', before layer
configuration.
It is mostly for variables that should be set before packages are loaded.
If you are unsure, try setting them in `dotspacemacs/user-config' first."
  )

(defun dotspacemacs/user-config ()
  "Configuration for user code:
This function is called at the very end of Spacemacs startup, after layer
configuration.
Put your configuration code here, except for variables that should be set
before packages are loaded."
  ;; before starting lsp
  (setenv "PAGER" "cat")
  (setenv "MANPAGER" "cat")


  (global-flycheck-mode)
  ;; Map TS tree-sitter modes to VSCode language IDs ESLint expects


  ;; (use-package lsp-ui
  ;;   :after lsp-mode
  ;;   :init (setq lsp-ui-sideline-enable t
  ;;               lsp-ui-sideline-show-diagnostics t
  ;;               lsp-ui-doc-enable t))
  ;; Show the abbreviated path (or buffer name) of every window in the frame.
  ;; Titles look like: ~/proj/a/foo.ts │ ~/proj/b/bar.ts │ *scratch*
  (setq frame-title-format
        '(:eval
          (let* ((wins  (window-list (selected-frame) 'nomini)) ; no minibuffer
                 (paths (mapcar (lambda (w)
                                  (with-current-buffer (window-buffer w)
                                    (cond
                                     (buffer-file-name
                                      (abbreviate-file-name buffer-file-name))
                                     (default-directory
                                      (abbreviate-file-name default-directory))
                                     (t (format "*%s*" (buffer-name))))))
                                wins))
                 (joined (mapconcat #'identity (delete-dups paths) " │ ")))
            ;; keep it sane for WMs/launchers; tail-ellipsis if too long
            (truncate-string-to-width joined 200 nil nil "…"))))

  ;; Optional: when iconified, keep the same info in the taskbar/dock entry.
  (setq icon-title-format frame-title-format)




  )


;; Do not write anything past this comment. This is where Emacs will
;; auto-generate custom variable definitions.
(defun dotspacemacs/emacs-custom-settings ()
  "Emacs custom settings.
This is an auto-generated function, do not modify its content directly, use
Emacs customize menu instead.
This function is called at the very end of Spacemacs initialization."
  (custom-set-variables
   ;; custom-set-variables was added by Custom.
   ;; If you edit it by hand, you could mess it up, so be careful.
   ;; Your init file should contain only one such instance.
   ;; If there is more than one, they won't work right.
   '(package-selected-packages
     '(a ace-link acp add-node-modules-path agent-shell aggressive-indent aio alert
         all-the-icons auctex auto-compile auto-highlight-symbol auto-yasnippet
         avy-jump-helm-line browse-at-remote centered-cursor-mode cider
         cider-eval-sexp-fu clean-aindent-mode clojure-mode clojure-snippets
         closql code-cells code-review column-enforce-mode company company-web
         consult consult-lsp consult-omni copilot copilot-chat cython-mode
         dactyl-mode deferred define-word devdocs diff-hl diminish
         dired-quick-sort direnv disable-mouse dotenv-mode drag-stuff dumb-jump
         eat edit-indirect elgrep elisp-def elisp-demos elisp-slime-nav ellama
         emacsql emmet-mode emojify emr esh-help eshell-prompt-extras eshell-z
         eval-sexp-fu evil-anzu evil-args evil-cleverparens evil-collection
         evil-easymotion evil-escape evil-evilified-state evil-exchange
         evil-goggles evil-iedit-state evil-indent-plus evil-lion evil-lisp-state
         evil-matchit evil-mc evil-nerd-commenter evil-numbers evil-org
         evil-surround evil-textobj-line evil-tutor evil-unimpaired
         evil-visual-mark-mode evil-visualstar expand-region eyebrowse
         fancy-battery flycheck flycheck-elsa flycheck-package flycheck-pos-tip
         flyspell-correct flyspell-correct-helm forge gh-md ghub git-link
         git-messenger git-modes git-timemachine gitignore-templates gntp gnuplot
         golden-ratio google-translate gptel gptel-mcp gptel-quick haml-mode
         helm-ag helm-c-yasnippet helm-cider helm-comint helm-company
         helm-css-scss helm-descbinds helm-git-grep helm-ls-git helm-lsp helm-make
         helm-mode-manager helm-org helm-org-rifle helm-projectile helm-purpose
         helm-pydoc helm-swoop helm-themes helm-xref hide-comnt
         highlight-indentation highlight-numbers highlight-parentheses hl-todo
         holy-mode htmlize hungry-delete hybrid-mode impatient-mode indent-guide
         info+ inheritenv inspector journalctl-mode json-mode json-navigator
         json-reformat json-snatcher link-hint live-py-mode llama llm
         load-env-vars log4e lorem-ipsum lsp-eslint lsp-mode lsp-origami
         lsp-sonarlint lsp-treemacs lsp-ui macrostep magit magit-section
         markdown-mode markdown-toc mcp monokai-theme multi-line multi-term
         multi-vterm mwim nameless nginx-mode obsidian open-junk-file
         org-category-capture org-cliplink org-contrib org-download org-mime
         org-pomodoro org-present org-project-capture org-projectile org-rich-yank
         org-superstar orgit orgit-forge origami overseer package-lint
         page-break-lines paradox parseclj parseedn password-generator pcre2el
         persistent-scratch pip-requirements pipenv pippel plz plz-event-source
         plz-media-type poetry polymode popwin pos-tip psc-ide psci pug-mode
         purescript-mode py-isort pydoc pyenv-mode pylookup pytest python-pytest
         pythonic pyvenv queue quickrun rainbow-delimiters request restart-emacs
         rjsx-mode sass-mode scss-mode sem sesman shell-maker shell-pop slim-mode
         smeargle space-doc spaceline spacemacs-purpose-popwin
         spacemacs-whitespace-cleanup sphinx-doc sql-indent sqlup-mode
         string-edit-at-point string-inflection symbol-overlay symon systemd
         tagedit term-cursor terminal-here texfrag toc-org toml-mode transient
         treemacs-evil treemacs-icons-dired treemacs-magit treemacs-persp
         treemacs-projectile treepy treesit-auto undo-fu undo-fu-session unfill
         unkillable-scratch uuidgen vi-tilde-fringe vimrc-mode volatile-highlights
         vterm vundo web-beautify web-completion-data web-mode wgrep winum
         with-editor writeroom-mode ws-butler yaml yaml-mode yasnippet
         yasnippet-snippets))
   '(package-vc-selected-packages
     '((agent-shell :url "https://github.com/xenodium/agent-shell")))
   '(safe-local-variable-values
     '((prom/unique-mode-targets (markdown-mode :dir "docs/inbox" :ext ".md")
                                 (org-mode :dir "docs/inbox" :ext ".org")
                                 (text-mode :dir "docs/text" :ext ".txt")
                                 (js-mode :dir "pseudo/inbox" :ext ".js")
                                 (typescript-ts-mode :dir "pseudo/inbox" :ext
                                                     ".ts"))
       (prom/unique-default-dir . "docs/unique")
       (prom/unique-doc-format . "%Y.%m.%d.%H.%M.%S")
       (eval promethean-lsp-append-gitignore-to-ignored-dirs)
       (typescript-backend . tide) (typescript-backend . lsp)
       (javascript-backend . tide) (javascript-backend . tern)
       (javascript-backend . lsp))))
  (custom-set-faces
   ;; custom-set-faces was added by Custom.
   ;; If you edit it by hand, you could mess it up, so be careful.
   ;; Your init file should contain only one such instance.
   ;; If there is more than one, they won't work right.
   )
  )
