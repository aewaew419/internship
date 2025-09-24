#!/usr/bin/env python3

"""
Simple HTTP Server for Demo
Serves demo files on localhost to avoid CORS issues
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

PORT = 8000

class DemoHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def main():
    # Change to the directory containing this script
    os.chdir(Path(__file__).parent)
    
    print("🌐 Starting Demo Server...")
    print(f"📍 Serving from: {os.getcwd()}")
    print(f"🔗 Demo URL: http://localhost:{PORT}/demo-simple.html")
    print(f"📊 Performance Dashboard: http://localhost:{PORT}/performance-dashboard.html")
    print(f"🎤 Presentation: http://localhost:{PORT}/presentation/index.html")
    print("")
    print("🎯 Demo Accounts:")
    print("   Student: 65010001 / password123")
    print("   Staff: staff001@university.ac.th / password123")
    print("")
    print("Press Ctrl+C to stop the server")
    print("=" * 50)

    try:
        with socketserver.TCPServer(("", PORT), DemoHTTPRequestHandler) as httpd:
            print(f"✅ Server running at http://localhost:{PORT}")
            
            # Auto-open demo page
            webbrowser.open(f'http://localhost:{PORT}/demo-simple.html')
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Demo server stopped")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use")
            print("💡 Try a different port or stop the existing server")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()