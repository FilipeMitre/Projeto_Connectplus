# routes/auth.py
from flask import Blueprint, request, jsonify
from utils.db import get_connection # Usar get_connection para transações manuais
from utils.auth import hash_password, check_password, generate_token
from utils.validators import validate_email, validate_senha, validate_user_data, validate_telefone_data, validate_endereco_data, validate_atendente_detalhes_data
# Adicione outras validações se necessário

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/registrar', methods=['POST'])
def registrar_usuario():
    data = request.json
    connection = None
    try:
        print("Dados recebidos:", data)  # Debug

        # 1. Validar dados do usuário principal
        user_errors = validate_user_data(data, is_update=False, user_type=data.get('tipo_usuario'))
        if user_errors:
            print("Erros de validação do usuário:", user_errors)  # Debug
            return jsonify({'message': 'Dados de usuário inválidos!', 'errors': user_errors}), 400

        # 2. Validar dados de telefone (espera um array, pegamos o primeiro)
        telefone_data = data.get('telefones', [{}])[0] if data.get('telefones') else {}
        tel_errors = validate_telefone_data(telefone_data)
        if tel_errors:
            print("Erros de validação do telefone:", tel_errors)  # Debug
            return jsonify({'message': 'Dados de telefone inválidos!', 'errors': tel_errors}), 400
        
        # 3. Validar dados de endereço (espera um array, pegamos o primeiro)
        endereco_data = data.get('enderecos', [{}])[0] if data.get('enderecos') else {}
        end_errors = validate_endereco_data(endereco_data)
        if end_errors:
            print("Erros de validação do endereço:", end_errors)  # Debug
            return jsonify({'message': 'Dados de endereço inválidos!', 'errors': end_errors}), 400

        # 4. Validar dados de atendente_detalhes se for ATENDENTE
        if data['tipo_usuario'] == 'ATENDENTE':
            if 'atendente_detalhes' not in data:
                return jsonify({'message': 'Detalhes do atendente são obrigatórios para este tipo de usuário.'}), 400
            atendente_detalhes_data = data['atendente_detalhes']
            at_det_errors = validate_atendente_detalhes_data(atendente_detalhes_data)
            if at_det_errors:
                print("Erros de validação do atendente:", at_det_errors)  # Debug
                return jsonify({'message': 'Dados profissionais do atendente inválidos!', 'errors': at_det_errors}), 400
        
        # Verificar duplicações (email, cpf)
        connection = get_connection()
        with connection.cursor() as cursor:
            # Verificar email
            cursor.execute("SELECT id_usuario FROM usuario WHERE email = %s", (data['email'],))
            if cursor.fetchone():
                return jsonify({
                    'message': 'Email já cadastrado!',
                    'field': 'email',
                    'details': 'Este endereço de email já está sendo usado por outro usuário. Por favor, use um email diferente.'
                }), 409
            
            # Verificar CPF
            cursor.execute("SELECT id_usuario FROM usuario WHERE cpf = %s", (data['cpf'],))
            if cursor.fetchone():
                return jsonify({
                    'message': 'CPF já cadastrado!',
                    'field': 'cpf',
                    'details': 'Este CPF já está registrado em nossa base de dados. Se você já possui uma conta, tente fazer login.'
                }), 409

        print("Iniciando hash da senha...")  # Debug
        hashed_pw = hash_password(data['senha'])
        print("Hash da senha concluído")  # Debug
        
        # Definir situação inicial
        situacao_inicial = 'ATIVO' # Para CLIENTE e ADMIN
        if data['tipo_usuario'] == 'ATENDENTE':
            situacao_inicial = 'PENDENTE_APROVACAO'

        # Iniciar transação
        print("Iniciando transação...")  # Debug
        connection.begin()
        with connection.cursor() as cursor:
            # Inserir usuário
            sql_usuario = """
                INSERT INTO usuario (nome_completo, nome_social, cpf, email, senha, data_nascimento, 
                                    tipo_usuario, identidade_genero, orientacao_sexual, pronomes, situacao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            print("Executando insert do usuário...")  # Debug
            cursor.execute(sql_usuario, (
                data['nome_completo'], data.get('nome_social'), data['cpf'], data['email'], hashed_pw,
                data.get('data_nascimento'), data['tipo_usuario'], data.get('identidade_genero'),
                data.get('orientacao_sexual'), data.get('pronomes'), situacao_inicial
            ))
            id_usuario_criado = cursor.lastrowid
            print("Usuário inserido com ID:", id_usuario_criado)  # Debug

            # Inserir telefone principal
            if telefone_data.get('numero_telefone'):
                sql_telefone = """
                    INSERT INTO telefone (id_usuario, numero_telefone, tipo_telefone, is_principal)
                    VALUES (%s, %s, %s, %s)
                """
                print("Inserindo telefone...")  # Debug
                cursor.execute(sql_telefone, (
                    id_usuario_criado, telefone_data['numero_telefone'],
                    telefone_data.get('tipo_telefone', 'CELULAR'), True
                ))
            
            # Inserir endereço principal
            if endereco_data.get('logradouro'): # Checa um campo obrigatório do endereço
                sql_endereco = """
                    INSERT INTO endereco (id_usuario, logradouro, numero, complemento, bairro, cidade, estado, cep, tipo_endereco, is_principal)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                print("Inserindo endereço...")  # Debug
                cursor.execute(sql_endereco, (
                    id_usuario_criado, endereco_data['logradouro'], endereco_data['numero'],
                    endereco_data.get('complemento'), endereco_data['bairro'], endereco_data['cidade'],
                    endereco_data['estado'], endereco_data['cep'],
                    endereco_data.get('tipo_endereco', 'RESIDENCIAL'), True
                ))

            # Se for atendente, inserir detalhes
            if data['tipo_usuario'] == 'ATENDENTE':
                detalhes = data['atendente_detalhes']
                sql_atendente_detalhes = """
                    INSERT INTO atendente_detalhes (
                        id_usuario, area_atuacao, qualificacao_descricao, especialidades,
                        registro_profissional, anos_experiencia, curriculo_link,
                        aceita_atendimento_online, aceita_atendimento_presencial, duracao_padrao_atendimento_min
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                print("Inserindo detalhes do atendente...")  # Debug
                cursor.execute(sql_atendente_detalhes, (
                    id_usuario_criado, detalhes['area_atuacao'], detalhes['qualificacao_descricao'],
                    detalhes.get('especialidades'), detalhes.get('registro_profissional'),
                    detalhes.get('anos_experiencia'), detalhes.get('curriculo_link'),
                    detalhes.get('aceita_atendimento_online', True), 
                    detalhes.get('aceita_atendimento_presencial', False),
                    detalhes.get('duracao_padrao_atendimento_min', 60)
                ))
            
            print("Commitando transação...")  # Debug
            connection.commit()
            print("Transação concluída com sucesso!")  # Debug
            
            return jsonify({
                'message': 'Usuário registrado com sucesso!',
                'usuario': {'id_usuario': id_usuario_criado, 'tipo_usuario': data['tipo_usuario'], 'situacao': situacao_inicial}
            }), 201

    except Exception as e:
        print("ERRO NO CADASTRO:", str(e))  # Debug detalhado do erro
        print("Tipo do erro:", type(e))  # Debug do tipo do erro
        if connection:
            print("Fazendo rollback da transação...")  # Debug
            connection.rollback()
        return jsonify({'message': f'Erro interno ao registrar usuário: {str(e)}'}), 500
    finally:
        if connection:
            connection.close()
            print("Conexão fechada")  # Debug


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('senha'):
        return jsonify({'message': 'Email e senha são obrigatórios!'}), 400

    email = data['email']
    senha_fornecida = data['senha']

    if not validate_email(email): # Supondo que validate_email existe
        return jsonify({'message': 'Formato de email inválido.'}), 400

    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Busca o usuário pelo email, independente do tipo inicialmente
            cursor.execute(
                "SELECT id_usuario, nome_completo, nome_social, email, senha, tipo_usuario, situacao FROM usuario WHERE email = %s", (email,)
            )
            user = cursor.fetchone()

        if not user or not check_password(senha_fornecida, user['senha']): # Supondo que check_password existe
            return jsonify({'message': 'Email ou senha inválidos.'}), 401

        # Regras de login baseadas na situação (exceto ADMIN que sempre pode logar)
        if user['tipo_usuario'] != 'ADMIN':
            if user['situacao'] == 'PENDENTE_APROVACAO':
                # Ainda gera token, mas o frontend deve direcionar para página de pendência
                pass # Ou retornar um código/mensagem específica se o frontend não for tratar
            elif user['situacao'] == 'BLOQUEADO':
                return jsonify({'message': 'Sua conta está bloqueada. Entre em contato com o suporte.'}), 403
            elif user['situacao'] == 'INATIVO':
                return jsonify({'message': 'Sua conta está inativa. Entre em contato com o suporte.'}), 403
            # ATIVO é o caso ideal

        token_gerado = generate_token(user['id_usuario'], user['tipo_usuario']) # Supondo que generate_token existe
        
        return jsonify({
            'message': 'Login bem-sucedido!',
            'token': token_gerado,
            'usuario': {
                'id_usuario': user['id_usuario'],
                'nome_completo': user['nome_completo'],
                'nome_social': user['nome_social'],
                'email': user['email'],
                'tipo_usuario': user['tipo_usuario'],
                'situacao': user['situacao'] # Importante para o frontend
            }
        }), 200
    except Exception as e:
        print(f"Erro no login: {e}")
        return jsonify({'message': 'Erro interno no servidor durante o login.'}), 500
    finally:
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