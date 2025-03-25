#!/bin/bash

echo "清除 node_modules/.cache 目录..."
rm -rf node_modules/.cache

echo "清除 dist 目录..."
rm -rf dist

echo "重新安装依赖..."
npm install

echo "启动开发服务器..."
npm run dev