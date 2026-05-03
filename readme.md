# IPC Debugger

IPC Debugger is a university-level systems programming web application that visualizes and simulates Inter-Process Communication (IPC) mechanisms such as pipes, message queues, and shared memory.

## Features

- Real-time process graph visualization
- Animated data flow between processes
- Support for pipes, message queues, and shared memory
- Timeline of send, receive, block, delay, and error events
- Deadlock detection using wait-for graph logic
- Shared memory race-condition visualization
- Bottleneck and performance analysis
- Simulation controls: Start, Pause, Reset, Step
- Speed control: 0.5x, 1x, 2x, 4x
- Pre-built scenarios:
  - Producer-Consumer
  - Deadlock
  - Race Condition
  - Bottleneck
  - Pipeline
- Export logs as JSON
- Project report generator

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- SVG-based graph visualization
- jsPDF for report export

## How to Run

Install dependencies:

```bash
npm install

npm run dev

http://localhost:5173

How to Use
Open the app.
Click Start to begin the simulation.
Use the Dashboard to view processes and IPC channels.
Click a process or channel to see details.
Open Simulation to load different scenarios.
Use Timeline to view execution events.
Use Memory to inspect shared memory and race conditions.
Use Performance to view latency, throughput, and queue size.
Use Report to generate a project report PDF.
Color Meaning
Color	Meaning
Green Teal	Normal or running
Yellow Amber	Slow or waiting
Red	Blocked, error, deadlock, or race condition
Gray	Idle or inactive
Deadlock Detection
The app uses wait-for graph logic. If blocked processes form a circular dependency, the system detects a deadlock and highlights the involved processes and channels.

Purpose
This project is designed for learning and demonstrating IPC concepts visually without using real kernel-level tracing.

