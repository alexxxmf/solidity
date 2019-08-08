#!/usr/bin/env bash
jsFiles=(`find ./src -name "*.js"`)
if [[ ${#jsFiles[@]} -gt 0 ]]; then
    printf "%s\n" "${jsFiles[@]}"
    echo "Files must use Typescript"
    exit 1;
else
    exit 0;
fi
