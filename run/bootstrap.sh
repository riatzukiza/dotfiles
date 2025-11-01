#!/usr/bin/env bash
set -euo pipefail

# 1) Bare repo alias
if ! grep -q 'alias cfg=' ~/.bashrc 2>/dev/null; then
    echo 'alias cfg="git --git-dir=$HOME/.cfg --work-tree=$HOME"' >> ~/.bashrc
fi

# 2) Clone bare repo if missing
if [ ! -d "$HOME/.cfg" ]; then
    git clone --bare git@github.com:riatzukiza/dotfiles.git "$HOME/.cfg"
    git --git-dir=$HOME/.cfg --work-tree=$HOME config status.showUntrackedFiles no
    if ! git --git-dir=$HOME/.cfg --work-tree=$HOME checkout; then
        mkdir -p ~/.backup-dotfiles
        git --git-dir=$HOME/.cfg --work-tree=$HOME checkout 2>&1 | egrep "\s+\." | awk '{print $1}' \
            | xargs -I{} sh -c 'mkdir -p ~/.backup-dotfiles && mv "$HOME/{}" ~/.backup-dotfiles/' || true
        git --git-dir=$HOME/.cfg --work-tree=$HOME checkout
    fi
fi
echo "Dotfiles bootstrapped. Reload your shell."

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
curl https://get.volta.sh | bash
volta install node
volta install pnpm
volta install bun
volta install yarn
volta install nbb
. install-clojure.sh
