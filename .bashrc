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
OSH_THEME="minimal-dark"

# If you set OSH_THEME to "random", you can ignore themes you don't like.
# OMB_THEME_RANDOM_IGNORED=("powerbash10k" "wanelo")
# You can also specify the list from which a theme is randomly selected:
# OMB_THEME_RANDOM_CANDIDATES=("font" "powerline-light" "minimal")

# Uncomment the following line to use case-sensitive completion.
# OMB_CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion. Case
# sensitive completion must be off. _ and - will be interchangeable.
# OMB_HYPHEN_SENSITIVE="false"

# Uncomment the following line to disable bi-weekly auto-update checks.
# DISABLE_AUTO_UPDATE="true"

# Uncomment the following line to change how often to auto-update (in days).
# export UPDATE_OSH_DAYS=13

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you don't want the repository to be considered dirty
# if there are untracked files.
# SCM_GIT_DISABLE_UNTRACKED_DIRTY="true"

# Uncomment the following line if you want to completely ignore the presence
# of untracked files in the repository.
# SCM_GIT_IGNORE_UNTRACKED="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.  One of the following values can
# be used to specify the timestamp format.
# * 'mm/dd/yyyy'     # mm/dd/yyyy + time
# * 'dd.mm.yyyy'     # dd.mm.yyyy + time
# * 'yyyy-mm-dd'     # yyyy-mm-dd + time
# * '[mm/dd/yyyy]'   # [mm/dd/yyyy] + [time] with colors
# * '[dd.mm.yyyy]'   # [dd.mm.yyyy] + [time] with colors
# * '[yyyy-mm-dd]'   # [yyyy-mm-dd] + [time] with colors
# If not set, the default value is 'yyyy-mm-dd'.
# HIST_STAMPS='yyyy-mm-dd'

# Uncomment the following line if you do not want OMB to overwrite the existing
# aliases by the default OMB aliases defined in lib/*.sh
# OMB_DEFAULT_ALIASES="check"

# Would you like to use another custom folder than $OSH/custom?
# OSH_CUSTOM=/path/to/new-custom-folder

# To disable the uses of "sudo" by oh-my-bash, please set "false" to
# this variable.  The default behavior for the empty value is "true".
OMB_USE_SUDO=true

# To enable/disable display of Python virtualenv and condaenv
# OMB_PROMPT_SHOW_PYTHON_VENV=true  # enable
# OMB_PROMPT_SHOW_PYTHON_VENV=false # disable

# To enable/disable Spack environment information
# OMB_PROMPT_SHOW_SPACK_ENV=true  # enable
# OMB_PROMPT_SHOW_SPACK_ENV=false # disable

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

# If you want to reduce the initialization cost of the "tput" command to
# initialize color escape sequences, you can uncomment the following setting.
# This disables the use of the "tput" command, and the escape sequences are
# initialized to be the ANSI version:
#
#OMB_TERM_USE_TPUT=no

source "$OSH"/oh-my-bash.sh

# User configuration
# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
export EDITOR="emacsclient -c"

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# ssh
# export SSH_KEY_PATH="~/.ssh/rsa_id"

# Set personal aliases, overriding those provided by oh-my-bash libs,
# plugins, and themes. Aliases can be placed here, though oh-my-bash
# users are encouraged to define aliases within the OSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias bashconfig="mate ~/.bashrc"
# alias ohmybash="mate ~/.oh-my-bash"
export CFG_BRANCH_NAME=device/$HOSTNAME
alias cfg="git --git-dir=$HOME/.cfg --work-tree=$HOME"

export CFG_BRANCH_NAME=device/$HOSTNAME

# Backup dotfiles

# if the cfg repo is not initialized yet
if [ ! -d $HOME/.cfg ]; then
    git clone --bare
fi

# --- Hide hostname in Oh-My-Bash prompt (put this after oh-my-bash.sh) ---
# Remove "user@host" → keep just "user" (handles \u@\h and lone \h/\H)
PS1="${PS1//@\\h/}"    # drops the "@\h" part if present
PS1="${PS1//\\h/}"     # drops any remaining "\h"
PS1="${PS1//\\H/}"     # drops any "\H" (FQDN) just in case

