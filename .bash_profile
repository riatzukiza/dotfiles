
. "$HOME/.cargo/env"

# bun
emacs --daemon
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

# ~/.profile: executed by the command interpreter for login shells.
# This file is not read by bash(1), if ~/.bash_profile or ~/.bash_login
# exists.
# see /usr/share/doc/bash/examples/startup-files for examples.
# the files are located in the bash-doc package.

# the default umask is set in /etc/profile; for setting the umask
# for ssh logins, install and configure the libpam-umask package.
#umask 022

# if running bash

if [ -n "$BASH_VERSION" ]; then
    # include .bashrc if it exists
    if [ -f "$HOME/.bashrc" ]; then
	      . "$HOME/.bashrc"
    fi
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"

export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init - bash)"
export GTK_THEME=Yaru-dark
export QT_QPA_PLATFORMTHEME=qt5ct
export QT_STYLE_OVERRIDE=kvantum
. "$HOME/.cargo/env"
