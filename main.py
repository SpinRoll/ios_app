from flask import Flask, render_template, send_file

app = Flask(__name__)

@app.after_request
def add_header(response):
    if response.headers.get('Content-Type', '').startswith('image/'):
        response.headers['Content-Type'] = 'image/svg+xml'
    return response

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
