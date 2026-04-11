# Netpy LMS Video Call

Welcome to the **Netpy LMS Video Call** project! This is a custom, standalone, plug-and-play video conferencing system modeled after popular platforms like Zoom. It is specifically designed to be integrated into existing Learning Management System (LMS) platforms seamlessly.

## 🚀 Introduction

Built with modern web technologies, this project provides a robust, real-time video conferencing experience. It handles meeting creation, scheduling, joining, and recording, while being flexible enough to be modularly integrated with your proprietary LMS environment.

## ⚙️ Tech Stack

This project utilizes the following technologies:
- **Next.js** - React framework for server-side rendering and static site generation.
- **TypeScript** - Strongly typed programming language that builds on JavaScript.
- **GetStream** - Powerful SDK for assembling robust, real-time video and audio feeds seamlessly.
- **Supabase** - Open-source Firebase alternative used for persistent data storage, database management, and authentication.
- **Tailwind CSS** - Utility-first CSS framework for rapid and responsive UI development.
- **shadcn/ui** - Reusable UI components for building consistent and beautiful interfaces.

## 🛠️ Usage and Setup Guide

To get this project running locally, follow these straightforward steps:

### 1. Prerequisites

Ensure you have the following installed to run the project locally:
- [Node.js](https://nodejs.org/en) (v18 or above recommended)
- [npm](https://www.npmjs.com/)

### 2. External Services Setup

You will need to create accounts and retrieve API keys from two significant platforms to run this project:

**A. Supabase:**
1. Go to [Supabase](https://supabase.com/) and create a new account/project.
2. Go to your Project Settings -> API.
3. Retrieve your **Project URL** and **anon public** API key.

**B. GetStream:**
1. Go to [GetStream.io](https://getstream.io/) and create an account.
2. Navigate to your Dashboard and create a new Video app.
3. Retrieve your **API Key** and **API Secret**.

### 3. Environment Variables

Create a new file named `.env.local` in the root directory of your project and structure it as follows:

```env
# GetStream Config
NEXT_PUBLIC_STREAM_API_KEY=your_getstream_api_key_here
STREAM_SECRET_KEY=your_getstream_secret_key_here

# Supabase Config
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
*Make sure to replace the placeholder values with the actual keys you retrieved from your Supabase and GetStream dashboards.*

### 4. Installation

Clone the repository if you haven't already, navigate to the project directory, and install the required dependencies:

```bash
npm install
```

### 5. Running the Application

To start the development server, run:

```bash
npm run dev
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

## 🔋 Key Features
- **Video & Audio Calling:** High-quality, real-time communication powered by GetStream.
- **Database Persistence:** Real-time data and meeting records stored flawlessly in Supabase.
- **Meeting Controls:** Built-in functionalities for screen sharing, muting/unmuting, and responsive video layouts.
- **LMS Ready:** Readily built as a microservice/proxy service that interfaces with other LMS systems effortlessly.
