#!/bin/bash

# 查找所有包含 JSX 语法的 .js 文件并重命名为 .jsx
find src -name "*.js" -type f -exec grep -l "<[a-zA-Z]" {} \; | while read file; do
  new_file="${file%.js}.jsx"
  echo "Renaming $file to $new_file"
  mv "$file" "$new_file"
done

echo "完成重命名操作！" 