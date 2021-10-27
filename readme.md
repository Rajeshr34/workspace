```
npx lerna init
git init
yarn
#add ("npmClient": "yarn",) in lerna.json
```

```
create .gitignore add below
--------------------------------
# Dependency directories
# Dependency directories
node_modules/
lerna-debug.log
```

```
create .editorconfig add below
--------------------------------
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = tab
insert_final_newline = true
max_line_length = 120
tab_width = 4
trim_trailing_whitespace = true

```

```
create .gitattributes add below
--------------------------------
# Set default behavior to automatically normalize line endings.
* text=auto eol=lf
# git rm --cached -r .  # Remove every file from git's index.
# git reset --hard      # Rewrite git's index to pick up all the new line endings.

```

```
create .yarnrc add below
--------------------------------
```

```
yarn add husky -d
yarn add lint-staged -d
yarn add prettier -d
yarn add @commitlint/config-conventional @commitlint/cli -d
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js

npx husky install
npx husky add .husky/pre-commit "npm test"
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'


npm install tsdx -g
```
