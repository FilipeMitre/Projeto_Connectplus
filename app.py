from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os
from config import Config

# Importação das rotas
from routes.auth import auth_bp
from routes.usuarios import usuarios_bp
from routes.atendentes import atendentes_bp
from routes.servicos import servicos_bp
from routes.agendamentos import agendamentos_bp

def create_app():
    """Cria e configura a aplicação Flask."""
    app = Flask(__name__, static_folder='static')
    app.config.from_object(Config)
    
    # Configuração do CORS
    CORS(app)
    
    # Registra os blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(usuarios_bp, url_prefix='/api/usuarios')
    app.register_blueprint(atendentes_bp, url_prefix='/api/atendentes')
    app.register_blueprint(servicos_bp, url_prefix='/api/servicos')
    app.register_blueprint(agendamentos_bp, url_prefix='/api/agendamentos')
    
    # Cria o diretório de uploads se não existir
    if not os.path.exists(Config.UPLOAD_FOLDER):
        os.makedirs(Config.UPLOAD_FOLDER)
    
    # Rota de status da API
    @app.route('/api/status', methods=['GET'])
    def status():
        return jsonify({
            'status': 'online',
            'version': '1.0.0'
        }), 200
    
    # Rota para servir a página inicial
    @app.route('/')
    def index():
        return send_from_directory('static', 'index.html')
    
    # Rota para servir páginas específicas
    @app.route('/<path:path>')
    def serve_static(path):
        # Verificar se é um diretório com um arquivo index.html
        if os.path.isdir(os.path.join('static', path)) and os.path.exists(os.path.join('static', path, 'index.html')):
            return send_from_directory('static', os.path.join(path, 'index.html'))
        
        # Verificar se é um diretório com um arquivo HTML com o mesmo nome
        if os.path.isdir(os.path.join('static', path)) and os.path.exists(os.path.join('static', path, f"{path.split('/')[-1]}.html")):
            return send_from_directory('static', os.path.join(path, f"{path.split('/')[-1]}.html"))
        
        # Caso contrário, tenta servir o arquivo diretamente
        return send_from_directory('static', path)
    
    # Tratamento de erros
    @app.errorhandler(404)
    def not_found(error):
        # Para requisições de API, retornar JSON
        if request.path.startswith('/api/'):
            return jsonify({
                'message': 'Recurso não encontrado!'
            }), 404
        # Para outras requisições, retornar a página 404.html
        return send_from_directory('static', '404.html'), 404
    
    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            'message': 'Erro interno do servidor!'
        }), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)