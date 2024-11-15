from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

@app.after_request
def add_header(response):
    if response.headers.get('Content-Type', '').startswith('image/'):
        response.headers['Content-Type'] = 'image/svg+xml'
    return response

@app.route('/')
def index():
    return render_template('index.html')

# Route per servire le icone
@app.route('/static/images/<path:filename>')
def serve_icon(filename):
    return send_from_directory('static/images', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
