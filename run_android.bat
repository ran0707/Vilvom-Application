@echo off
set ANDROID_HOME=C:\Users\Administrator\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%
cd /d C:\Users\Administrator\Desktop\Ranjith_workspace\projects\Vilvom_Application-main\Vilvom_Application-main
npx react-native run-android
