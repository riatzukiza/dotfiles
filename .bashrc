# Enable the subsequent settings only in interactive sessions
case $- in
  *i*) ;;
    *) return;;
esac

# Path to your oh-my-bash installation.
export OSH='/home/err/.oh-my-bash'
# Optional: if your theme cached PS1 via PROMPT_COMMAND, re-apply on each prompt
# PROMPT_COMMAND=':'  # uncomment only if your theme keeps undoing the change


# Set name of the theme to load. Optionally, if you set this to "random"
# it'll load a random theme each time that oh-my-bash is loaded.
OSH_THEME="monokai"

OMB_USE_SUDO=true


# Which completions would you like to load? (completions can be found in ~/.oh-my-bash/completions/*)
# Custom completions may be added to ~/.oh-my-bash/custom/completions/
# Example format: completions=(ssh git bundler gem pip pip3)
# Add wisely, as too many completions slow down shell startup.
completions=(
  git
  composer
  ssh
  docker
  defaults
  npm
)

# Which aliases would you like to load? (aliases can be found in ~/.oh-my-bash/aliases/*)
# Custom aliases may be added to ~/.oh-my-bash/custom/aliases/
# Example format: aliases=(vagrant composer git-avh)
# Add wisely, as too many aliases slow down shell startup.
aliases=(
  general
)

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-bash/plugins/*)
# Custom plugins may be added to ~/.oh-my-bash/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(
  git
  bashmarks
)

# Which plugins would you like to conditionally load? (plugins can be found in ~/.oh-my-bash/plugins/*)
# Custom plugins may be added to ~/.oh-my-bash/custom/plugins/
# Example format:
#  if [ "$DISPLAY" ] || [ "$SSH" ]; then
#      plugins+=(tmux-autoattach)
#  fi


source "$OSH"/oh-my-bash.sh
# Backup dotfiles

# --- Hide hostname in Oh-My-Bash prompt (put this after oh-my-bash.sh) ---
# Remove "user@host" → keep just "user" (handles \u@\h and lone \h/\H)
PS1="${PS1//@\\h/}"    # drops the "@\h" part if present
PS1="${PS1//\\h/}"     # drops any remaining "\h"
PS1="${PS1//\\H/}"     # drops any "\H" (FQDN) just in case

PS1=$PS1'\[$(vterm_prompt_end)\]'
if [ -n "$BASH_VERSION" ]; then
    PROMPT_COMMAND="vterm_prompt_precmd${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi




PS1=$PS1'\[$(vterm_prompt_end)\]'
if [ -n "$BASH_VERSION" ]; then
    PROMPT_COMMAND="vterm_prompt_precmd${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi

if ! [[ "${PROMPT_COMMAND:-}" =~ _direnv_hook ]]; then
    PROMPT_COMMAND="_direnv_hook${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi


[ -f ~/.fzf.bash ] && source ~/.fzf.bash
. "$HOME/.cargo/env"

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

export PNPM_HOME="/home/err/.local/share/pnpm"
export PYENV_ROOT="$HOME/.pyenv"
export LIBPYTHON=/home/err/.pyenv/versions/3.12.1/lib/libpython3.12.so

export EDITOR='start_emacs_server && emacsclient -c'
export CFG_BRANCH_NAME=device/$HOSTNAME

export PATH="/home/err/devel/promethean/.volta/tools/image/node/20.19.4/bin:$PATH"
export PATH="$PATH:/home/err/bin"
export PATH="$HOME/.local/bin:$PATH"
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
export PATH="$PATH:/home/err/bin"
export PYENV_ROOT="$HOME/.pyenv"
export GTK_THEME=Yaru-dark
export QT_QPA_PLATFORMTHEME=qt5ct
export QT_STYLE_OVERRIDE=kvantum
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"

# bun
case ":$PATH:" in
    *":$PNPM_HOME:"*) ;;
    *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# emacs vterm stuff, might need it's own file later
PS1=$PS1'\[$(vterm_prompt_end)\]'
if [ -n "$BASH_VERSION" ]; then
    prompt_COMMAND="vterm_prompt_precmd${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi


source ~/.alias
vterm_printf(){
    printf "\e]%s\e\\" "$1"
}
vterm_prompt_end(){
    vterm_printf "51;A$(whoami)@$(hostname):$(pwd)"
}
vterm_prompt_precmd() { vterm_printf "A${USER}@${HOSTNAME}:$(pwd)"; }

_direnv_hook() {
    local previous_exit_status=$?;
    trap -- '' SIGINT;
    eval "$("/usr/bin/direnv" export bash)";
    trap - SIGINT;
    return $previous_exit_status;
};
start_emacs_server() {
    if ! (emacsclient -e '(server-running-p)'); then
        emacs --daemon
    fi
}
source ~/devel/promethean/git-subrepo-source/.rc
eval "$(pyenv init - bash)"
eval "$(pyenv virtualenv-init -)"
# backup-dotfiles-nbb
