#!/usr/bin/env python3
"""
Agent4 Implementation - Hugging Face Spaces Deployment
Gradio-based web interface for multi-LLM agent orchestration
"""

import os
import sys
import subprocess
import asyncio
import json
from typing import Optional
from datetime import datetime
import gradio as gr
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class Agent4Manager:
    """Manager for Agent4 Node.js application lifecycle"""
    
    def __init__(self):
        self.process = None
        self.app_ready = False
        self.build_status = "pending"
        self.error_message = None
        
    def initialize_app(self) -> dict:
        """Initialize and build the Node.js application"""
        try:
            logger.info("Starting Agent4 initialization...")
            
            # Check Node.js and npm
            node_version = subprocess.check_output(['node', '--version']).decode().strip()
            npm_version = subprocess.check_output(['npm', '--version']).decode().strip()
            logger.info(f"Node.js {node_version}, NPM {npm_version}")
            
            # Check if build is needed
            if not os.path.exists('dist/index.js'):
                logger.info("Building application (dist not found)...")
                self.build_status = "building"
                result = subprocess.run(
                    ['npm', 'run', 'build'],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                
                if result.returncode != 0:
                    self.build_status = "failed"
                    self.error_message = result.stderr
                    logger.error(f"Build failed: {result.stderr}")
                    return {
                        "status": "error",
                        "message": "Build failed",
                        "details": result.stderr[:500]
                    }
                    
                logger.info("Build completed successfully")
                self.build_status = "success"
            else:
                logger.info("Using existing build artifacts")
                self.build_status = "skipped"
            
            self.app_ready = True
            return {
                "status": "ready",
                "message": "Agent4 initialized successfully",
                "node_version": node_version,
                "npm_version": npm_version,
                "build_status": self.build_status
            }
            
        except subprocess.TimeoutExpired:
            self.build_status = "timeout"
            self.error_message = "Build process timed out (>5 minutes)"
            logger.error(self.error_message)
            return {"status": "error", "message": self.error_message}
        except Exception as e:
            self.build_status = "error"
            self.error_message = str(e)
            logger.error(f"Initialization failed: {e}")
            return {"status": "error", "message": str(e)}

    def get_status(self) -> str:
        """Get current application status"""
        status_info = {
            "timestamp": datetime.now().isoformat(),
            "app_ready": self.app_ready,
            "build_status": self.build_status,
            "space_url": "https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm"
        }
        if self.error_message:
            status_info["error"] = self.error_message
        return json.dumps(status_info, indent=2)

# Initialize manager
manager = Agent4Manager()

# Initialize on module load
init_result = manager.initialize_app()

def get_app_status() -> str:
    """Gradio interface: Get application status"""
    return manager.get_status()

def get_build_info() -> str:
    """Gradio interface: Get build information"""
    try:
        build_info = {
            "build_time": None,
            "git_commit": None,
            "environment": os.getenv('NODE_ENV', 'development'),
            "python_version": sys.version,
        }
        
        # Try to get git commit
        try:
            commit = subprocess.check_output(
                ['git', 'rev-parse', '--short', 'HEAD'],
                stderr=subprocess.DEVNULL
            ).decode().strip()
            build_info["git_commit"] = commit
        except:
            pass
        
        # Check dist modification time
        if os.path.exists('dist/index.js'):
            mtime = os.path.getmtime('dist/index.js')
            build_info["build_time"] = datetime.fromtimestamp(mtime).isoformat()
        
        return json.dumps(build_info, indent=2)
    except Exception as e:
        return f"Error getting build info: {e}"

def get_dependencies() -> str:
    """Gradio interface: List key dependencies"""
    try:
        with open('package.json', 'r') as f:
            package_json = json.load(f)
        
        deps = {
            "runtime": package_json.get("dependencies", {}),
            "devDependencies": list(package_json.get("devDependencies", {}).keys()),
            "node_requirement": package_json.get("engines", {}).get("node", ">=18.0.0")
        }
        
        return json.dumps(deps, indent=2)
    except Exception as e:
        return f"Error reading dependencies: {e}"

def get_readme_preview() -> str:
    """Gradio interface: Preview README content"""
    try:
        with open('README.md', 'r') as f:
            content = f.read()
        # Return first 1000 characters
        return content[:1000] + "..." if len(content) > 1000 else content
    except Exception as e:
        return f"Error reading README: {e}"

# Create Gradio interface
with gr.Blocks(title="Agent4 Implementation", theme=gr.themes.Soft(primary_hue="blue")) as demo:
    
    # Header
    with gr.Row():
        gr.HTML("""
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                       -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                       margin: 0;">
                🤖 Agent4 Multi-LLM Implementation
            </h1>
            <p style="color: #666; margin: 10px 0;">
                Enterprise-grade agent orchestration with fallback mechanisms
            </p>
            <a href="https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm" 
               target="_blank" style="color: #667eea; text-decoration: none;">
                View on Hugging Face Spaces →
            </a>
        </div>
        """)
    
    # Main tabs
    with gr.Tabs():
        
        # Status Tab
        with gr.Tab("Status"):
            with gr.Row():
                status_btn = gr.Button("Refresh Status", variant="primary", scale=1)
                status_output = gr.Textbox(
                    value=manager.get_status(),
                    label="Application Status",
                    interactive=False,
                    lines=10
                )
            
            status_btn.click(fn=get_app_status, outputs=status_output)
        
        # Build Info Tab
        with gr.Tab("Build Info"):
            build_output = gr.Textbox(
                value=get_build_info(),
                label="Build Information",
                interactive=False,
                lines=10
            )
            gr.Button("Refresh").click(fn=get_build_info, outputs=build_output)
        
        # Dependencies Tab
        with gr.Tab("Dependencies"):
            deps_output = gr.Textbox(
                value=get_dependencies(),
                label="Project Dependencies",
                interactive=False,
                lines=15
            )
            gr.Button("Refresh").click(fn=get_dependencies, outputs=deps_output)
        
        # Documentation Tab
        with gr.Tab("Documentation"):
            readme_output = gr.Markdown(value=get_readme_preview())
            gr.Button("Refresh").click(fn=get_readme_preview, outputs=readme_output)
        
        # Configuration Tab
        with gr.Tab("Configuration"):
            with gr.Row():
                config_text = gr.Textbox(
                    value=f"""Environment Configuration:

NODE_ENV: {os.getenv('NODE_ENV', 'development')}
PORT: {os.getenv('PORT', '3000')}
LOG_LEVEL: {os.getenv('LOG_LEVEL', 'info')}
DEFAULT_LLM_PROVIDER: {os.getenv('DEFAULT_LLM_PROVIDER', 'huggingface')}

Space URL: https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm
Repository: https://github.com/LetsTryGPT/agent4-implementation

Build Status: {manager.build_status}
App Ready: {manager.app_ready}
""",
                    label="Configuration",
                    interactive=False,
                    lines=12
                )
    
    # Footer
    with gr.Row():
        gr.HTML("""
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; 
                    border-top: 1px solid #eee; color: #666; font-size: 0.9em;">
            <p>
                Agent4 Implementation | 
                <a href="https://github.com/LetsTryGPT/agent4-implementation" target="_blank">GitHub</a> | 
                <a href="https://huggingface.co/spaces/LetsTryGPT/agent4-multi-llm" target="_blank">Space</a>
            </p>
            <p>TypeScript • Node.js 18+ • Multi-LLM Fallback • Enterprise Ready</p>
        </div>
        """)

if __name__ == "__main__":
    # Verify build
    if not manager.app_ready:
        logger.warning("Application not ready - initialization failed")
        logger.warning(f"Build status: {manager.build_status}")
        if manager.error_message:
            logger.warning(f"Error: {manager.error_message}")
    else:
        logger.info("Application ready for deployment")
    
    # Launch Gradio app
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True,
        show_api=False
    )
