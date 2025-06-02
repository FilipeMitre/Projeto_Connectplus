# routes/auth.py
from flask import Blueprint, request, jsonify
from utils.db import get_connection # Usar get_connection para transações manuais
from utils.auth import hash_password, check_password, generate_token
from utils.validators import validate_email, validate_senha, validate_user_data, validate_telefone_data, validate_endereco_data, validate_atendente_detalhes_data
# Adicione outras validações se necessário

import random
import string
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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
        senha_texto_puro = data['senha']  # TEMPORÁRIO: Também armazenar em texto puro
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
                INSERT INTO usuario (nome_completo, nome_social, cpf, email, senha, senha_texto, data_nascimento, 
                                    tipo_usuario, identidade_genero, orientacao_sexual, pronomes, situacao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            print("Executando insert do usuário...")  # Debug
            cursor.execute(sql_usuario, (
                data['nome_completo'], data.get('nome_social'), data['cpf'], data['email'], 
                hashed_pw, senha_texto_puro,  # Armazena ambas as senhas
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

        if not user or not check_password(senha_fornecida, user['senha']): # Volta a usar check_password
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

# Função auxiliar para enviar email
def enviar_email_recuperacao(email, codigo):
    try:
        # Configurações do servidor SMTP do Gmail
        smtp_server = "smtp.gmail.com"
        port = 587  # Porta para TLS
        sender_email = "seu_email@gmail.com"  # Substitua pelo seu email
        password = "sua_senha_app"  # Substitua pela sua senha de app do Gmail

        # Criar mensagem
        message = MIMEMultipart("alternative")
        message["Subject"] = "Recuperação de Senha - Connect+"
        message["From"] = sender_email
        message["To"] = email

        # Criar versão HTML do email
        html = f"""
        <html>
          <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a73e8;">Recuperação de Senha - Connect+</h2>
              <p>Você solicitou a recuperação de senha da sua conta no Connect+.</p>
              <p>Seu código de verificação é:</p>
              <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
                <strong>{codigo}</strong>
              </div>
              <p>Este código é válido por 15 minutos.</p>
              <p>Se você não solicitou a recuperação de senha, ignore este email.</p>
              <hr style="margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">Este é um email automático, não responda.</p>
            </div>
          </body>
        </html>
        """

        # Anexar parte HTML
        part = MIMEText(html, "html")
        message.attach(part)

        # Criar conexão segura
        server = smtplib.SMTP(smtp_server, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, message.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {str(e)}")
        return False

@auth_bp.route('/recuperar-senha', methods=['POST'])
def solicitar_recuperacao_senha():
    data = request.json
    if not data or not data.get('email'):
        return jsonify({'message': 'Email é obrigatório!'}), 400

    email = data['email']
    if not validate_email(email):
        return jsonify({'message': 'Formato de email inválido.'}), 400

    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar se o email existe e buscar a senha em texto puro
            cursor.execute("SELECT senha_texto FROM usuario WHERE email = %s", (email,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'message': 'Email não encontrado em nossa base de dados.'}), 404

            # Retorna a senha em texto puro (SOLUÇÃO TEMPORÁRIA - NÃO USAR EM PRODUÇÃO)
            return jsonify({
                'message': 'Senha encontrada com sucesso!',
                'senha': user['senha_texto']
            }), 200

    except Exception as e:
        print(f"Erro na recuperação de senha: {str(e)}")
        return jsonify({'message': 'Erro interno ao processar a solicitação.'}), 500
    finally:
        if connection:
            connection.close()

@auth_bp.route('/verificar-codigo', methods=['POST'])
def verificar_codigo():
    data = request.json
    if not data or not data.get('email') or not data.get('codigo'):
        return jsonify({'message': 'Email e código são obrigatórios!'}), 400

    email = data['email']
    codigo = data['codigo']

    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Buscar usuário e código
            cursor.execute("""
                SELECT u.id_usuario, c.codigo, c.data_expiracao, c.tentativas
                FROM usuario u
                JOIN codigos_recuperacao c ON u.id_usuario = c.id_usuario
                WHERE u.email = %s
            """, (email,))
            
            result = cursor.fetchone()
            if not result:
                return jsonify({'message': 'Nenhuma solicitação de recuperação encontrada.'}), 404

            # Verificar tentativas
            if result['tentativas'] >= 3:
                return jsonify({'message': 'Número máximo de tentativas excedido. Solicite um novo código.'}), 400

            # Verificar expiração
            if datetime.now() > result['data_expiracao']:
                return jsonify({'message': 'Código expirado. Solicite um novo código.'}), 400

            # Verificar código
            if codigo != result['codigo']:
                # Incrementar tentativas
                cursor.execute("""
                    UPDATE codigos_recuperacao
                    SET tentativas = tentativas + 1
                    WHERE id_usuario = %s
                """, (result['id_usuario'],))
                connection.commit()
                return jsonify({'message': 'Código inválido.'}), 400

            return jsonify({'message': 'Código verificado com sucesso!'}), 200

    except Exception as e:
        print(f"Erro na verificação do código: {str(e)}")
        if connection:
            connection.rollback()
        return jsonify({'message': 'Erro interno ao verificar o código.'}), 500
    finally:
        if connection:
            connection.close()

@auth_bp.route('/redefinir-senha', methods=['POST'])
def redefinir_senha():
    data = request.json
    if not data or not data.get('email') or not data.get('codigo') or not data.get('nova_senha'):
        return jsonify({'message': 'Email, código e nova senha são obrigatórios!'}), 400

    email = data['email']
    codigo = data['codigo']
    nova_senha = data['nova_senha']

    # Validar nova senha
    if not validate_senha(nova_senha):
        return jsonify({'message': 'A nova senha não atende aos requisitos mínimos de segurança.'}), 400

    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar código novamente
            cursor.execute("""
                SELECT u.id_usuario, c.codigo, c.data_expiracao
                FROM usuario u
                JOIN codigos_recuperacao c ON u.id_usuario = c.id_usuario
                WHERE u.email = %s
            """, (email,))
            
            result = cursor.fetchone()
            if not result or codigo != result['codigo'] or datetime.now() > result['data_expiracao']:
                return jsonify({'message': 'Código inválido ou expirado.'}), 400

            # Atualizar senha
            hashed_pw = hash_password(nova_senha)
            cursor.execute("""
                UPDATE usuario
                SET senha = %s
                WHERE id_usuario = %s
            """, (hashed_pw, result['id_usuario']))

            # Remover código usado
            cursor.execute("DELETE FROM codigos_recuperacao WHERE id_usuario = %s", (result['id_usuario'],))
            
            connection.commit()
            return jsonify({'message': 'Senha alterada com sucesso!'}), 200

    except Exception as e:
        print(f"Erro na redefinição de senha: {str(e)}")
        if connection:
            connection.rollback()
        return jsonify({'message': 'Erro interno ao redefinir a senha.'}), 500
    finally:
        if connection:
            connection.close()

@auth_bp.route('/reenviar-codigo', methods=['POST'])
def reenviar_codigo():
    data = request.json
    if not data or not data.get('email'):
        return jsonify({'message': 'Email é obrigatório!'}), 400

    email = data['email']
    if not validate_email(email):
        return jsonify({'message': 'Formato de email inválido.'}), 400

    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar se existe solicitação anterior
            cursor.execute("""
                SELECT u.id_usuario
                FROM usuario u
                JOIN codigos_recuperacao c ON u.id_usuario = c.id_usuario
                WHERE u.email = %s
            """, (email,))
            
            result = cursor.fetchone()
            if not result:
                return jsonify({'message': 'Nenhuma solicitação de recuperação encontrada.'}), 404

            # Gerar novo código
            codigo = ''.join(random.choices(string.digits, k=6))
            expiracao = datetime.now() + timedelta(minutes=15)

            # Atualizar código
            cursor.execute("""
                UPDATE codigos_recuperacao
                SET codigo = %s,
                    data_expiracao = %s,
                    tentativas = 0
                WHERE id_usuario = %s
            """, (codigo, expiracao, result['id_usuario']))
            
            connection.commit()

            # Enviar novo email
            if enviar_email_recuperacao(email, codigo):
                return jsonify({'message': 'Novo código enviado com sucesso!'}), 200
            else:
                return jsonify({'message': 'Erro ao enviar o email. Tente novamente mais tarde.'}), 500

    except Exception as e:
        print(f"Erro ao reenviar código: {str(e)}")
        if connection:
            connection.rollback()
        return jsonify({'message': 'Erro interno ao reenviar o código.'}), 500
    finally:
        if connection:
            connection.close()