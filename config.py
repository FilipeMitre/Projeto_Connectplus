import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

class Config:
    # Configurações do Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'chave-secreta-padrao'
    DEBUG = os.environ.get('FLASK_DEBUG') == 'True'
    
    # Configurações do banco de dados
    DB_HOST = os.environ.get('DB_HOST') or 'localhost'
    DB_USER = os.environ.get('DB_USER') or 'root'
    DB_PASSWORD = os.environ.get('DB_PASSWORD') or 'learnpro'
    DB_NAME = os.environ.get('DB_NAME') or 'site_agendamento'
    
    # Configurações JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-chave-secreta-padrao'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hora
    
    # Outras configurações
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
