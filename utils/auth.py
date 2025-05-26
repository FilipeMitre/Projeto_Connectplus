import bcrypt
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from config import Config
from utils.db import execute_query

def hash_password(password):
    """Cria um hash da senha fornecida."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password, hashed_password):
    """Verifica se a senha corresponde ao hash armazenado."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_token(user_id, tipo_usuario):
    """Gera um token JWT para o usuário."""
    payload = {
        'user_id': user_id,
        'tipo_usuario': tipo_usuario,
        'exp': datetime.utcnow() + timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

def decode_token(token):
    """Decodifica um token JWT."""
    try:
        return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorador para verificar se o token JWT é válido."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Verifica se o token está no header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token de autenticação não fornecido!'}), 401
        
        # Decodifica o token
        payload = decode_token(token)
        if not payload:
            return jsonify({'message': 'Token inválido ou expirado!'}), 401
        
        # Verifica se o usuário existe e está ativo
        user = execute_query(
            "SELECT id_usuario, tipo_usuario, situacao FROM usuario WHERE id_usuario = %s",
            (payload['user_id'],),
            fetch_all=False
        )
        
        if not user:
            return jsonify({'message': 'Usuário não encontrado!'}), 401
        
        if user['situacao'] != 'aprovado' and user['tipo_usuario'] != 'admin':
            return jsonify({'message': 'Usuário não está aprovado!'}), 403
        
        # Adiciona o usuário ao request
        request.user = user
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorador para verificar se o usuário é um administrador."""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Primeiro verifica o token
        token_result = token_required(lambda: None)()
        if isinstance(token_result, tuple):
            return token_result
        
        # Verifica se o usuário é um administrador
        if request.user['tipo_usuario'] != 'admin':
            return jsonify({'message': 'Acesso negado. Requer privilégios de administrador!'}), 403
        
        return f(*args, **kwargs)
    
    return decorated

def atendente_required(f):
    """Decorador para verificar se o usuário é um atendente."""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Primeiro verifica o token
        token_result = token_required(lambda: None)()
        if isinstance(token_result, tuple):
            return token_result
        
        # Verifica se o usuário é um atendente
        if request.user['tipo_usuario'] != 'atendente':
            return jsonify({'message': 'Acesso negado. Requer privilégios de atendente!'}), 403
        
        return f(*args, **kwargs)
    
    return decorated