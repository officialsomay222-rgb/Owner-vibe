<div align="center">
  <img width="1200" height="475" alt="Owner Vibe Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" style="border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); margin-bottom: 20px;" />

  <h1 align="center">🎵 Owner Vibe 🎵</h1>

  <p align="center">
    <strong>A stunning, high-performance Music Application built with React, Vite, and Capacitor.</strong>
  </p>

  <p align="center">
    <a href="#-about-the-project">About</a> •
    <a href="#-features">Features</a> •
    <a href="#%EF%B8%8F-getting-started">Getting Started</a> •
    <a href="#-architecture">Architecture</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Capacitor-8.3-119EFF?style=flat-square&logo=capacitor" alt="Capacitor" />
    <img src="https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  </p>
</div>

<br/>

## 🌟 About The Project

**Owner Vibe** is an interactive, mobile-first web application designed to bring a premium music streaming experience. Wrapped with Capacitor for Android native capabilities, it features seamless audio playback, a beautiful UI crafted with Tailwind CSS and Framer Motion, and connects to an internal API proxy mechanism.

<details open>
<summary><b>View original AI Studio Link</b></summary>
<br/>
View your app in AI Studio: https://ai.studio/apps/551e890a-8e7f-4550-9976-4ac980501656
</details>

---

## ✨ Features

<details>
<summary><b>🎧 High-Quality Streaming</b> (Click to expand)</summary>
<br/>
Supports high-quality mobile audio streaming (M4A) leveraging <code>youtubei.js</code> to bypass throttling and restrictions directly from Node.js serverless functions.
</details>

<details>
<summary><b>📱 Native Experience</b> (Click to expand)</summary>
<br/>
Optimized for mobile viewing (Edge-to-Edge UI, Safe Area insets). The Android WebView integration is completely immersive, featuring transparent navigation bars and native status bars using <code>@capacitor/core</code>.
</details>

<details>
<summary><b>🎨 Stunning UI/UX</b> (Click to expand)</summary>
<br/>
Built meticulously with **React 19**, **Framer Motion**, and **Tailwind CSS**. Supports Light and Dark modes dynamically synced to your device preferences. Interactive tabs, gorgeous gradients, and glassmorphism elements.
</details>

<details>
<summary><b>💾 Offline Storage</b> (Click to expand)</summary>
<br/>
Completely backend-free user data storage. Your recent songs, search history, and personal settings are kept privately inside your local browser storage!
</details>

---

## 🛠️ Getting Started

Follow these interactive steps to get the app running on your machine:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Installation

<details open>
<summary><b>Show commands</b></summary>
<br/>

Clone the repository and install dependencies using legacy peer deps to ensure Capacitor compatibility:

```bash
npm install --legacy-peer-deps
```
</details>

### 2. Environment Variables

<details open>
<summary><b>Show configuration</b></summary>
<br/>

Set up your `.env.local` file at the root. You can copy the example:

```bash
cp .env.example .env.local
```

Make sure to add your `GEMINI_API_KEY` or any required variables there.
</details>

### 3. Run Locally

<details open>
<summary><b>Show start command</b></summary>
<br/>

Launch the Vite server. This binds the app to port `3000` locally and allows proxy endpoints!

```bash
npm run dev
```

If you are facing secure host issues, run:
```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.com npm run dev
```
</details>

---

## 🏗️ Architecture

- **Frontend:** React + Vite + Tailwind CSS + Framer Motion.
- **Backend API:** Node.js serverless functions stored in `/api`. During local development, Vite proxies these using a custom plugin to simulate a Vercel-like environment.
- **Mobile Packaging:** Capacitor is used to generate the Android application from the Vite `dist` web build.

---
<div align="center">
  <sub>Built with ❤️ for music lovers.</sub>
</div>
