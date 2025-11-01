# helper: does command exist?

# pm_install [--mgr <mgr>] <pkg> [pkg...]
# Auto-picks from: brew, apt/apt-get, dnf, pacman, zypper, snap, flatpak, nix,
#                  volta, npm, pnpm, yarn, pipx/pip, cargo, go, gem
pm_install() {
  local mgr=""
  if [ "${1-}" = "--mgr" ] && [ -n "${2-}" ]; then mgr="$2"; shift 2; fi
  [ $# -ge 1 ] || { echo "usage: pm_install [--mgr <mgr>] <pkg> [pkg...]" >&2; return 2; }

  local pkg
  for pkg in "$@"; do
    if [ -n "$mgr" ]; then pm_install_with "$mgr" "$pkg" && continue; fi

    # Try system managers first
    has brew   && pm_install_with brew   "$pkg" && continue
    (has apt-get || has apt) && pm_install_with apt "$pkg" && continue
    has dnf    && pm_install_with dnf    "$pkg" && continue
    has pacman && pm_install_with pacman "$pkg" && continue
    has zypper && pm_install_with zypper "$pkg" && continue
    has snap   && pm_install_with snap   "$pkg" && continue
    has flatpak&& pm_install_with flatpak"$pkg" && continue
    has nix    && pm_install_with nix    "$pkg" && continue

    # Then language/userland managers
    has volta  && pm_install_with volta  "$pkg" && continue
    has npm    && pm_install_with npm    "$pkg" && continue
    has pnpm   && pm_install_with pnpm   "$pkg" && continue
    has yarn   && pm_install_with yarn   "$pkg" && continue
    has pipx   && pm_install_with pipx   "$pkg" && continue
    (has pip3 || has pip) && pm_install_with pip "$pkg" && continue
    has cargo  && pm_install_with cargo  "$pkg" && continue
    has go     && pm_install_with go     "$pkg" && continue
    has gem    && pm_install_with gem    "$pkg" && continue

    echo "pm_install: no known package manager handled '$pkg'." >&2
    return 1
  done
}

# internal: run a specific manager; return nonzero on failure so callers can fall back
pm_install_with() {
  local mgr="$1"; shift
  local pkg="$1"

  case "$mgr" in
    brew)    brew install "$pkg" ;;

    apt|apt-get)
      if has apt-get; then
        if [ -z "${__PM_APT_UPDATED:-}" ]; then sudo apt-get update && __PM_APT_UPDATED=1; fi
        sudo apt-get install -y "$pkg"
      else
        if [ -z "${__PM_APT_UPDATED:-}" ]; then sudo apt update && __PM_APT_UPDATED=1; fi
        sudo apt install -y "$pkg"
      fi ;;

    dnf)     sudo dnf install -y "$pkg" ;;
    pacman)  sudo pacman -S --noconfirm --needed "$pkg" ;;
    zypper)  sudo zypper --non-interactive install "$pkg" ;;
    snap)    sudo snap install ${SNAP_FLAGS:-} "$pkg" ;;
    flatpak) flatpak install -y ${FLATPAK_REMOTE:-flathub} "$pkg" ;;
    nix)     nix profile install "nixpkgs#$pkg" ;;

    # Node ecosystem
    volta)   volta install "$pkg" ;;
    npm)     npm install -g "$pkg" ;;
    pnpm)    pnpm add -g "$pkg" ;;
    yarn)    yarn global add "$pkg" ;;

    # Python apps
    pipx)    pipx install "$pkg" ;;
    pip)     if has python3; then python3 -m pip install --user "$pkg"; else python -m pip install --user "$pkg"; fi ;;

    # Rust crates
    cargo)   cargo install "$pkg" ;;

    # Go tools (accept module[@ver]; if no @, default to @latest when it looks like a module path)
    go)
      case "$pkg" in
        *@*)  go install "$pkg" ;;
        */*)  go install "${pkg}@latest" ;;
        *)    echo "pm_install(go): provide a module path (e.g. github.com/tj/gron) or name@version" >&2; return 2 ;;
      esac ;;

    # Ruby gems
    gem)     gem install "$pkg" ;;

    *)       echo "pm_install: unknown manager '$mgr'" >&2; return 2 ;;
  esac
}


# Install by command name (tries to guess the right package name == command name)
ensure_cmd() {
  local cmd="$1"; shift
  has "$cmd" || pm_install "$cmd"
}
