import os
from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json')

# Route per servire i file statici
@app.route('/static/images/<path:filename>')
def serve_icon(filename):
    return send_from_directory('static/images', filename)

@app.route('/sw.js')
def service_worker():
    return send_from_directory('static', 'sw.js')

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
