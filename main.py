from flask import Flask, render_template, request, redirect, url_for
from functools import wraps

app = Flask(__name__)

def https_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.headers.get('X-Forwarded-Proto', 'http') != 'https':
            if not request.is_secure and not request.headers.get('X-Forwarded-Proto', 'http') == 'https':
                url = request.url.replace('http://', 'https://', 1)
                return redirect(url, code=301)
        return f(*args, **kwargs)
    return decorated_function

@app.after_request
def add_security_headers(response):
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = "default-src 'self' https:; script-src 'self' https: 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

@app.route('/')
@https_required
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
