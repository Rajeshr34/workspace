```
npm install commitizen -g
npx lerna init
git init
yarn
#add ("npmClient": "yarn",) in lerna.json
#append package.json
------------------
"lint-staged": {
  "*.{tsx,ts,js,css,md}": [
	"prettier --write"
  ]
}
------------------
```

```
create .gitignore add below
--------------------------------
# Dependency directories
node_modules/
lerna-debug.log
yarn-error.log
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
npm set-script prepare "husky install"
yarn add lint-staged -d
yarn add prettier -d
yarn add @commitlint/config-conventional @commitlint/cli -d
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js

npx husky install
npx husky add .husky/pre-commit "yarn lint-staged && npx lerna run --concurrency 1 --stream precommit --since HEAD --exclude-dependents"
npx husky add .husky/commit-msg 'npx commitlint --edit $1'


npm install tsdx -g
```

```
create .commitlintrc.json add below
--------------------------------
{
  "extends": [
	"@commitlint/config-conventional"
  ]
}
```
