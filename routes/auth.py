from flask import Blueprint, request, jsonify
from utils.db import get_connection, execute_query
from utils.auth import hash_password, check_password, generate_token
from utils.validators import validate_email, validate_senha

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Rota para autenticação de usuários."""
    data = request.json
    
    # Verifica se os campos obrigatórios foram fornecidos
    if not data or 'email' not in data or 'senha' not in data:
        return jsonify({'message': 'Email e senha são obrigatórios!'}), 400
    
    email = data['email']
    senha = data['senha']
    tipo_usuario = data.get('tipo_usuario', 'usuario')  # Padrão é 'usuario'
    
    # Valida o formato do email
    if not validate_email(email):
        return jsonify({'message': 'Formato de email inválido!'}), 400
    
    # Busca o usuário pelo email
    user = execute_query(
        "SELECT id_usuario, nome, email, senha, tipo_usuario, situacao FROM usuario WHERE email = %s AND tipo_usuario = %s",
        (email, tipo_usuario),
        fetch_all=False
    )
    
    # Verifica se o usuário existe
    if not user:
        return jsonify({'message': 'Email ou senha incorretos!'}), 401
    
    # Verifica se a senha está correta
    if not check_password(senha, user['senha']):
        return jsonify({'message': 'Email ou senha incorretos!'}), 401
    
    # Verifica se o usuário está aprovado (exceto para admin)
    if user['situacao'] != 'aprovado' and user['tipo_usuario'] != 'admin':
        if user['situacao'] == 'pendente':
            return jsonify({'message': 'Sua conta está pendente de aprovação. Por favor, aguarde.'}), 403
        else:
            return jsonify({'message': 'Sua conta está bloqueada. Entre em contato com o suporte.'}), 403
    
    # Gera o token JWT
    token = generate_token(user['id_usuario'], user['tipo_usuario'])
    
    # Retorna os dados do usuário e o token
    return jsonify({
        'message': 'Login realizado com sucesso!',
        'user': {
            'id': user['id_usuario'],
            'nome': user['nome'],
            'email': user['email'],
            'tipo_usuario': user['tipo_usuario'],
            'situacao': user['situacao']
        },
        'token': token
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    """Rota para registro de novos usuários."""
    connection = None  # Inicializa a variável connection
    try:
        data = request.json
        
        # Verifica se os campos obrigatórios foram fornecidos
        required_fields = ['nome', 'cpf', 'email', 'senha', 'tipo_usuario', 'genero']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'O campo {field} é obrigatório!'}), 400
        
        # Valida o formato do email
        if not validate_email(data['email']):
            return jsonify({'message': 'Formato de email inválido!'}), 400
        
        # Valida a força da senha
        if not validate_senha(data['senha']):
            return jsonify({'message': 'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número!'}), 400
        
        # Verifica se o email já está em uso
        existing_user = execute_query(
            "SELECT id_usuario FROM usuario WHERE email = %s",
            (data['email'],),
            fetch_all=False
        )
        
        if existing_user:
            return jsonify({'message': 'Este email já está em uso!'}), 409
        
        # Verifica se o CPF já está em uso
        existing_cpf = execute_query(
            "SELECT id_usuario FROM usuario WHERE cpf = %s",
            (data['cpf'],),
            fetch_all=False
        )
        
        if existing_cpf:
            return jsonify({'message': 'Este CPF já está em uso!'}), 409
        
        # Cria o hash da senha
        hashed_password = hash_password(data['senha'])
        
        # Inicializa a conexão
        connection = get_connection()
        
        # Insere o novo usuário no banco de dados
        try:
            # Inicia uma transação
            connection.begin()
            
            with connection.cursor() as cursor:
                # Insere o usuário
                cursor.execute("""
                    INSERT INTO usuario (nome, cpf, email, senha, tipo_usuario, genero)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    data['nome'],
                    data['cpf'],
                    data['email'],
                    hashed_password,
                    data['tipo_usuario'],
                    data['genero']
                ))
                
                user_id = cursor.lastrowid
                
                # Se for um atendente, insere na tabela atendente
                if data['tipo_usuario'] == 'atendente':
                    cursor.execute("""
                        INSERT INTO atendente (id_usuario, qualificacao)
                        VALUES (%s, %s)
                    """, (
                        user_id,
                        data.get('qualificacao', '')
                    ))
                
                # Insere o telefone, se fornecido
                if 'telefone' in data and data['telefone']:
                    cursor.execute("""
                        INSERT INTO telefone (telefone, id_usuario)
                        VALUES (%s, %s)
                    """, (
                        data['telefone'],
                        user_id
                    ))
                
                # Insere o endereço, se todos os campos necessários forem fornecidos
                endereco_fields = ['rua', 'cidade', 'cep', 'bairro', 'numero']
                if all(field in data for field in endereco_fields):
                    cursor.execute("""
                        INSERT INTO endereco (rua, cidade, cep, bairro, numero, id_usuario)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        data['rua'],
                        data['cidade'],
                        data['cep'],
                        data['bairro'],
                        data['numero'],
                        user_id
                    ))
                
                connection.commit()
            
            # Retorna os dados do usuário criado
            return jsonify({
                'message': 'Usuário criado com sucesso!',
                'user': {
                    'id': user_id,
                    'nome': data['nome'],
                    'email': data['email'],
                    'tipo_usuario': data['tipo_usuario'],
                    'situacao': 'pendente' if data['tipo_usuario'] == 'atendente' else 'aprovado'
                }
            }), 201
        
        except Exception as e:
            # Se houver erro na transação, faz rollback
            if connection:
                connection.rollback()
            # Re-lança a exceção para ser capturada pelo bloco except externo
            raise e
    
    except Exception as e:
        # Log do erro
        print(f"Erro ao registrar usuário: {str(e)}")
        return jsonify({'message': f'Erro ao registrar usuário: {str(e)}'}), 500
    
    finally:
        # Fecha a conexão se ela foi aberta
        if connection:
            connection.close()

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password_request():
    """Rota para solicitar redefinição de senha."""
    data = request.json
    
    # Verifica se o email foi fornecido
    if not data or 'email' not in data:
        return jsonify({'message': 'Email é obrigatório!'}), 400
    
    email = data['email']
    
    # Valida o formato do email
    if not validate_email(email):
        return jsonify({'message': 'Formato de email inválido!'}), 400
    
    # Verifica se o usuário existe
    user = execute_query(
        "SELECT id_usuario, nome FROM usuario WHERE email = %s",
        (email,),
        fetch_all=False
    )
    
    if not user:
        # Por segurança, não informamos se o email existe ou não
        return jsonify({'message': 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'}), 200
    
    # Em um sistema real, aqui enviaríamos um email com um link para redefinição de senha
    # Para simplificar, apenas retornamos uma mensagem de sucesso
    
    return jsonify({
        'message': 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'
    }), 200

@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    """Rota para redefinir a senha usando um token."""
    # Em um sistema real, aqui verificaríamos o token de redefinição de senha
    # Para simplificar, apenas retornamos uma mensagem de erro
    
    return jsonify({'message': 'Funcionalidade em desenvolvimento.'}), 501