
# . "$HOME/.cargo/env"

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

export PNPM_HOME="/home/err/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end

[ -f ~/.fzf.bash ] && source ~/.fzf.bash
# Load pyenv automatically by appending
# the following to
# ~/.bash_profile if it exists, otherwise ~/.profile (for login shells)
# and ~/.bashrc (for interactive shells) :

export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init - bash)"

# Restart your shell for the changes to take effect.

# Load pyenv-virtualenv automatically by adding
# the following to ~/.bashrc:

eval "$(pyenv virtualenv-init -)"
export LIBPYTHON=/home/err/.pyenv/versions/3.12.1/lib/libpython3.12.so

alias cfg="git --git-dir=$HOME/.cfg --work-tree=$HOME"
export CFG_BRANCH_NAME=device/$HOSTNAME

# Backup dotfiles

# if the cfg repo is not initialized yet
if [ ! -d $HOME/.cfg ]; then
    git clone --bare
fi

# # If not alredy on the correct branch
# if [ "$(cfg rev-parse --abbrev-ref HEAD)" != "$CFG_BRANCH_NAME" ]; then
#     cfg checkout -b $CFG_BRANCH_NAME
# fi


# ## If the remote is not set yet
# if ! cfg remote | grep origin; then
#     cfg remote add origin git@github.com:riatzukiza/dotfiles.git
# fi

# cfg pull origin $CFG_BRANCH_NAME
# cfg add ~/.bashrc ~/.gitconfig ~/.config/i3/config \
#     ~/.config/i3/conf.d/ \
#     ~/.config/espanso/ \
#     ~/.config/alacritty/alacritty.toml \
#     ~/.config/nvim/init.vim \
#     ~/.config/fontconfig/fonts.conf \
#     ~/.config/htop/htoprc \
#     ~/.config/picom/picom.conf \
#     ~/.config/opencode/plugin/ \
#     ~/.config/opencode/agent/ \
#     ~/.config/opencode/command/ \
#     ~/.config/opencode/opencode.json \
#     ~/.config/opencode/AGENTS.md \
#     ~/.spacemacs \
#     ~/.profile \
#     ~/.bash_profile


# cfg commit -m "backup"
# cfg push -u origin $CFG_BRANCH_NAME

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
# . "$HOME/.cargo/env"

# opencode
# export PATH=/home/err/.opencode/bin:$PATH
# export PATH=/home/err/devel/stt/opencode/packages/opencode/dist/opencode-linux-x64/bin:$PATH
# source ~/.pnpm-completion.bash
