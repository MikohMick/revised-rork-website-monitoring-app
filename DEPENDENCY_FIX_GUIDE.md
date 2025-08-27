# Dependency Fix Guide

## Problem
The app is crashing due to Kotlin module incompatibility with expo-web-browser and @expo/vector-icons.

## Manual Steps to Fix

### 1. Remove Problematic Packages
Edit your `package.json` and remove these lines:
```json
"@expo/vector-icons": "^14.1.0",
"expo-haptics": "~14.1.4",
"expo-web-browser": "^14.2.0",
```

### 2. Clean Installation
Run these commands:
```bash
rm -rf node_modules
rm bun.lock
bun install
```

### 3. Clear Metro Cache
```bash
npx expo start --clear
```

### 4. Alternative Commands (if bun doesn't work)
```bash
rm -rf node_modules
rm package-lock.json
npm install
npx expo start --clear
```

## Why This Fixes the Issue
- `expo-web-browser` uses the new Kotlin module system that's incompatible with your current setup
- `@expo/vector-icons` requires expo-font which also causes crashes
- `expo-haptics` has similar Kotlin compatibility issues

## What We've Already Done
- Replaced all icon usage with lucide-react-native
- Removed all expo-image usage and replaced with React Native Image
- Updated code to not use any of the problematic packages

## After Fixing
Your app should run without the ClassComponentBuilder crashes.