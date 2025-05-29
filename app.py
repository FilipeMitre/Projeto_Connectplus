# app.py
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os
from config import Config

# Importação das rotas
from routes.auth import auth_bp
from routes.usuarios import usuarios_bp # Contém rotas para perfil, notificações
from routes.atendentes import atendentes_bp # Contém rotas para perfil de atendente, listagem, avaliações, disponibilidade
from routes.agendamentos import agendamentos_bp # Contém rotas para CRUD de agendamentos e avaliações (criar)

def create_app():
    app = Flask(__name__, static_folder='static', static_url_path='/static') # static_url_path pode ser útil
    app.config.from_object(Config)
    CORS(app) # Habilitar CORS para todos os domínios por padrão, pode restringir em produção
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(usuarios_bp, url_prefix='/api/usuarios') # /api/usuarios/me, /api/usuarios/<id>/perfil etc.
    app.register_blueprint(atendentes_bp, url_prefix='/api/atendentes')
    app.register_blueprint(agendamentos_bp, url_prefix='/api/agendamentos')
    # Removido servicos_bp
    
    # ... (resto do seu app.py, como status, rotas estáticas, errorhandlers) ...
    # Rota para servir a página inicial
    @app.route('/')
    def index():
        # Redireciona para a página inicial dentro da pasta static
        return send_from_directory('static', 'index.html')

    # Rota para servir arquivos estáticos diretamente da raiz de 'static'
    # e também para permitir caminhos como /login, /cadastro que buscam login.html, cadastro.html
    # Se o caminho for um diretório, busca por index.html dentro dele.
    @app.route('/<path:filename>')
    def serve_page(filename):
        # Se o arquivo existir diretamente em static (ex: styles.css, script.js)
        if os.path.exists(os.path.join(app.static_folder, filename)):
            # Se for um diretório, tente servir o index.html dele
            if os.path.isdir(os.path.join(app.static_folder, filename)):
                index_file = os.path.join(filename, 'index.html')
                if os.path.exists(os.path.join(app.static_folder, index_file)):
                    return send_from_directory(app.static_folder, index_file)
            else: # É um arquivo
                return send_from_directory(app.static_folder, filename)

        # Tenta mapear caminhos como /login para /login/login.html ou /cliente/perfil para /cliente/perfil.html
        # Isso ajuda a ter URLs mais limpas sem a extensão .html
        possible_html_path_dir = os.path.join(filename, f"{filename.split('/')[-1]}.html") # ex: login/login.html
        possible_html_path_file = f"{filename}.html" # ex: login.html

        if os.path.exists(os.path.join(app.static_folder, possible_html_path_dir)):
            return send_from_directory(app.static_folder, possible_html_path_dir)
        elif os.path.exists(os.path.join(app.static_folder, possible_html_path_file)):
            return send_from_directory(app.static_folder, possible_html_path_file)
            
        # Se nada for encontrado, delega para o errorhandler 404
        return not_found(None) # Chama o error handler


    @app.errorhandler(404)
    def not_found(error):
        if request.path.startswith('/api/'):
            return jsonify({'message': 'Endpoint da API não encontrado.'}), 404
        # Para SPA, você pode querer sempre retornar o index.html principal
        # e deixar o roteamento do lado do cliente lidar com o 404 visual.
        # Ou servir uma página 404.html personalizada.
        # return send_from_directory('static', '404.html'), 404
        return send_from_directory('static', 'index.html'), 200 # Para SPA behavior com roteamento no cliente

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)