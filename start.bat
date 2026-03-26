@echo off
chcp 65001 > nul
title Art Routine - Dev Server
echo.
echo  아트 루틴 (Art Routine) 개발 서버 시작...
echo  마티스의 창 에디션
echo.
cd /d "%~dp0"
start http://localhost:3000
pnpm dev
