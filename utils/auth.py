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
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token de autenticação não fornecido!'}), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({'message': 'Token inválido ou expirado!'}), 401
        
        # Busca o usuário pelo ID do token
        # A tabela usuario tem 'situacao' ENUM('ATIVO', 'PENDENTE_APROVACAO', 'BLOQUEADO', 'INATIVO')
        user_data = execute_query(
            "SELECT id_usuario, nome_completo, email, tipo_usuario, situacao FROM usuario WHERE id_usuario = %s",
            (payload['user_id'],),
            fetch_all=False
        )
        
        if not user_data:
            return jsonify({'message': 'Usuário do token não encontrado!'}), 401
        
        # Regras de acesso baseadas na situação do usuário
        # ADMIN pode acessar sempre.
        # Outros usuários precisam estar ATIVOS.
        # Exceções podem ser tratadas dentro das rotas específicas se necessário
        # (ex: atendente PENDENTE_APROVACAO acessando seu próprio perfil para completar dados).
        if user_data['tipo_usuario'] != 'ADMIN' and user_data['situacao'] != 'ATIVO':
            if user_data['situacao'] == 'PENDENTE_APROVACAO':
                # Permite acesso para PENDENTE em certas rotas (tratado na rota ou em decorador específico)
                # Por padrão, bloqueamos aqui, mas isso pode ser flexibilizado.
                # return jsonify({'message': 'Sua conta está pendente de aprovação.'}), 403
                pass # Deixa passar para a rota decidir. A rota de login já trata isso.
            elif user_data['situacao'] == 'BLOQUEADO':
                return jsonify({'message': 'Sua conta está bloqueada.'}), 403
            elif user_data['situacao'] == 'INATIVO':
                return jsonify({'message': 'Sua conta está inativa.'}), 403
            # else: # Situação desconhecida
                # return jsonify({'message': 'Status de conta inválido.'}), 403


        # Adiciona os dados do usuário (incluindo situacao) ao request
        request.current_user = user_data # Alterado de request.user para request.current_user para evitar conflito
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required # Garante que o token_required seja chamado primeiro
    def decorated(*args, **kwargs):
        if not request.current_user or request.current_user['tipo_usuario'] != 'ADMIN':
            return jsonify({'message': 'Acesso restrito a administradores!'}), 403
        return f(*args, **kwargs)
    return decorated

def atendente_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if not request.current_user or request.current_user['tipo_usuario'] != 'ATENDENTE':
            return jsonify({'message': 'Acesso restrito a atendentes!'}), 403
        # Adicional: verificar se o atendente está ATIVO para a maioria das operações
        if request.current_user['situacao'] != 'ATIVO':
            # Permitir acesso para PENDENTE a certas rotas (ex: seu perfil) pode ser tratado na rota
            # return jsonify({'message': 'Sua conta de atendente não está ativa.'}), 403
            pass # Deixa a rota decidir com base na situação
        return f(*args, **kwargs)
    return decorated

def cliente_required(f): # Novo decorador para clientes
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if not request.current_user or request.current_user['tipo_usuario'] != 'CLIENTE':
            return jsonify({'message': 'Acesso restrito a clientes!'}), 403
        if request.current_user['situacao'] != 'ATIVO': # Cliente também precisa estar ativo
            return jsonify({'message': 'Sua conta não está ativa.'}), 403
        return f(*args, **kwargs)
    return decorated