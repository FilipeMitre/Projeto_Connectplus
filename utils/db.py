import pymysql
from pymysql.cursors import DictCursor
from config import Config

def get_connection():
    """Estabelece e retorna uma conexão com o banco de dados."""
    return pymysql.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        db=Config.DB_NAME,
        charset='utf8mb4',
        cursorclass=DictCursor,
        autocommit=True
    )

def execute_query(query, params=None, fetch_all=True):
    """Executa uma consulta SQL e retorna os resultados."""
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params or ())
            if fetch_all:
                return cursor.fetchall()
            return cursor.fetchone()
    finally:
        connection.close()

def execute_procedure(procedure_name, params=None):
    """Executa uma stored procedure e retorna os resultados."""
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.callproc(procedure_name, params or ())
            return cursor.fetchall()
    finally:
        connection.close()

def execute_transaction(queries):
    """Executa múltiplas consultas em uma transação."""
    connection = get_connection()
    try:
        connection.begin()
        with connection.cursor() as cursor:
            results = []
            for query, params in queries:
                cursor.execute(query, params or ())
                results.append(cursor.fetchall() if cursor.rowcount > 0 else None)
            connection.commit()
            return results
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        connection.close()

def insert_record(table, data):
    """Insere um registro em uma tabela e retorna o ID inserido."""
    columns = ', '.join(data.keys())
    placeholders = ', '.join(['%s'] * len(data))
    query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
    
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, list(data.values()))
            return cursor.lastrowid
    finally:
        connection.close()

def update_record(table, data, condition):
    """Atualiza registros em uma tabela com base em uma condição."""
    set_clause = ', '.join([f"{key} = %s" for key in data.keys()])
    where_clause = ' AND '.join([f"{key} = %s" for key in condition.keys()])
    query = f"UPDATE {table} SET {set_clause} WHERE {where_clause}"
    
    params = list(data.values()) + list(condition.values())
    
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.rowcount
    finally:
        connection.close()

def delete_record(table, condition):
    """Exclui registros de uma tabela com base em uma condição."""
    where_clause = ' AND '.join([f"{key} = %s" for key in condition.keys()])
    query = f"DELETE FROM {table} WHERE {where_clause}"
    
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, list(condition.values()))
            return cursor.rowcount
    finally:
        connection.close()