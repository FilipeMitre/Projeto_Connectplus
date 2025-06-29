# Connect+

## Descrição do Projeto

Este projeto é uma aplicação web construída com Flask, projetada para gerenciar usuários, prestadores de serviço e agendamentos. Ele oferece uma API backend para diversas operações e serve arquivos estáticos para o frontend da aplicação.

## Funcionalidades Principais (Baseado na estrutura do projeto)

*   Autenticação de usuários (login, registro)
*   Gerenciamento de usuários e prestadores de serviço
*   Criação e gerenciamento de agendamentos
*   Interface de usuário (frontend) para interação com o sistema

## Tecnologias Utilizadas

*   **Backend:** Python, Flask
*   **Banco de Dados:** MySQL (via PyMySQL)
*   **Autenticação:** Flask-JWT-Extended, bcrypt
*   **Validação de Dados:** Marshmallow
*   **Outras:** Flask-Cors, python-dotenv, Werkzeug, cryptography

## Configuração e Instalação

Siga estes passos para configurar e rodar o projeto localmente:

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd Connect+2.2
    ```

2.  **Crie e ative um ambiente virtual:**
    ```bash
    # Para Windows
    python -m venv venv
    venv\Scripts\activate

    # Para macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configuração do Banco de Dados:**
    *   Certifique-se de ter um servidor MySQL rodando.
    *   Crie um banco de dados para a aplicação.
    *   Atualize o arquivo `config.py` com as credenciais e detalhes de conexão do seu banco de dados. Você pode precisar criar um arquivo `.env` na raiz do projeto se a configuração usar variáveis de ambiente.

## Como Rodar a Aplicação

Com o ambiente virtual ativado e as dependências instaladas, você pode iniciar a aplicação Flask:

```bash
python app.py
