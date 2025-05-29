import requests

BASE_URL = "http://localhost:5000/api"

def login(email, senha, tipo_usuario):
    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": email,
        "senha": senha,
        "tipo_usuario": tipo_usuario
    }
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        data = response.json()
        print("Login successful!")
        print("User:", data.get("user"))
        print("Token:", data.get("token"))
        return data.get("token")
    else:
        print("Login failed:", response.status_code, response.text)
        return None

def get_atendentes(token, categoria, situacao="aprovado"):
    url = f"{BASE_URL}/atendentes"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "categoria": categoria,
        "situacao": situacao
    }
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        atendentes = data.get("atendentes", [])
        print(f"Found {len(atendentes)} atendentes in category '{categoria}':")
        for a in atendentes:
            print(f"- {a['nome']} (Qualificação: {a.get('qualificacao', '')})")
    else:
        print("Failed to fetch atendentes:", response.status_code, response.text)

if __name__ == "__main__":
    # Replace with valid test user credentials
    email = "outro@gmail.com"
    senha = "Oo123456"
    tipo_usuario = "atendente"

    token = login(email, senha, tipo_usuario)
    if token:
        # Test fetching attendants for each category
        categories = ["saude", "juridico", "carreira", "contabil", "assistencia_social"]
        for cat in categories:
            get_atendentes(token, cat)
