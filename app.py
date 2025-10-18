#!/usr/bin/env python3
"""
Minimal Python wrapper for Agent4 Node.js application
This ensures the Space starts successfully
"""

import subprocess
import sys
import os

def main():
    print("🚀 Starting Agent4 Implementation...")
    print(f"Node version: {subprocess.check_output(['node', '--version']).decode().strip()}")
    print(f"NPM version: {subprocess.check_output(['npm', '--version']).decode().strip()}")
    
    # Check if dist exists
    if not os.path.exists('/app/dist/index.js'):
        print("❌ dist/index.js not found - running build...")
        subprocess.run(['npm', 'run', 'build'], check=True)
    
    print("✅ Starting Node.js application...")
    # Start the Node.js app
    subprocess.run(['node', 'dist/index.js'], check=True)

if __name__ == "__main__":
    main()
