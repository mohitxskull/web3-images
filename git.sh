#!/bin/bash

VERSION="0.9"

echo ""
echo -e "\e[32mGit script v$VERSION\e[0m"

file_url="https://raw.githubusercontent.com/mohitxskull/scripts/main/src/git.src.sh"
self_url="https://raw.githubusercontent.com/mohitxskull/scripts/main/git.sh"
store="$HOME/.sbs"
lu="$store/lu"

# if file is Empty, delete it
if [ -f "$store/$(basename "$file_url")" ] && [ ! -s "$store/$(basename "$file_url")" ]; then
    rm "$store/$(basename "$file_url")"
fi

if [ ! -d "$store" ]; then
    mkdir "$store"
fi

if [ ! -f "$lu" ]; then
    touch "$lu"
    echo 0 >"$lu"
fi

# self update -s flag
if [ "$1" = "-s" ]; then
    echo "" && echo -e "\e[32mUpdating self...\e[0m" && echo ""
    curl -H "Cache-Control: no-cache" -s "$self_url" >"$0"
    chmod +x "$0"
    exit
fi

# -u flag to update file
if [ ! -f "$store/$(basename "$file_url")" ] || [ "$(date +%s)" -gt "$(($(cat "$lu") + 86400))" ] || [ "$1" = "-u" ]; then
    echo "" && echo -e "\e[32mUpdating file...\e[0m" && echo ""
    # use -H to avoid caching, add max-time to avoid hanging
    curl -H "Cache-Control: no-cache" -s "$file_url" >"$store/$(basename "$file_url")"
    echo "$(date +%s)" >"$lu"
fi

bash "$store/$(basename "$file_url")" "$@"
