
<?php
// Simple PHP script to process CSV files with leads
header('Content-Type: application/json');

// Check if a file was uploaded
if (!isset($_FILES['csvFile']) || $_FILES['csvFile']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'Nenhum arquivo foi enviado ou ocorreu um erro durante o upload.']);
    exit;
}

$file = $_FILES['csvFile']['tmp_name'];

// Read the CSV file
$handle = fopen($file, 'r');
if (!$handle) {
    echo json_encode(['error' => 'Não foi possível abrir o arquivo.']);
    exit;
}

// Read the header row
$headers = fgetcsv($handle, 1000, ',');
if (!$headers) {
    echo json_encode(['error' => 'O arquivo CSV está vazio ou mal formatado.']);
    fclose($handle);
    exit;
}

// Read the data rows
$data = [];
while (($row = fgetcsv($handle, 1000, ',')) !== false) {
    if (count($row) !== count($headers)) {
        continue; // Skip malformatted rows
    }
    
    $rowData = array_combine($headers, $row);
    $data[] = $rowData;
}
fclose($handle);

// Return the data
echo json_encode([
    'success' => true,
    'headers' => $headers,
    'data' => $data,
    'count' => count($data)
]);

// Helper function to get first name
function getFirstName($fullName) {
    if (empty($fullName)) return 'Futuro Aluno UniBF';
    
    $parts = explode(' ', trim($fullName));
    $firstName = $parts[0];
    // Capitalize only first letter
    return ucfirst(strtolower($firstName));
}

// Export function for ANSI encoded CSV file (non-UTF8)
function exportPhoneNumbers($numbers, $includeFirstName = false, $names = array()) {
    // Set headers for file download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="phone_numbers.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Open output stream
    $output = fopen('php://output', 'w');
    
    // Use Windows-1252 encoding (ANSI) instead of UTF-8
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    // Add header based on whether first name is included
    if ($includeFirstName) {
        fputcsv($output, ['fullNumber', 'Nome'], ',');
    } else {
        fputcsv($output, ['fullNumber'], ',');
    }
    
    // Add each phone number and name if requested
    foreach ($numbers as $number) {
        if ($includeFirstName) {
            $name = isset($names[$number]) ? $names[$number] : 'Futuro Aluno UniBF';
            fputcsv($output, [$number, $name], ',');
        } else {
            fputcsv($output, [$number], ',');
        }
    }
    
    fclose($output);
    exit;
}

// If this is an export request
if (isset($_POST['export']) && $_POST['export'] === 'true') {
    $numbers = json_decode($_POST['numbers'], true);
    $includeFirstName = isset($_POST['includeFirstName']) && $_POST['includeFirstName'] === 'true';
    $names = isset($_POST['names']) ? json_decode($_POST['names'], true) : array();
    exportPhoneNumbers($numbers, $includeFirstName, $names);
}
?>
