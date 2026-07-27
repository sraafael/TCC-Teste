/**
 * Arquivo: back-end/static/js/script.js
 * Area: Back-end Flask
 * Funcao: Funcoes JavaScript utilitarias usadas nas telas HTML do back-end.
 * Onde fica: /back-end/static/js/script.js
 */
// TODO: REFACTOR - A formatação de CPF e telefone está embutida em funções utilitárias, misturando regra de negócio de cadastro com apresentação.
// Formata CPF para o padrao 000.000.000-00 ao receber uma string livre.
function formatCpf(cpf) {
    return cpf.replace(/[^0-9]/g, '').replace(/(.{3})(.{3})(.{3})(.{2})/, '$1.$2.$3-$4');
}

// Formata telefone brasileiro no padrao (11) 99999-9999.
function formatPhoneNumber(phone) {
    return phone.replace(/[^0-9]/g, '').replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
}

// TODO: REFACTOR - A validação de formulário depende de campos específicos e de alertas globais, o que deixa a regra de negócio acoplada à UI.
// Validacao basica de formulario: impede submit caso campos essenciais estejam vazios.
function validateForm(form) {
    // Neste exemplo, cpf e phone sao obrigatorios para seguir com envio.
    if (!form.cpf.value || !form.phone.value) {
        alert('Please fill in all required fields.');
        return false;
    }
    return true;
}

// TODO: REFACTOR - A remoção automática de alerta manipula diretamente o DOM e o tempo, misturando comportamento de UI com estado visual.
// Fecha um alerta visual automaticamente apos o tempo configurado (em ms).
function autoCloseAlert(alertId, delay) {
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            // Oculta elemento sem remove-lo do DOM.
            alert.style.display = 'none';
        }
    }, delay);
}

// TODO: REFACTOR - A exportação para CSV concentra geração de arquivo, blob e download em uma função única, dificultando reuso para outros formatos.
// Exporta uma matriz de dados para CSV e dispara download no navegador.
function exportToCsv(filename, rows) {
    // Junta colunas por virgula e linhas por quebra de linha.
    const csvFile = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvFile], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
