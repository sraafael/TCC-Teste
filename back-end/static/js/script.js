const CPF_PATTERN = /(.{3})(.{3})(.{3})(.{2})/;
const PHONE_PATTERN = /^(\d{2})(\d{5})(\d{4})$/;

function getDigits(value) {
    return value.replace(/[^0-9]/g, '');
}

function formatCpf(cpf) {
    return getDigits(cpf).replace(CPF_PATTERN, '$1.$2.$3-$4');
}

function formatPhoneNumber(phone) {
    return getDigits(phone).replace(PHONE_PATTERN, '($1) $2-$3');
}

function validateForm(form) {
    const hasRequiredFields = form.cpf.value && form.phone.value;
    if (!hasRequiredFields) {
        alert('Please fill in all required fields.');
        return false;
    }

    return true;
}

function autoCloseAlert(alertId, delay) {
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) alert.style.display = 'none';
    }, delay);
}

function createCsvContent(rows) {
    return rows.map((row) => row.join(',')).join('\n');
}

function exportToCsv(filename, rows) {
    const blob = new Blob([createCsvContent(rows)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('hidden', '');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
