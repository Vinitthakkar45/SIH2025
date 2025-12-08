# Mobile App - Capacitor Setup

This directory contains the Ionic Capacitor mobile app that wraps the Next.js frontend.

## Prerequisites

- Node.js installed
- Android Studio installed (for Android builds)
- Java JDK 17+ installed

## Commands

```bash
npm run build    # Sync frontend build to Android
npm run apk      # Build the APK file
```

### What They Do

- **`npm run build`** - Copies `../frontend/out` to Android and syncs Capacitor config/plugins
- **`npm run apk`** - Compiles the Android app into an installable APK

## Build Workflow

### 1. Build Frontend

```bash
cd frontend
npm run build
```

### 2. Build APK

```bash
cd mobile
npm run build
npm run apk
```

### 3. Get Your APK

```
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## Install APK on Phone

**Option 1:** Copy `app-debug.apk` to your phone and open it

**Option 2:** Install via USB

```bash
cd mobile/android
./gradlew installDebug
```

## When to Rebuild

| Changed                       | Command                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Frontend code                 | `cd frontend && npm run build` then `cd mobile && npm run build && npm run apk` |
| Capacitor config              | `cd mobile && npm run build && npm run apk`                                     |
| Nothing (just need fresh APK) | `cd mobile && npm run apk`                                                      |

## Quick Reference

```bash
# Full rebuild from scratch
cd frontend && npm run build && cd ../mobile && npm run build && npm run apk

# Your APK is at:
# mobile/android/app/build/outputs/apk/debug/app-debug.apk
```