# # pnpm
# source ~/.bash_profile
export JAVA_OPTS="-Xmx2g -Xms1g"
export JVM_OPTS="-Xmx2g -Xms1g"
export LEIN_JVM_OPTS="-Xmx2g -Xms1g"
export SHADOW_CLJS_JVM_OPTS="-Xmx2g -Xms1g"
export NODE_OPTIONS="--max-old-space-size=4096"
export SHADOW_CLJS_JAVA_OPTS="-Xmx2g -Xms1g"
export NODE_OPTIONS="--max-old-space-size=8192"
export JAVA_OPTS="-Xmx4g -Xms2g"

# If not alredy on the correct branch
if [ "$(cfg rev-parse --abbrev-ref HEAD)" != "$CFG_BRANCH_NAME" ]; then
    cfg checkout -b $CFG_BRANCH_NAME
fi


## If the remote is not set yet
if ! cfg remote | grep origin; then
    cfg remote add origin git@github.com:riatzukiza/dotfiles.git
fi

cfg pull origin $CFG_BRANCH_NAME
cfg add ~/.bashrc ~/.gitconfig ~/.config/i3/config \
    ~/.config/i3/conf.d/ \
    ~/.config/espanso/ \
    ~/.config/alacritty/alacritty.toml \
    ~/.config/nvim/init.vim \
    ~/.config/fontconfig/fonts.conf \
    ~/.config/htop/htoprc \
    ~/.config/picom/picom.conf \
    ~/.config/opencode/plugin/ \
    ~/.config/opencode/agent/ \
    ~/.config/opencode/command/ \
    ~/.config/opencode/opencode.json \
    ~/.config/opencode/AGENTS.md \
    ~/.spacemacs \
    ~/.profile \
    ~/.bash_profile


cfg commit -m "backup"
cfg push -u origin $CFG_BRANCH_NAME

vterm_printf(){
    printf "\e]%s\e\\" "$1"
}
vterm_prompt_end(){
    vterm_printf "51;A$(whoami)@$(hostname):$(pwd)"
}
vterm_prompt_precmd() { vterm_printf "A${USER}@${HOSTNAME}:$(pwd)"; }
PS1=$PS1'\[$(vterm_prompt_end)\]'
if [ -n "$BASH_VERSION" ]; then
    PROMPT_COMMAND="vterm_prompt_precmd${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi

PATH="$PATH:/home/err/bin"

# Added by setup-native-node-build.sh
export PATH="/home/err/devel/promethean/.volta/tools/image/node/20.19.4/bin:$PATH"
. "$HOME/.cargo/env"
# pnpm
export PNPM_HOME="/home/err/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end

# opencode
# export PATH=/home/err/.opencode/bin:$PATH
# export PATH=/home/err/devel/stt/opencode/packages/opencode/dist/opencode-linux-x64/bin:$PATH
source ~/.pnpm-completion.bash
export JAVA_OPTS="-Xmx6g -Xms3g"
export NODE_OPTIONS="--max-old-space-size=10240"

PS1=$PS1'\[$(vterm_prompt_end)\]'
if [ -n "$BASH_VERSION" ]; then
    PROMPT_COMMAND="vterm_prompt_precmd${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi

PATH="$PATH:/home/err/bin"

# Added by setup-native-node-build.sh
export PATH="/home/err/devel/promethean/.volta/tools/image/node/20.19.4/bin:$PATH"
. "$HOME/.cargo/env"

# opencode
# export PATH=/home/err/.opencode/bin:$PATH
# export PATH=/home/err/devel/stt/opencode/packages/opencode/dist/opencode-linux-x64/bin:$PATH
source ~/.pnpm-completion.bash


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
if ! [[ "${PROMPT_COMMAND:-}" =~ _direnv_hook ]]; then
  PROMPT_COMMAND="_direnv_hook${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi
export PATH="$PATH:/home/err/devel/bin"
