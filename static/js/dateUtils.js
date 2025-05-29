// static/js/dateUtils.js
/**
 * Função para formatar datas considerando o fuso horário
 * Extrai a hora diretamente da string ISO para evitar conversão automática de fuso horário
 * @param {string} dataISOString - Data em formato ISO (ex: "2023-11-30T11:00:00Z")
 * @returns {string} Data formatada (ex: "30/11/2023 às 11:00")
 */
function formatarDataHora(dataISOString) {
    if (!dataISOString) return 'Data não disponível';
    
    try {
        // Criar uma data a partir da string ISO
        const data = new Date(dataISOString);
        
        // Formatar a data no padrão brasileiro
        const dataFormatada = data.toLocaleDateString('pt-BR');
        
        // Extrair as horas e minutos diretamente da string ISO
        // O formato esperado é: "2023-11-30T11:00:00" ou similar
        const horaMinuto = dataISOString.split('T')[1].substring(0, 5);
        
        return `${dataFormatada} às ${horaMinuto}`;
    } catch (error) {
        console.error("Erro ao formatar data:", error);
        return String(dataISOString);
    }
}