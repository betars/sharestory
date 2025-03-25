#!/bin/bash

echo "清除缓存..."
rm -rf node_modules/.cache
rm -rf dist

echo "启动开发服务器..."
npm run dev -- --port 5173 &
SERVER_PID=$!

echo "等待服务器启动..."
sleep 5

echo "打开 Tailwind CSS 测试页面..."
echo "请访问: http://localhost:5173/tailwind"

# 等待用户按下 Ctrl+C
echo "按 Ctrl+C 停止服务器..."
wait $SERVER_PID 