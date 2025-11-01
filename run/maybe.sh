has() { command -v "$1" >/dev/null 2>&1; }
# maybe: run a command only if the first arg is "truthy"
# Truthy: 1, true, t, yes, y, on   (case-insensitive)
# Falsy:  0, false, f, no, n, off, ""  → no-op with exit 0
maybe() {
    if [ $# -eq 0 ]; then
        printf 'usage: maybe <bool> <cmd> [args...]\n' >&2
        return 2
    fi

    local flag="$1"; shift || true

    case "${flag,,}" in
        1|true|t|yes|y|on)  ;;                # proceed
        0|false|f|no|n|off|'') return 0 ;;     # no-op, success
        *) printf 'maybe: invalid boolean "%s"\n' "$flag" >&2; return 2 ;;
    esac

    if [ $# -eq 0 ]; then
        printf 'maybe: no command given\n' >&2
        return 2
    fi

    "$@"
}

# assumes your previously-defined `maybe` is loaded
maybe_missing() {
    local cmd="$1"; shift
    local missing=true
    command -v "$cmd" >/dev/null 2>&1 && missing=false
    maybe "$missing" "$@"
}

# examples
maybe_missing rg   sudo apt-get install -y ripgrep
